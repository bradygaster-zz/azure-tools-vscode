var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('createKeyVault.simple', function () {
        vscode.window.showInputBox({
            prompt: constants.promptNewKeyVault
        }).then(function (newKeyVaultName) {
            if (!newKeyVaultName || newKeyVaultName === "") return;
            
            state.keyVaultName = newKeyVaultName;
            state.resourceGroupToUse = state.keyVaultName + 'Resources';

            ux.createResourceGroup(state,
                function () {
                    ux.ifKeyVaultNameIsAvailable(state).then(()=> {
                        ux.createKeyVault(state);
                    }).catch((message) => {
                        vscode.window.showErrorMessage(message);
                    })
            }).catch((message) =>{
                vscode.window.showErrorMessage(message);
            })
        }).catch((message) => {
            vscode.window.showErrorMessage(message);
        })   
    });
};