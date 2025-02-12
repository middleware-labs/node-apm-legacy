const otel = require("@opentelemetry/api");
import { log } from "./logger";
import { init as configInit } from "./config";
import { Config, configDefault } from "./config";
import {
  Meter as IMeter,
  MeterOptions,
  TracerOptions,
  Tracer,
} from "@opentelemetry/api";
export const track = (newConfig: Partial<Config> | undefined = {}): void => {
  const config = configInit(newConfig);
};

export const info = (
  message: string,
  attributes: Record<string, any> = {}
): void => {
  log("INFO", message, attributes);
};

export const warn = (
  message: string,
  attributes: Record<string, any> = {}
): void => {
  log("WARN", message, attributes);
};

export const debug = (
  message: string,
  attributes: Record<string, any> = {}
): void => {
  log("DEBUG", message, attributes);
};

export const error = (
  message: string,
  attributes: Record<string, any> = {}
): void => {
  log("ERROR", message, attributes);
};

export const errorRecord = (e: Error): void => {
  if (otel?.context) {
    const span = otel.trace.getSpan(otel.context.active());
    if (span) {
      span.recordException(e);
      span.setStatus({ code: otel.SpanStatusCode.ERROR, message: String(e) });
    }
  }
};

export const setAttribute = (name: string, value: any): void => {
  if (otel?.context) {
    const span = otel.trace.getSpan(otel.context.active());
    if (span) {
      span.setAttribute(name, value);
    }
  }
};

export const getMeter = (
  name: string,
  version?: string,
  options?: MeterOptions
): IMeter => {
  if (configDefault.meterProvider) {
    return configDefault.meterProvider.getMeter(configDefault.serviceName);
  }
  return otel.meter.getMeter(configDefault.serviceName);
};

export const getTracer = (
  name: string,
  version?: string,
  options?: TracerOptions
): Tracer => {
  return otel.trace.getTracer(configDefault.serviceName);
};
