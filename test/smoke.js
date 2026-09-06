/**
 * Proves the two things this package exists to deliver -- traces and logs --
 * still reach an OTLP endpoint on the old Node versions it targets.
 *
 * Deliberately dependency-light and plain JS: it runs against the built `lib/`
 * on Node 14, where most test runners no longer install.
 *
 * Run: npm run build && npm run smoke
 */

const http = require('http');
const assert = require('assert');

const RECEIVER_PORT = 9320;
const APP_PORT = 3311;
const SETTLE_MS = Number(process.env.SMOKE_SETTLE_MS || 12000);

const received = { traces: 0, logs: 0, spans: [], logs_seen: [] };

const receiver = http.createServer((req, res) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => {
    const kind = req.url.split('/').pop();
    received[kind] = (received[kind] || 0) + 1;
    try {
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      (body.resourceSpans || []).forEach(rs =>
        (rs.scopeSpans || []).forEach(ss =>
          (ss.spans || []).forEach(s =>
            received.spans.push({ name: s.name, scope: (ss.scope || {}).name || '' }))));
      (body.resourceLogs || []).forEach(rl =>
        (rl.scopeLogs || []).forEach(sl =>
          (sl.logRecords || []).forEach(l =>
            received.logs_seen.push({
              body: (l.body || {}).stringValue || '',
              traceId: l.traceId || '',
            }))));
    } catch (err) {
      received.parseError = String(err);
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
  });
});

receiver.listen(RECEIVER_PORT, () => {
  const tracker = require('../lib/src/index.js');

  tracker.track({
    serviceName: 'smoke-test',
    accessToken: 'smoke-test',
    target: 'http://localhost:' + RECEIVER_PORT,
  });

  const express = require('express');
  const app = express();
  app.get('/orders/:id', (req, res) => {
    // emitted inside a request, so it must carry trace correlation
    tracker.info('handling order ' + req.params.id, { 'order.id': req.params.id });
    res.json({ id: req.params.id });
  });

  const server = app.listen(APP_PORT, () => {
    http.get('http://localhost:' + APP_PORT + '/orders/42', res => {
      res.resume();
      res.on('end', () => {
        const span = tracker.getTracer('smoke').startSpan('manual-work');
        span.end();
      });
    });
  });

  setTimeout(() => {
    server.close();
    receiver.close();
    report();
  }, SETTLE_MS);
});

function report() {
  const names = received.spans.map(s => s.name);
  const scopes = [...new Set(received.spans.map(s => s.scope))];
  const correlated = received.logs_seen.filter(l => l.traceId).length;

  console.log('node          :', process.version);
  console.log('trace exports :', received.traces);
  console.log('log exports   :', received.logs);
  console.log('spans         :', JSON.stringify(names));
  console.log('scopes        :', JSON.stringify(scopes));
  console.log('logs          :', JSON.stringify(received.logs_seen.map(l => l.body)));
  console.log('correlated    :', correlated, 'of', received.logs_seen.length);

  assert.ok(!received.parseError, 'receiver failed to parse a payload: ' + received.parseError);
  assert.ok(received.traces > 0, 'no trace export reached the receiver');
  assert.ok(received.logs > 0, 'no log export reached the receiver');

  // auto-instrumentation, not just the manual span
  assert.ok(names.some(n => n.indexOf('GET') === 0 || n.indexOf('HTTP') === 0),
    'no http instrumentation span: ' + JSON.stringify(names));
  assert.ok(names.indexOf('request handler - /orders/:id') !== -1,
    'no express request-handler span: ' + JSON.stringify(names));
  assert.ok(names.indexOf('manual-work') !== -1, 'manual span missing');

  // a log emitted inside a request must be linkable to its trace
  assert.ok(correlated > 0, 'no log carried a traceId');

  console.log('\nPASS');
}
