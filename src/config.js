'option strict';

const vscode = require('vscode');

exports.getConstants = function getConstants() {
    return {
        armTemplatesPath: 'arm-templates',
        promptNewWebAppName: 'Web App Name',
        promptNewRgName: 'New Resource Group Name:',
        promptNoWorkspaceOpen: 'You do not have a directory open so there is no workspace.',
        optionNewRg: 'Create new resource group',
        optionExistingRg: 'Use existing resource group',
        selectedTemplateName: null
    };
};

exports.getTenantId = function getTenantId() {
    var f = vscode.workspace.getConfiguration('azure');
    if (f != null) {
        if (f.tenantId != null)
            return f.tenantId;
    }
    return null;
};