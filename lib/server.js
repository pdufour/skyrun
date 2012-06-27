var fs = require('fs'),
    path = require('path'),
    spawn = require('child_process').spawn,
    crypto = require('crypto');

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
      
module.exports = {
  run: function(script, cb) {
    var server = this
    var remoteScript = '/tmp/skynet-'+generationRandomString(10);
    
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
      if (stderr === '') {
        return cb(null, stdout);
      } else {
        return cb({'code': code, 'error':stderr}, stdout);
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
    var args = [];
    
    var destination = '';
    
    // Set user
    if (_.has(options, 'user')) {
      destination += options['user'];
    }
    
    // Set host
    if (destination.length > 0) {
      destination += '@';
    }
    
    destination += options['host'];
    
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
        throw cb(new Error('Local: ' + local + ' does not exist'));
      }
      
      var destination = server.formatDestination(server.options);
      destination += ":"+remote;
      
      var args =  _.union(server.formatIdentity(server.options), [local, destination]);
      var child = spawn('scp', args);
      server.listen(child, cb);
    });
  }
}
