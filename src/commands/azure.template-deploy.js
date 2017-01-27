var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var azure = require('../azure');
var constants = config.getConstants();
var open = require('open');
var path = require('path');
var fs = require('fs');

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('azure.template-deploy', function () {
        ux.isLoggedIn(state).then(() => {
            return new Promise((resolve, reject) => {
                if (!vscode.workspace) {
                    vscode.window.showErrorMessage(constants.promptNoWorkspaceOpen);
                    reject(constants.promptNoWorkspaceOpen);
                }

                if (!vscode.workspace.rootPath) {
                    reject(constants.promptNoWorkspaceOpen);
                }

                var srcpath = path.join(vscode.workspace.rootPath, constants.armTemplatesPath);
                var directories = fs.readdirSync(srcpath).filter(function (file) {
                    return fs.statSync(path.join(srcpath, file)).isDirectory();
                });

                vscode.window.showQuickPick(directories).then((selectedTemplate) => {
                    state.SelectedTemplateFile = path.join(vscode.workspace.rootPath, 'arm-templates', selectedTemplate ,'azuredeploy.json');
                    state.SelectedTemplateParametersFile = path.join(vscode.workspace.rootPath, 'arm-templates', selectedTemplate, 'azuredeploy.parameters.json');

                    state.selectedTemplateName = selectedTemplate;

                    // new or existing resource group?
                    vscode.window.showQuickPick([
                        constants.optionExistingRg,
                        constants.optionNewRg
                    ]).then(selected => {
                        // existing
                        if (selected == constants.optionExistingRg) {
                            ux
                                .getResourceGroups(state)
                                .then(function () {
                                    // show the list in a quickpick
                                    vscode.window.showQuickPick(state.resourceGroupList)
                                        .then(function (selectedRg) {

                                            if (!selectedRg) return;

                                            state.resourceGroupToUse = selectedRg;

                                            ux.deployTemplate(state);
                                        });
                                })
                                .catch(function (err) {
                                    vscode.window.showErrorMessage(err);
                                });
                        }
                        // new
                        else if (selected == constants.optionNewRg) {
                            vscode.window.showInputBox({
                                prompt: constants.promptNewRgName
                            }).then(function (newResourceGroupName) {
                                if (!newResourceGroupName || newResourceGroupName === "") return;
                                state.resourceGroupToUse = newResourceGroupName;
                                ux.createResourceGroup(state, function () {
                                    ux.deployTemplate(state);
                                });
                            });
                        }
                    });
                });
            });
        });
    });
};