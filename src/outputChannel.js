var vscode = require('vscode');
var config = require('./config');


var channel = null;

function newChannel() {
    console.log('new channel');

    channel = vscode.window.createOutputChannel('Azure Tools');
    if (config.showToolsWindowOnStartup()) {
        channel.show();
    }
    return channel;
}

var self = module.exports = {
    createChannel: function createChannel() {
        if (!channel) newChannel();
        return channel;
    }
};