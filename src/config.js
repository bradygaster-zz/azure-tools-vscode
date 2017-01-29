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