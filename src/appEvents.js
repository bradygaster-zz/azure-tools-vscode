/* 
this class will evolve. not much here yet but the 
idea is to have something like an event aggregator 
so the architectural clean-up and refactoring can
get started.
*/

var util = require('util');
var EventEmitter = require('events').EventEmitter;

var appEvents = function () {
    console.log('appEvents created');

    var self = this;

    this.setContext = function (context) {
        self.context = context;
        console.log('context set');
    }
};

util.inherits(appEvents, EventEmitter);
module.exports = new appEvents();