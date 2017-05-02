var vscode = require('vscode');
var cp = require('copy-paste');
var ux = require('../ux');

var templateStorageConnectionString = 'DefaultEndpointsProtocol=https;AccountName={0};AccountKey={1};',
    promptConnectionStringCopied = 'The connection string for storage account "{0}" has been copied to your clipboard.';

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('azure.storage-getConnectionString', function () {
        ux.isLoggedIn(state).then(() => {
            ux.getStorageAccounts(state).then(function () {
                ux.showStorageAccountMenu(state).then((selected) => {
                    selectedAccount = state.storageAccountList.filter((x) => {
                        return x.name == selected;
                    })[0];

                    var matches = selectedAccount.id.match('.*resourceGroups/([^/]+)/providers.*');

                    if (matches.length > 0) {
                        state.resourceGroupToUse = matches[1];

                        ux.getStorageAccountKeys(state)
                            .then(() => {
                                var connectionString = templateStorageConnectionString.replace('{0}', selected);
                                connectionString = connectionString.replace('{1}', state.storageAccountKeyList[0].value);
                                cp.copy(connectionString);
                                vscode.window.showInformationMessage(promptConnectionStringCopied.replace('{0}', selected));
                            })
                            .catch(() => {
                            });
                    }
                });
            });
        });
    });
};