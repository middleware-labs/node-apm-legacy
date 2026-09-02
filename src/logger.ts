const otel = require('@opentelemetry/api');
const { logs, SeverityNumber } = require('@opentelemetry/api-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { LoggerProvider, SimpleLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const {Resource} = require("@opentelemetry/resources");
let {SEMRESATTRS_SERVICE_NAME} = require("@opentelemetry/semantic-conventions");
const fs = require('fs');
const path = require('path');
const packageJsonPath = path.resolve(__dirname,'..','..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const { format } = require('logform');
const { errors } = format;
const errorsFormat = errors({ stack: true })
let transformError = errorsFormat.transform;
import {Config} from './config';

const DEFAULT_LOG_KEYS = {
    traceId: 'trace_id',
    spanId: 'span_id',
    traceFlags: 'trace_flags',
};

// Set once the global LoggerProvider has been registered by loggerInitializer.
// Guards against emitting (and doing correlation work for) logs before logging is configured.
let isLoggerProviderEnabled = false;

const log = (level: string, message: string, attributes: Record<string, any> = {}): void => {
    if (!isLoggerProviderEnabled) {
        return;
    }

    if (level === "ERROR") {
        let stack = transformError(message, { stack: true });
        message = typeof stack === "string" ? stack : stack.message;
        attributes['stack'] = stack && stack.stack ? stack.stack : "";
    }
    const logger = logs.getLogger(packageJson.name, packageJson.version);
    const severityNumber = SeverityNumber[level]

    const logAttributes = {
        'mw.app.lang': 'nodejs',
        'level': level.toLowerCase(),
        ...(typeof attributes === 'object' && Object.keys(attributes).length ? attributes : {})
    };

    const currentSpan = otel.trace.getSpan(otel.context.active());
    if (currentSpan) {
        const { traceId, spanId, traceFlags } = currentSpan.spanContext();
        logger.emit({
            severityNumber,
            severityText: level,
            body: message,
            attributes: logAttributes,
            [DEFAULT_LOG_KEYS.traceId]: traceId,
            [DEFAULT_LOG_KEYS.spanId]: spanId,
            [DEFAULT_LOG_KEYS.traceFlags]: `0${traceFlags.toString(16)}`,
        });
        return;
    }

    logger.emit({
        severityNumber,
        severityText: level,
        body: message,
        attributes: logAttributes,
    });
};

export const loggerInitializer = (config: Config): void => {
    if (SEMRESATTRS_SERVICE_NAME === "undefined" || SEMRESATTRS_SERVICE_NAME === undefined) {
        SEMRESATTRS_SERVICE_NAME = "service.name"
    }

    const loggerProvider = new LoggerProvider({
        resource: new Resource({
            [SEMRESATTRS_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || process.env.MW_SERVICE_NAME || config.serviceName,
            ['mw_agent']: true,
            ['project.name']: config.projectName,
            ['mw.account_key']: config.accessToken,
            ['mw_serverless']:config.isServerless ? 1 : 0,
            ...config.customResourceAttributes
        })
    });

    loggerProvider.addLogRecordProcessor(
        new SimpleLogRecordProcessor(new OTLPLogExporter({url: config.target + '/v1/logs'})),
    );

    logs.setGlobalLoggerProvider(loggerProvider);
    isLoggerProviderEnabled = true;

    if (config.consoleLog){
        const originalConsoleLog = console.log;
        console.log = (...args: any[]): void => {
            log('INFO', args.join(' '), {});
            originalConsoleLog(...args);
        };
    }
    if (config.consoleError){
        const originalConsoleError = console.error;
        console.error = (...args: any[]): void => {
            log('ERROR', args.join(' '), {});
            originalConsoleError(...args);
        };
    }
};

export { log };