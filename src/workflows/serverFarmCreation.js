var vscode = require('vscode');

// config and services
var ux = require('../ux');
var constants = require('../constants').Constants;

var optionUseExistingHostingPlan = 'Use an existing server farm',
    optionNewHostingPlan = 'Create a new server farm',
    promptNoFarmInResourceGroup = 'The resource group you selected doesn\'t have any server farms.',
    promptNewServerFarm = 'Server Farm Name';

exports.doNewOrExistingServerFarmWorkflow = function doNewOrExistingServerFarmWorkflow(state, callback) {
    var statusCreatingServerFarm = 'Creating server farm {0}';
    
    // decide if we should use an existing farm or make a new one
    vscode.window.showQuickPick([
        optionUseExistingHostingPlan,
        optionNewHostingPlan
    ]).then(selected => {
        if (selected == optionUseExistingHostingPlan) {
            ux
                .getServerFarms(state)
                .then(function () {
                    if (state.serverFarmList.length == 0)
                        vscode.window.showErrorMessage(promptNoFarmInResourceGroup);
                    else {
                        vscode.window.showQuickPick(state.serverFarmList)
                            .then(function (selectedServerFarm) {
                                if (!selectedServerFarm) return;
                                state.selectedServerFarm = selectedServerFarm;
                                callback();
                            });
                    }
                });
        }
        else if (selected == optionNewHostingPlan) {
            vscode.window.showInputBox({ prompt: promptNewServerFarm })
                .then(function (newServerFarmName) {

                    if (!newServerFarmName || newServerFarmName === '') return;

                    state.selectedServerFarm = newServerFarmName;
                    vscode.window.setStatusBarMessage(statusCreatingServerFarm.replace('{0}', state.selectedServerFarm, 5000));
                    ux.createServerFarm(state, function () {
                        callback();
                    });
                });
        }
    });
};