var vscode = require('vscode');
var ux = require('../ux');
var constants = require('../constants').Constants;

var provider = "Microsoft.Batch";
var resourceType = "batchAccounts";
var promptNewBatchAccount = 'New Batch Account Name:';

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('azure.batch-create', function () {
        ux.isLoggedIn(state).then(() => {
            vscode.window.showInputBox({
                prompt: promptNewBatchAccount
            })
            .then(function (newBatchAccountName) {
                if (!newBatchAccountName || newBatchAccountName === "") return;

                state.batchAccountName = newBatchAccountName;
                state.resourceGroupToUse = state.newBatchAccountName + 'Resources';
                
                ux.getRegionsForResource(state, provider, resourceType)
                    .then((result) => {
                        state.batchAccountRegions = result.filter(x =>
                            x.namespace === provider)[0].resourceTypes.filter(x =>
                                x.resourceType === resourceType)[0].locations;
                        ux.showNewOrExistingResourceGroupMenu(state)
                            .then(() => {
                                ux.ifBatchAccountNameIsAvailable(state)
                                    .then(() => {
                                        vscode.window.showQuickPick(state.batchAccountRegions)
                                            .then(selectedRegion => {
                                                if (!selectedRegion || selectedRegion === "") return;
                                                state.selectedRegion = selectedRegion;
                                                ux.createBatchAccount(state);
                                            });
                                    })
                                    .catch(function (message) {
                                        vscode.window.showErrorMessage(message);
                                    });
                            });
                    });
            });
        });
    });
};