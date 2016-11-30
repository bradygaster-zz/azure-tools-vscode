var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('searchArmGallery', function () {
        vscode.window.showInputBox({
            prompt: constants.promptSearchArmGallery
        }).then(function (searchTerm) {
            // if searchTerm null return all

            state.AzureGallerySearchTerm = searchTerm;

            ux.searchArmGallery(state).then(() => {
                vscode.window.showQuickPick(state.AzureGalleryList).then(() => {
                    console.log(JSON.stringify(selectedItem));
                }).catch((err) => {
                    vscode.window.showErrorMessage(err);
                });
            })
        }).catch(function (err) {

        })
    })
}