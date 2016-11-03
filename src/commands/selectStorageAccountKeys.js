var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('selectStorageAccountKeys', function () {
        ux.getResourceGroups(state).then(() => {
            ux.showResourceGroupsMenu(state, () => {
                ux.getStorageAccounts(state).then(() => {
                    ux.showStorageAccountMenu(state, () => {
                        ux.getStorageAccountKeys(state)
                        .then((result) => {
                            console.log(state.storageAccountKeyList);
                        });
                    });
                });
            });
        });
    });
};