var fs = require('fs'),
    util = require('util'),
    fs = require('fs'),
    spawn = require('child_process').spawn,
    crypto = require('crypto'),
    events = require('events');

var _ = require('underscore'),
    async = require('async');

var generationRandomString = function (len, charSet) {
  var charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var randomString = '';
  for(var i = 0; i < len; i++) {
    var randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz, randomPoz+1);
  }

  return randomString;
}

var sshOptions = ['-o StrictHostKeyChecking=no', '-o UserKnownHostsFile=/dev/null']

var Server = function(options) {
  events.EventEmitter.call(this);
  this.options = options;
}

util.inherits(Server, events.EventEmitter);

_.extend(Server.prototype, {
  run: function(script, cb) {
    var server = this
    var remoteScript = '/tmp/skyrun-'+generationRandomString(10);
    
    server.scp(script, remoteScript, function (err, stderr) {
      if (err) {
        return cb(err, stderr);
      }
      server.ssh('chmod 755 '+remoteScript+' && '+remoteScript+' && rm '+remoteScript, cb);
    });
  },
  listen: function(child, cb) {
    var that = this;
    
    var stdout = '';
    child.stdout.addListener('data', function (data) {
      that.emit('stdout', data.toString());
      stdout += data; 
    });
    
    var stderr = '';
    child.stderr.addListener('data', function (data) {
      that.emit('stderr', data);
      stderr += data;
    });

    child.addListener('exit', function (code) {
      that.emit('exit', code);
      if (code !== 0) {
        var err = new Error();
        err.code = code;
        return cb(err, stderr, stdout);
      }
      
      return cb(null, stderr, stdout);
    });
    
    this.emit('spawn', child);
  },
  formatIdentity: function(options) {
    var args = [];
    
    // Set identity path
    if (_.has(options, 'identity')) {
      args.push('-i');
      args.push(options['identity']);
    }
    
    return args;
  },
  formatDestination: function(options){
    if (!_.has(options, 'host')) { 
      throw new Error('Host option is required');
    }
    
    var args = [];
    var user = options['user'] || process.env.USER;
    
    var destination = user+'@'+options['host'];
    
    args.push(destination);
    
    return args;
  },
  ssh: function(command, cb) {
    var args = _.union(this.formatIdentity(this.options), sshOptions, this.formatDestination(this.options));
    args.push("''" + command + "''");
    
    var child = spawn('ssh', args); 
    this.listen(child, cb);
    return child;
  },
  scp: function(local, remote, cb) {
    if (!local) { 
      return cb(new Error(this.options['host'] + ': No local file path'));
    }

    if (!remote) { 
      return cb(new Error(this.options['host'] + ': No remote file path'));
    }
    
    var server = this
    
    fs.exists(local, function (exists) {
      if (!exists) {
        return cb(new Error("Local script '"+local+"' does not exist"));
      }
      
      var destination = server.formatDestination(server.options);
      destination += ":"+remote;
      
      var args =  _.union(server.formatIdentity(server.options), sshOptions, [local, destination]);
      var child = spawn('scp', args);
      server.listen(child, cb);
    });
  }
});

module.exports = Server;
