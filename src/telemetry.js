var appInsights = require('applicationinsights');
var config = require('./config');
var constants = require('./constants').Constants;

class Telemetry {
    constructor() {
        if (!config.isTelemetryEnabled) return;
        this.telemetryClient = appInsights
            .setup(constants.telemetryKey)
            .setAutoCollectConsole(false)
            .setAutoCollectExceptions(false)
            .setAutoCollectPerformance(false)
            .setAutoCollectRequests(false)
            .start()
                .client;
    }

    recordEvent(eventName, properties, measures) {
        if (!config.isTelemetryEnabled()) return;
        this.telemetryClient.trackEvent(eventName, properties, measures);
    }

    recordMetric(metricName, value) {
        if (!config.isTelemetryEnabled()) return;
        this.telemetryClient.trackMetric(metricName, value);
    }
}

exports.Telemetry = new Telemetry();