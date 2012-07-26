var spawn = require('child_process').spawn,
    EventEmitter = require('events').EventEmitter;
    
var Server = require('./server');

module.exports = {
  createServer: function(options) {
    return new Server(options);
  }
}