#!/usr/bin/env node

var optimist = require('optimist'),
    package = require('../package.json'),
    skyrun = require('../');


var argv = optimist
  .usage('Usage: $0 [-i identity_file] [user@]hostname script')
  .describe('i', 'Identity file')
  .check(function(argv) {
    if (argv._[0] === undefined || argv._[1] === undefined) {
      throw new Error('Invalid arguments. Ensure both host and script are past');
    }
  })
  .argv;
  
var options = {};
var script = argv._[1];

// Set identity file
if (argv.i) {
  options.identity = argv.i
}

// Parse host
var hostArgs = argv._[0].split('@');

if (hostArgs.length > 1) {
  options.user = hostArgs.shift();
}
else {
  // options.user = 
}

options.host = hostArgs.shift();

var server = skyrun.createServer(options);
	
server.on('stdout', function(data) {
  process.stdout.write(data);
});

server.on('stderr', function(data) {
  process.stderr.write(data);
});

server.run(script, function(stderr, stdout) {
  if (stderr instanceof Error) {
    process.stderr.write(stderr.message);
  }
});