"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTracer = exports.getMeter = exports.setAttribute = exports.errorRecord = exports.error = exports.debug = exports.warn = exports.info = exports.track = void 0;
const otel = require("@opentelemetry/api");
const logger_1 = require("./logger");
const config_1 = require("./config");
const config_2 = require("./config");
const track = (newConfig = {}) => {
    const config = (0, config_1.init)(newConfig);
};
exports.track = track;
const info = (message, attributes = {}) => {
    (0, logger_1.log)("INFO", message, attributes);
};
exports.info = info;
const warn = (message, attributes = {}) => {
    (0, logger_1.log)("WARN", message, attributes);
};
exports.warn = warn;
const debug = (message, attributes = {}) => {
    (0, logger_1.log)("DEBUG", message, attributes);
};
exports.debug = debug;
const error = (message, attributes = {}) => {
    (0, logger_1.log)("ERROR", message, attributes);
};
exports.error = error;
const errorRecord = (e) => {
    if (otel === null || otel === void 0 ? void 0 : otel.context) {
        const span = otel.trace.getSpan(otel.context.active());
        if (span) {
            span.recordException(e);
            span.setStatus({ code: otel.SpanStatusCode.ERROR, message: String(e) });
        }
    }
};
exports.errorRecord = errorRecord;
const setAttribute = (name, value) => {
    if (otel === null || otel === void 0 ? void 0 : otel.context) {
        const span = otel.trace.getSpan(otel.context.active());
        if (span) {
            span.setAttribute(name, value);
        }
    }
};
exports.setAttribute = setAttribute;
const getMeter = (name, version, options) => {
    if (config_2.configDefault.meterProvider) {
        return config_2.configDefault.meterProvider.getMeter(config_2.configDefault.serviceName);
    }
    return otel.meter.getMeter(config_2.configDefault.serviceName);
};
exports.getMeter = getMeter;
const getTracer = (name, version, options) => {
    return otel.trace.getTracer(config_2.configDefault.serviceName);
};
exports.getTracer = getTracer;
