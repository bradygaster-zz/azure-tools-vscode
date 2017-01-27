var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var azure = require('../azure');
var constants = config.getConstants();
var open = require('open');
var path = require('path');
var fs = require('fs');

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('azure.template-export', function () {
        ux.isLoggedIn(state).then(() => {
            ux.exportTemplate(state);
        });
    });
};