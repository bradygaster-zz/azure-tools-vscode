var vscode = require('vscode');
var ux = require('../ux');
var open = require('open');
var telemetry = require('../telemetry').createClient();
var commandName = 'azure.browse-resource';

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand(commandName, () => {
        ux.isLoggedIn(state)
            .then(() => {
                
                telemetry.recordEvent(commandName, {
                    subscriptionId: state.selectedSubscriptionId
                });

                ux.getAzureResources(state)
                    .then(function (names) {
                        vscode.window.showQuickPick(names)
                            .then(function (selected) {
                                if (selected != null && selected.length > 0) {
                                    filtered = state.entireResourceList.filter(function (value) {
                                        return value.id.endsWith(selected);
                                    });
                                    if (filtered != null)
                                        open("https://portal.azure.com/#resource" + filtered[0].id);
                                }
                            });
                    })
                    .catch(function (err) {
                        vscode.window.showErrorMessage(err);
                    });
            });
    });
};