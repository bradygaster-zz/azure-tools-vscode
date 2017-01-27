var util = require('util');
var EventEmitter = require('events').EventEmitter;
var appEvents = function () {
    var self = this;

    this.setContext = function (context) {
        self.context = context;
        console.log('context set');
    }

    this.on('loggedIn', (state) => {
        console.log('logged in');
    });

    this.loggedIn = function (state) {
        this.emit('loggedIn', state);
    }
};
util.inherits(appEvents, EventEmitter);
module.exports = new appEvents();