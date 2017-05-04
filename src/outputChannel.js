var vscode = require('vscode');

var channel = null;

function newChannel() {
    console.log('new channel');

    channel = vscode.window.createOutputChannel('Azure Tools');
    channel.show();
    return channel;
}

var self = module.exports = {
    createChannel: function createChannel() {
        if (!channel) newChannel();
        return channel;
    }
};