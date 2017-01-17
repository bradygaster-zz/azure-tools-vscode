var vscode = require('vscode');
var cp = require('copy-paste');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('storageAccountGetConnectionString', function () {
        ux.isLoggedIn(state).then(() => {
            ux.getStorageAccounts(state).then(function () {
                ux.showStorageAccountMenu(state).then((selected) => {
                    selectedAccount = state.storageAccountList.filter((x) => {
                        return x.name == selected;
                    })[0];

                    var matches = selectedAccount.id.match('.*resourceGroups/([^/]+)/providers.*');

                    if (matches.length > 0) {
                        state.resourceGroupToUse = matches[1];
                        console.log(state.resourceGroupToUse);

                        ux.getStorageAccountKeys(state)
                            .then(() => {
                                console.log(state.storageAccountKeyList[0]);
                                var connectionString = constants.templateStorageConnectionString.replace('{0}', selected);
                                connectionString = connectionString.replace('{1}', state.storageAccountKeyList[0].value);
                                cp.copy(connectionString);
                                vscode.window.showInformationMessage(constants.promptConnectionStringCopied.replace('{0}', selected));
                            })
                            .catch(() => {
                                console.log('Storage_Key_Missing')
                            });
                    }
                });
            });
        });
    });
};