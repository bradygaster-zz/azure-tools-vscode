var vscode = require('vscode');
var ux = require('../ux');
var keyVaultProvider = "Microsoft.KeyVault";
var keyVaultResourceType = "vaults";
var promptNewKeyVault = 'New Key Vault Name:';

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('azure.keyVault-create', function () {
        ux.isLoggedIn(state).then(() => {
            vscode.window.showInputBox({
                prompt: promptNewKeyVault
            })
            .then(function (newKeyVaultName) {
                if (!newKeyVaultName || newKeyVaultName === "") return;

                state.keyVaultName = newKeyVaultName;
                state.resourceGroupToUse = state.keyVaultName + 'Resources';
                ux.getRegionsForResource(state, keyVaultProvider, keyVaultResourceType)
                    .then((result) => {
                        state.keyVaultRegions = result.filter(x =>
                            x.namespace === keyVaultProvider)[0].resourceTypes.filter(x =>
                                x.resourceType === keyVaultResourceType)[0].locations;
                        ux.showNewOrExistingResourceGroupMenu(state)
                            .then(() => {
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