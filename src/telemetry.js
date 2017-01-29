var appInsights = require('applicationinsights');
var config = require('./config');
var constants = require('./constants').Constants;

class Telemetry {
    constructor() {
        if (!config.isTelemetryEnabled) return;
        appInsights.setup(constants.telemetryKey).start();
        this.telemetryClient = appInsights.getClient(constants.telemetryKey);
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