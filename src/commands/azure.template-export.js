var vscode = require('vscode');
var ux = require('../ux');
var azure = require('../azure');
var open = require('open');
var path = require('path');
var fs = require('fs');

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('azure.template-export', function () {
        ux.isLoggedIn(state)
            .then(() => {
                ux.isFolderOpen()
                    .then(() => {
                        ux.exportTemplate(state);
                    });
            });
    });
};