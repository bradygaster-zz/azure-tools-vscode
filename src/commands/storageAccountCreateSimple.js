var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('createstorageaccount.simple', function () {
        vscode.window.showInputBox({
            prompt: constants.promptCreateNewStorageAccount
        }).then(function (newStorageAccountName) {

            if (!newStorageAccountName || newStorageAccountName === "") return;

            state.selectedStorageAccount = newStorageAccountName;
            state.resourceGroupToUse = state.selectedStorageAccount + 'Resources';

            ux.ifStorageAccountNameIsAvailable(state).then(() => {
                ux.createResourceGroup(state, () => {
                    ux.createStorageAccount(state);
                });
            }).catch((message) => {
                vscode.window.showErrorMessage(message);
            });
        });
    });
};