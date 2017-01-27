var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('azure.region-select', function () {
        ux.isLoggedIn(state).then(() => {
            ux.getRegions(state).then(function () {
                ux.showRegionMenu(state);
            });
        });
    });
};