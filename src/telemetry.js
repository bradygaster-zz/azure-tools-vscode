var appInsights = require('applicationinsights');
var config = require('./config');
var constants = require('./constants').Constants;

var telemetryClient = null;

function newTelemetryClient() {
    telemetryClient = appInsights
        .setup(constants.telemetryKey)
        .setAutoDependencyCorrelation(false)
        .setAutoCollectRequests(false)
        .setAutoCollectPerformance(false)
        .setAutoCollectExceptions(false)
        .setAutoCollectDependencies(false)
        .setAutoCollectConsole(false)
        .start()
        .client;

    telemetryClient.addTelemetryProcessor((envelope, context) => {
        if (envelope.iKey == constants.telemetryKey 
            && envelope.data.baseType == "EventData") {
            return true;
        }
        return false;
    });
}

class Telemetry {
    constructor() {
        if (!telemetryClient) {
            newTelemetryClient();
        }
    }

    recordEvent(eventName, properties, measures) {
        if (!config.isTelemetryEnabled) return;
        if (!config.isTelemetryEnabled()) return;
        telemetryClient.trackEvent(eventName, properties, measures);
    }
}

var self = module.exports = {
    createClient: () => {
        return new Telemetry();
    }
};