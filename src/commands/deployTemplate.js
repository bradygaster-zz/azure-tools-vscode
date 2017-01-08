var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();
var open = require('open');

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('deployTemplate', function () {
        if(!vscode.workspace) {
            vscode.window.showErrorMessage(constants.promptNoWorkspaceOpen);
            return;
        }
        
        state.SelectedTemplateFile = vscode.workspace.rootPath + 'azuredeploy.json';
        state.SelectedTemplateParametersFile = vscode.workspace.rootPath + 'azuredeploy.parameters.json';
    });
};