var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

var keyVaultProvider = "Microsoft.KeyVault";
var keyVaultResourceType = "vaults";

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('createKeyVault', function () {
        ux.isLoggedIn(state).then(() => {
            vscode.window.showInputBox({
                prompt: constants.promptNewKeyVault
            }).then(function (newKeyVaultName) {
                if (!newKeyVaultName || newKeyVaultName === "") return;

                state.keyVaultName = newKeyVaultName;
                state.resourceGroupToUse = state.keyVaultName + 'Resources';
                ux.getRegionsForResource(state, keyVaultProvider, keyVaultResourceType)
                	.then((result) => {
                    	state.keyVaultRegions = result.filter(x =>
                        	x.namespace === keyVaultProvider)[0].resourceTypes.filter(x =>
                            	x.resourceType === keyVaultResourceType)[0].locations;
                        ux.showNewOrExistingResourceGroupMenu(state).then(() => {
                            ux.ifKeyVaultNameIsAvailable(state)
                                .then(() => {
                                    vscode.window.showQuickPick(state.keyVaultRegions)
                                        .then(selectedRegion => {
                                            if (!selectedRegion || selectedRegion === "") return;
                                            state.selectedRegion = selectedRegion;
                                            ux.createKeyVault(state);
                                        });
                                });
                        });
   	              });
            });
        });
    });
};