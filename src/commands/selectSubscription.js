var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('selectsubscription', function () {
        ux.isLoggedIn(state).then(() => {
            vscode.window.showQuickPick(state.subscriptionNames).then(selected => {

                // abort if user aborted
                if (!selected) return;

                state.subscriptions.forEach(function (element, index, array) {
                    if (element.name == selected) {
                        state.selectedSubscriptionId = element.id;
                        ux.getRegions(state).then(function () { });
                        vscode.window.setStatusBarMessage(constants.statusSubscriptionSelected.replace('{0}', element.name));
                    }
                });
            });
        });
    });
};