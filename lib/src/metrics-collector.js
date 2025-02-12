"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const exporter_metrics_otlp_grpc_1 = require("@opentelemetry/exporter-metrics-otlp-grpc");
let { SEMRESATTRS_SERVICE_NAME } = require("@opentelemetry/semantic-conventions");
const resources_1 = require("@opentelemetry/resources");
const sdk_metrics_1 = require("@opentelemetry/sdk-metrics");
const init = (config) => {
    const metricsExporter = new exporter_metrics_otlp_grpc_1.OTLPMetricExporter({
        url: config.target
    });
    const metricReader = new sdk_metrics_1.PeriodicExportingMetricReader({
        exporter: metricsExporter,
        exportIntervalMillis: 10000,
    });
    const serviceName = config.serviceName;
    const projectName = config.projectName;
    if (SEMRESATTRS_SERVICE_NAME === "undefined" || SEMRESATTRS_SERVICE_NAME === undefined) {
        SEMRESATTRS_SERVICE_NAME = "service.name";
    }
    const meterProvider = new sdk_metrics_1.MeterProvider({
        resource: new resources_1.Resource(Object.assign({ [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || process.env.MW_SERVICE_NAME || serviceName, ['mw_agent']: true, ['project.name']: projectName, ['mw.account_key']: config.accessToken, ['runtime.metrics.nodejs']: true, ['mw.app.lang']: 'nodejs', ['mw_serverless']: config.isServerless ? 1 : 0 }, config.customResourceAttributes)),
        readers: [metricReader]
    });
    config.meterProvider = meterProvider;
};
exports.init = init;
