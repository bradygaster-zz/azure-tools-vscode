var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('azure.armgallerysearch', function () {
        vscode.window.showInputBox({
            prompt: constants.promptGallerySearch
        }).then(function (filter) {
            ux.searchArmGallery(state)
        });
    });
};