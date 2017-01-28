var vscode = require('vscode');
var ux = require('../ux');
var menu = require('../menu').menu;

var statusSubscriptionSelected = 'Selected subscription: "{0}".';
var commandName = 'azure.subscription-select';

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand(commandName, function () {
        ux.isLoggedIn(state).then(() => {
            vscode.window.showQuickPick(state.subscriptionNames)
                .then(selected => {

                    // abort if user aborted
                    if (!selected) return;

                    state.subscriptions.forEach((element, index, array) => {
                        if (selected == (element.name + ' (' + element.id + ')')) {
                            state.selectedSubscriptionId = element.id;
                            ux.getRegions(state).then(function () { });
                            menu.updateButtonTooltip(commandName, statusSubscriptionSelected.replace('{0}', element.name));
                            vscode.window.setStatusBarMessage(statusSubscriptionSelected.replace('{0}', element.name));
                        }
                    });
                });
        });
    });
};