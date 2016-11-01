var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('selectStorageAccount', function () {
        ux.getStorageAccounts(state).then(function () {
            ux.showStorageAccountMenu(state);
        });
    });
};