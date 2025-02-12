import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import process from "process";
import { init as tracerInit } from "./trace-collector";
import { init as metricInit } from "./metrics-collector";
import { loggerInitializer } from "./logger";
import { ResourceAttributes } from "@opentelemetry/resources";

export interface Config {
  pauseTraces: Boolean | number;
  DEBUG: Boolean | number;
  host: string;
  projectName: string;
  serviceName: string;
  port: {
    grpc: number;
    fluent: number;
  };
  target: string;
  accessToken: string;
  tenantID: string;
  mwAuthURL: string;
  consoleLog: boolean;
  consoleError: boolean;
  meterProvider: any;
  isServerless: boolean;
  customResourceAttributes: ResourceAttributes;
}

let customResourceAttributes: ResourceAttributes = {};

export let configDefault: Config = {
  DEBUG: false,
  host: "localhost",
  projectName: "Project-" + process.pid,
  serviceName: "Service-" + process.pid,
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

export const init = (config: Partial<Config> = {}): Config => {
  if (config.hasOwnProperty("target")) {
    configDefault["isServerless"] = true;
  }
  Object.keys(configDefault).forEach((key) => {
    // @ts-ignore
    configDefault[key] = config[key] ?? configDefault[key];
  });
  const isHostExist =
    process.env.MW_AGENT_SERVICE && process.env.MW_AGENT_SERVICE !== ""
      ? true
      : false;
  if (isHostExist) {
    // @ts-ignore
    configDefault.host = "http://" + process.env.MW_AGENT_SERVICE;
    configDefault.target =
      "http://" + process.env.MW_AGENT_SERVICE + ":" + configDefault.port.grpc;
  }
  diag.setLogger(
    new DiagConsoleLogger(),
    configDefault.DEBUG ? DiagLogLevel.DEBUG : DiagLogLevel.NONE
  );
  loggerInitializer(configDefault);
  tracerInit(configDefault);
  metricInit(configDefault)
  return <Config>configDefault;
};


