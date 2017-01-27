var vscode = require('vscode');
var ux = require('../ux');
var statusSubscriptionSelected = 'You selected subscription "{0}".';

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('azure.subscription-select', function () {
        ux.isLoggedIn(state).then(() => {
            vscode.window.showQuickPick(state.subscriptionNames)
                .then(selected => {

                    // abort if user aborted
                    if (!selected) return;

                    state.subscriptions.forEach((element, index, array) => {
                        if (element.name == selected) {
                            state.selectedSubscriptionId = element.id;
                            ux.getRegions(state).then(function () { });
                            vscode.window.setStatusBarMessage(statusSubscriptionSelected.replace('{0}', element.name));
                        }
                    });
                });
        });
    });
};