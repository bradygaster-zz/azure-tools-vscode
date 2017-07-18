'option strict';

const vscode = require('vscode');

exports.getTenantId = function getTenantId() {
    var f = vscode.workspace.getConfiguration('azure');
    if (f != null) {
        if (f.tenantId != null)
            return f.tenantId;
    }
    return null;
};

exports.isTelemetryEnabled = function isTelemetryEnabled() {
    var f = vscode.workspace.getConfiguration('azure');
    if (f != null)
        if (f.enableTelemetry != null)
            if (typeof (f.enableTelemetry) === "boolean")
                return f.enableTelemetry

    return true;
};

exports.showToolsWindowOnStartup = function showToolsWindowOnStartup() {
    var f = vscode.workspace.getConfiguration('azure');
    if (f != null)
        if (f.showToolsWindowOnStartup != null)
            if (typeof (f.showToolsWindowOnStartup) === "boolean")
                return f.showToolsWindowOnStartup

    return true;
};
exports.wireUpServiceClientTelemetry = (serviceClient) => {
    var package = require('./../package.json');
    var clientVersion = require('util').format('%s/%s', 
        package.name,
        package.version);
    serviceClient.addUserAgentInfo(clientVersion);
}