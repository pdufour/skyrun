var mockery = require('mockery');

mockery.registerAllowable('../lib/skyrun');
mockery.registerAllowable('./server');
mockery.registerAllowable('fs');
mockery.registerAllowable('path');
mockery.registerAllowable('http');
mockery.registerAllowable('util');
mockery.registerAllowable('crypto');
mockery.registerAllowable('underscore');
mockery.registerAllowable('events');
mockery.registerAllowable('async');
mockery.registerAllowable('./lib/async');
mockery.registerAllowable('should');
mockery.registerAllowable('./eql');
mockery.registerAllowable('assert');

mockery.enable();

after(function(){
  mockery.disable();
});

var EventEmitter = require('events').EventEmitter;

mockChildProcess = {
  spawn: function(cmd, args, options) {
    var mockchild = new EventEmitter();
    mockchild.stdout = new EventEmitter();
    mockchild.stderr = new EventEmitter();
    
    return mockchild;
  }
};

mockery.registerMock('child_process', mockChildProcess);

var skyrun = require('../lib/skyrun');
var should = require('should');

var options = {
  'identity':process.env.HOME+'/.ssh/id_rsa',
  'host':'127.0.0.1',
  'user':process.env.USER
};

describe('Skyrun', function() {
  it('should correctly generate identification arguments', function(done) {
    var server = skyrun.createServer(options);
    
    server.formatIdentity(options).should.eql ['-i', options['identity']];
    done();
  });
  
  it('should correctly generate host destination arguments', function(done) {
    var server = skyrun.createServer(options);
    
    server.formatDestination(options).should.eql [options['user']+'@'+options['host']];
    done();
  });
  
  it('should login and execute script', function(done) {
    var server = skyrun.createServer(options);
    
    server.on('spawn', function(child) {
      should.exist(child);
  
      child.stdout.emit('data', "OK\n");
      child.emit('exit', 0);
    });
    
    server.run('./test/testscript.sh', function(stderr, stdout) {
      should.not.exist(stderr);
      // Trim output
      stdout = stdout.replace(/^\s+|\s+$/g, '');
      
      stdout.should.eql('OK');
      done();
    });
  });
  
  it('should return error if script does not exit as expected', function(done) {
    var server = skyrun.createServer(options);
    
    server.on('spawn', function(child) {
      should.exist(child);

      child.stderr.emit('data', "Something fucked up happened");
      child.emit('exit', 1);
    });
    
    server.run('./test/testscript.sh', function(stderr, stdout) {
      should.exist(stderr);
      stderr.code.should.eql(1);
      stderr.error.should.eql("Something fucked up happened");
      done();
    });
  });
});