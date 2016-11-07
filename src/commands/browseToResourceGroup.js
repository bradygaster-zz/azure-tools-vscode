var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();
var open = require('open');

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('browseResourceGroupInPortal', function () {
        ux.getResourceGroups(state).then(() => {
            ux.showResourceGroupsMenu(state, () => {
                open(constants.templateResourceGroupUrl
                    .replace('{subscriptionId}', state.selectedSubscriptionId)
                    .replace('{resourceGroup}', state.resourceGroupToUse)
                );
            });
        });
    });
};