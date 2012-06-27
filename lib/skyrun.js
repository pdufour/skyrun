var _ = require('underscore'),
    spawn = require('child_process').spawn,
    EventEmitter = require('events').EventEmitter;
    
var serverPrototype = require('./server');

module.exports = {
  createServer: function(options) {
    if (!_.has(options, 'host')) { 
      throw new Error('Host option is required');
    }
    
    var server = _.extend(new EventEmitter, serverPrototype);
    server.options = options;
    
    return server;
  }
}