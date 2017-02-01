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
        console.log('Telemetry Event ' + eventName + ' recorded');
    }

    recordMetric(metricName, value) {
        if (!config.isTelemetryEnabled()) return;
        this.telemetryClient.trackMetric(metricName, value);
        console.log('Telemetry Metric ' + metricName + ' recorded');
    }
}

exports.Telemetry = new Telemetry();