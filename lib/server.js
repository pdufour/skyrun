var fs = require('fs'),
    util = require('util'),
    path = require('path'),
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

var Server = function(options) {
  events.EventEmitter.call(this);
  this.options = options;
}

util.inherits(Server, events.EventEmitter);

_.extend(Server.prototype, {
  run: function(script, cb) {
    var server = this
    var remoteScript = '/tmp/skyrun-'+generationRandomString(10);
    
    async.series([
      function (done) {
        server.scp(script, remoteScript, done);
      },
      function (done) {
        server.ssh('chmod 755 '+remoteScript+' && '+remoteScript+' && rm '+remoteScript, done);
      }
    ], function(err, results) {
      if (err) {
        return cb(err);
      }
      
      return cb(null, results[1]);
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
      if (stderr !== '' || code !== 0) {
        return cb({'code': code, 'error': stderr}, stdout);
      } else {  
        return cb(null, stdout);
      }
    });
    
    this.emit('spawn', child);
  },
  formatIdentity: function(options) {
    var args = [];
    
    // Set identity path
    if (_.has(options, 'identity')) {
      args.push('-i');
      args.push(options['identity']);
      delete options['identity'];
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
    var args = _.union(this.formatIdentity(this.options), this.formatDestination(this.options));
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
    
    path.exists(local, function (exists) {
      if (!exists) {
        return cb(new Error("Local script '"+local+"' does not exist"));
      }
      
      var destination = server.formatDestination(server.options);
      destination += ":"+remote;
      
      var args =  _.union(server.formatIdentity(server.options), [local, destination]);
      var child = spawn('scp', args);
      server.listen(child, cb);
    });
  }
});

module.exports = Server;
