# node-apm-legacy

Middleware Application Performance Monitoring (APM) for Node.js applications
on **Node.js 14 and 16**.

## Which package do I need?

| Node.js | Package |
|---|---|
| 18.19+ | [`@middleware.io/node-apm`](https://www.npmjs.com/package/@middleware.io/node-apm) |
| 14, 16 | `@middleware.io/node-apm-legacy` (this one) |

This package is deliberately limited to **distributed traces and logs**. It
does not include exception code capture (`exception.stack_details`) or
continuous profiling — those need a newer OpenTelemetry SDK than Node 14 and
16 can run. If you need them, upgrade to Node 18.19+ and use
`@middleware.io/node-apm`.

Traces and logs are verified against Node 14, 16 and 18 on every change; see
`test/smoke.js`.

## Install

```bash
npm install @middleware.io/node-apm-legacy
```

## Usage

Call `track()` before anything else, so the instrumentation can patch modules
as they are first required:

```javascript
const tracker = require('@middleware.io/node-apm-legacy');

tracker.track({
  projectName: "Your project name",
  serviceName: "Your service name",
  accessToken: "<your API key>",
});

tracker.error(new Error('your error message'));
tracker.info('your info message');
tracker.warn('your warning message');
tracker.debug('your debug message');
```

Logs emitted inside a request carry `trace_id` and `span_id`, so they link
back to the trace that produced them.

### Configuration

| Option | Env var | Default | Meaning |
|---|---|---|---|
| `serviceName` | `MW_SERVICE_NAME` | — | Name this service reports as |
| `projectName` | — | — | Project the service belongs to |
| `accessToken` | `MW_API_KEY` | — | Middleware API key |
| `target` | — | `http://localhost:9320` | OTLP/HTTP endpoint of the MW Agent |
| `pauseTraces` | — | `false` | Stop trace collection |

Telemetry is sent over **OTLP/HTTP** to `<target>/v1/traces`, `/v1/logs` and
`/v1/metrics`.

## What is instrumented

HTTP, Express, MongoDB, MySQL, Redis, amqplib, gRPC and the AWS SDK, plus any
spans you create yourself with `tracker.getTracer(...)` and metrics with
`tracker.getMeter(...)`.

## Development

```bash
npm install
npm run build      # tsc --declaration
npm run smoke      # traces + logs against a local OTLP receiver
npm test           # build, then smoke
```

The smoke test runs against the built `lib/`, so build first. CI runs it on
Node 14, 16 and 18.
