var appInsights = require('applicationinsights');
var config = require('./config');
var constants = require('./constants').Constants;

var telemetryClient = null;

function newTelemetryClient() {
    telemetryClient = appInsights
        .setup(constants.telemetryKey)
        .setAutoCollectConsole(false)
        .setAutoCollectExceptions(false)
        .setAutoCollectPerformance(false)
        .setAutoCollectRequests(false)
        .start()
        .client;
}

class Telemetry {
    constructor() {
        if (!telemetryClient) {
            newTelemetryClient();
            console.log('client created');
        }
    }

    recordEvent(eventName, properties, measures) {
        if (!config.isTelemetryEnabled) return;
        if (!config.isTelemetryEnabled()) return;
        telemetryClient.trackEvent(eventName, properties, measures);
    }

    recordMetric(metricName, value) {
        if (!config.isTelemetryEnabled) return;
        if (!config.isTelemetryEnabled()) return;
        telemetryClient.trackMetric(metricName, value);
    }
}

var self = module.exports = {
    createClient: () => {
        return new Telemetry();
    }
};