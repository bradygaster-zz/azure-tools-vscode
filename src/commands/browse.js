var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();
var open = require('open');

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('browseInPortal', function () {
        ux.isLoggedIn(state).then(() => {
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