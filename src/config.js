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

exports.isStartAutomatically = function isStartAutomatically() {
    var f = vscode.workspace.getConfiguration('azure');
    if (f != null)
        if (f.startAutomatically != null)
	   if (typeof (f.startAutomatically) === "boolean")
                return f.startAutomatically

    return true;
};

exports.wireUpServiceClientTelemetry = (serviceClient) => {
    var package = require('./../package.json');
    var clientVersion = require('util').format('%s/%s',
        package.name,
        package.version);
    serviceClient.addUserAgentInfo(clientVersion);
}
