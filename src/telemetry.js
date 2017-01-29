var appInsights = require('applicationinsights');
var constants = require('./constants').Constants;

class Telemetry {
    constructor() {
        appInsights.setup(constants.telemetryKey).start();
        this.telemetryClient = appInsights.getClient(constants.telemetryKey);
    }

    recordEvent(eventName, properties, measures) {
        this.telemetryClient.trackEvent(eventName, properties, measures);
        console.log('Telemetry Event ' + eventName + ' recorded');
    }

    recordMetric(metricName, value) {
        this.telemetryClient.trackMetric(metricName, value);
        console.log('Telemetry Metric ' + metricName + ' recorded');
    }
}

exports.Telemetry = new Telemetry();