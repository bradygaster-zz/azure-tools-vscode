var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('azure.functionApp-create-advanced', function () {
        ux.isLoggedIn(state).then(() => {
            vscode.window.showInputBox({
                prompt: constants.promptNewFunctionAppName
            }).then(function (newWebSiteName) {

                if (!newWebSiteName || newWebSiteName === "") return;

                state.newWebAppName = newWebSiteName;
                ux
                    .ifWebSiteNameIsAvailable(state)
                    .then(function () {
                        // name is available so we need to know a resource group to use
                        vscode.window.showQuickPick([
                            constants.optionExistingRg,
                            constants.optionNewRg
                        ]).then(selected => {
                            if (selected == constants.optionExistingRg) {
                                ux
                                    .getResourceGroups(state)
                                    .then(function () {
                                        // show the list in a quickpick
                                        vscode.window.showQuickPick(state.resourceGroupList)
                                            .then(function (selectedRg) {

                                                if (!selectedRg) return;

                                                state.resourceGroupToUse = selectedRg;
                                                require('../workflows/serverFarmCreation').doNewOrExistingServerFarmWorkflow(state, function () {
                                                    ux.createFunction(state);
                                                });
                                            });
                                    })
                                    .catch(function (err) {
                                        vscode.window.showErrorMessage(err);
                                    });
                            }
                            else if (selected == constants.optionNewRg) {
                                vscode.window.showInputBox({
                                    prompt: constants.promptNewRgName
                                }).then(function (newResourceGroupName) {

                                    if (!newResourceGroupName || newResourceGroupName === "") return;

                                    state.resourceGroupToUse = newResourceGroupName;
                                    ux.createResourceGroup(state, function () {
                                        require('../workflows/serverFarmCreation').doNewOrExistingServerFarmWorkflow(state, function () {
                                            ux.createFunction(state);
                                        });
                                    });
                                });
                            }
                        });
                    })
                    .catch(function (message) {
                        vscode.window.showErrorMessage(message);
                    });
            });
        });
    });
};