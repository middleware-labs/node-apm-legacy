"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.configDefault = void 0;
const api_1 = require("@opentelemetry/api");
const process_1 = __importDefault(require("process"));
const trace_collector_1 = require("./trace-collector");
const metrics_collector_1 = require("./metrics-collector");
const logger_1 = require("./logger");
let customResourceAttributes = {};
exports.configDefault = {
    DEBUG: false,
    host: "localhost",
    projectName: "Project-" + process_1.default.pid,
    serviceName: "Service-" + process_1.default.pid,
    port: {
        grpc: 9319,
        fluent: 8006,
    },
    target: "http://localhost:9319",
    accessToken: "",
    tenantID: "",
    mwAuthURL: "https://app.middleware.io/api/v1/auth",
    consoleLog: false,
    consoleError: true,
    pauseTraces: false,
    meterProvider: false,
    isServerless: false,
    customResourceAttributes: customResourceAttributes,
};
const init = (config = {}) => {
    if (config.hasOwnProperty("target")) {
        exports.configDefault["isServerless"] = true;
    }
    Object.keys(exports.configDefault).forEach((key) => {
        var _a;
        // @ts-ignore
        exports.configDefault[key] = (_a = config[key]) !== null && _a !== void 0 ? _a : exports.configDefault[key];
    });
    const isHostExist = process_1.default.env.MW_AGENT_SERVICE && process_1.default.env.MW_AGENT_SERVICE !== ""
        ? true
        : false;
    if (isHostExist) {
        // @ts-ignore
        exports.configDefault.host = "http://" + process_1.default.env.MW_AGENT_SERVICE;
        exports.configDefault.target =
            "http://" + process_1.default.env.MW_AGENT_SERVICE + ":" + exports.configDefault.port.grpc;
    }
    api_1.diag.setLogger(new api_1.DiagConsoleLogger(), exports.configDefault.DEBUG ? api_1.DiagLogLevel.DEBUG : api_1.DiagLogLevel.NONE);
    (0, logger_1.loggerInitializer)(exports.configDefault);
    (0, trace_collector_1.init)(exports.configDefault);
    (0, metrics_collector_1.init)(exports.configDefault);
    return exports.configDefault;
};
exports.init = init;
