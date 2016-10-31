var vscode = require('vscode');

// config and services
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

exports.doNewOrExistingServerFarmWorkflow = function doNewOrExistingServerFarmWorkflow(state, callback) {
    // decide if we should use an existing farm or make a new one
    vscode.window.showQuickPick([
        constants.optionUseExistingHostingPlan,
        constants.optionNewHostingPlan
    ]).then(selected => {
        if (selected == constants.optionUseExistingHostingPlan) {
            ux
                .getServerFarms(state)
                .then(function () {
                    if (state.serverFarmList.length == 0)
                        vscode.window.showErrorMessage(constants.promptNoFarmInResourceGroup);
                    else {
                        vscode.window.showQuickPick(state.serverFarmList)
                            .then(function (selectedServerFarm) {
                                if (!selectedServerFarm) return;
                                state.selectedServerFarm = selectedServerFarm;
                                callback();
                            })
                            .catch(function (err) {
                                vscode.window.showErrorMessage(err);
                            });
                    }
                });
        }
        else if (selected == constants.optionNewHostingPlan) {
            vscode.window.showInputBox({ prompt: constants.promptNewServerFarm })
                .then(function (newServerFarmName) {

                    if (!newServerFarmName || newServerFarmName === '') return;

                    state.selectedServerFarm = newServerFarmName;
                    vscode.window.setStatusBarMessage(constants.statusCreatingServerFarm.replace('{0}', state.selectedServerFarm));
                    ux.createServerFarm(state, function () {
                        callback();
                    });
                });
        }
    });
};