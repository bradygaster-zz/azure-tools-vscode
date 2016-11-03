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
                            console.log(result);
                        });
                    });
                });
            });
        });
        
        // var filePath = "c:\\cur\\abc.txt"; // abc does not exist
        // var fileUri = vscode.Uri.parse('untitled:' + filePath);
        // vscode.workspace.openTextDocument(fileUri)
        // .then((doc) => {
        //     vscode.window.showTextDocument(doc);
        // })
        // .catch((err) => {
        //     console.log(err);
        // });
    });
};