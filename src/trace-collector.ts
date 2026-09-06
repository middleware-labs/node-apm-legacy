const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-http");
const { Resource } = require("@opentelemetry/resources");
let {
  SEMRESATTRS_SERVICE_NAME,
} = require("@opentelemetry/semantic-conventions");
const { CompositePropagator } = require("@opentelemetry/core");
const {
  B3Propagator,
  B3InjectEncoding,
} = require("@opentelemetry/propagator-b3");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const {
  HttpInstrumentation,
} = require("@opentelemetry/instrumentation-http");
const {
  ExpressInstrumentation,
} = require("@opentelemetry/instrumentation-express");
const {
  MongoDBInstrumentation,
} = require("@opentelemetry/instrumentation-mongodb");
const {
  MySQLInstrumentation,
} = require("@opentelemetry/instrumentation-mysql");
const {
  RedisInstrumentation,
} = require("@opentelemetry/instrumentation-redis");
const {
  AmqplibInstrumentation,
} = require("@opentelemetry/instrumentation-amqplib");
const { AwsInstrumentation } = require("@opentelemetry/instrumentation-aws-sdk");
const {
  GrpcInstrumentation,
} = require("@opentelemetry/instrumentation-grpc");
import { Config } from "./config";

export const init = (config: Config) => {
  const apm_pause_traces = config.pauseTraces === true;

  if (apm_pause_traces) {
    return;
  }

  if (
    SEMRESATTRS_SERVICE_NAME === "undefined" ||
    SEMRESATTRS_SERVICE_NAME === undefined
  ) {
    SEMRESATTRS_SERVICE_NAME = "service.name";
  }

  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SEMRESATTRS_SERVICE_NAME]:
        process.env.OTEL_SERVICE_NAME ||
        process.env.MW_SERVICE_NAME ||
        config.serviceName,
      ["mw_agent"]: true,
      ["project.name"]: config.projectName,
      ["mw.account_key"]: config.accessToken,
      ["mw_serverless"]: config.isServerless ? 1 : 0,
      ...config.customResourceAttributes,
    }),
  });

  provider.addSpanProcessor(
    new BatchSpanProcessor(
      new OTLPTraceExporter({
        url: config.target + "/v1/traces",
      })
    )
  );

  provider.register({
    propagator: new CompositePropagator({
      propagators: [
        new B3Propagator(),
        new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER }),
      ],
    }),
  });

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new MongoDBInstrumentation(),
      new MySQLInstrumentation(),
      new RedisInstrumentation(),
      new AmqplibInstrumentation(),
      new AwsInstrumentation(),
      new GrpcInstrumentation(),
    ],
  });
};
