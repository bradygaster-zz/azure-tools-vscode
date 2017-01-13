var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

var keyVaultProvider = "Microsoft.KeyVault"; 
var keyVaultResourceType = "vaults";

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('createKeyVault.simple', function () {
        vscode.window.showInputBox({
            prompt: constants.promptNewKeyVault
        }).then(function (newKeyVaultName) {
            if (!newKeyVaultName || newKeyVaultName === "") return;
            
            state.keyVaultName = newKeyVaultName;
            state.resourceGroupToUse = state.keyVaultName + 'Resources';

            ux.createResourceGroup(state, function () {
                ux.ifKeyVaultNameIsAvailable(state)
                .then(function () {
                        //name is available so we need to know the region to use
                    ux.getRegionsForResource(state, keyVaultProvider, keyVaultResourceType).then(function(result){
                        state.keyVaultRegions = result.filter(x => x.namespace === "Microsoft.KeyVault")[0].resourceTypes.filter(x => x.resourceType === "vaults")[0].locations;
                        vscode.window.showQuickPick(state.keyVaultRegions)
                        .then(selectedRegion => {
                                
                        if (!selectedRegion || selectedRegion === "") return;

                        state.region = selectedRegion;
                        ux.createKeyVault(state);
                        });
                    }) 
                })
            })
        }) 
    });
};