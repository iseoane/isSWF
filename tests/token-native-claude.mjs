import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { claudeExecutable, conflictingTelemetryEnvironment, countersFrom, mergeCumulative, persistReceipt, readConfig } from '../tools/token-native-claude.mjs';
import { snapshotClaudeOtel } from '../tools/token-native-summary.mjs';
import { report } from '../tools/token-report.mjs';

const metric = (type, query_source, asInt, extra = [], timing = {}) => ({ name: 'claude_code.token.usage', sum: { isMonotonic: true, aggregationTemporality: 2, dataPoints: [{ attributes: [{ key: 'type', value: { stringValue: type } }, { key: 'query_source', value: { stringValue: query_source } }, { key: 'model', value: { stringValue: 'claude-sonnet-4-6' } }, ...extra], asInt, startTimeUnixNano: timing.start ?? '100', timeUnixNano: timing.end ?? '200' }] } });
assert.equal(claudeExecutable('linux'), 'claude');
assert.equal(claudeExecutable('win32'), 'claude.exe');
const result = countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [metric('input', 'main', 11, [{ key: 'user.email', value: { stringValue: 'secret@example.test' } }]), metric('output', 'main', 7), metric('cacheRead', 'main', 5), metric('cacheCreation', 'main', 3), metric('input', 'subagent', 99), { name: 'other', sum: {} }] }] }] });
assert.deepEqual(result.map(({ id, source, model, category, value }) => ({ id, source, model, category, value })), result.map(({ id, source, model, category, value }) => ({ id, source, model, category, value })).sort((a, b) => a.id.localeCompare(b.id)));
assert.deepEqual(new Set(result.map(row => `${row.source}:${row.category}:${row.value}`)), new Set(['main:input:11', 'main:output:7', 'main:cacheRead:5', 'main:cacheCreation:3', 'subagent:input:99']));
assert.doesNotMatch(JSON.stringify(result), /secret@example|other|claude-sonnet/u);
const firstSnapshot = mergeCumulative(new Map(), result);
const trackedRow = result.find(row => row.category === 'input' && row.source === 'main');
const repeatedSnapshot = mergeCumulative(firstSnapshot, [{ ...trackedRow, end: '300' }]);
assert.equal(repeatedSnapshot.get(trackedRow.id).value, 11, 'repeated cumulative exports replace rather than add');
const changedSnapshot = mergeCumulative(repeatedSnapshot, [{ ...trackedRow, value: 18, end: '400' }]);
assert.equal(changedSnapshot.get(trackedRow.id).value, 18, 'changed cumulative exports keep the latest value');
assert.equal(mergeCumulative(changedSnapshot, []).size, changedSnapshot.size, 'missing series does not become a fabricated zero');
const resourceExport = value => countersFrom({ resourceMetrics: [{ resource: { attributes: [{ key: 'service.name', value: { stringValue: 'claude' } }, { key: 'host.name', value: { stringValue: 'fixture' } }] }, scopeMetrics: [{ metrics: [metric('input', 'main', value, [], { end: String(value + 200) })] }] }] });
const reorderedResourceExport = value => countersFrom({ resourceMetrics: [{ resource: { attributes: [{ key: 'host.name', value: { stringValue: 'fixture' } }, { key: 'service.name', value: { stringValue: 'claude' } }] }, scopeMetrics: [{ metrics: [metric('input', 'main', value, [], { end: String(value + 200) })] }] }] });
const resourceFirst = resourceExport(11), resourceReordered = reorderedResourceExport(11);
assert.equal(resourceFirst[0].id, resourceReordered[0].id, 'resource attribute order is not series identity');
const resourceMerged = mergeCumulative(mergeCumulative(new Map(), resourceFirst), resourceReordered.map(row => ({ ...row, end: '500' })));
assert.equal([...resourceMerged.values()].reduce((sum, row) => sum + row.value, 0), 11, 'reordered resource attributes replace, never double-count');
assert.throws(() => countersFrom({ resourceMetrics: [{ resource: { attributes: [{ key: 'x', value: { stringValue: 'a' } }, { key: 'x', value: { stringValue: 'b' } }] }, scopeMetrics: [{ metrics: [metric('input', 'main', 11)] }] }] }), /duplicate metric attribute/u);
const compoundAttribute = value => ({ resourceMetrics: [{ resource: { attributes: [{ key: 'labels', value }] }, scopeMetrics: [{ metrics: [metric('input', 'main', 11)] }] }] });
assert.throws(() => countersFrom(compoundAttribute({ kvlistValue: { values: [{ key: 'a', value: { stringValue: '1' } }, { key: 'b', value: { stringValue: '2' } }] } })), /invalid metric attribute value/u, 'nested keyed attributes are outside the supported identity domain');
assert.throws(() => countersFrom(compoundAttribute({ kvlistValue: { values: [{ key: 'b', value: { stringValue: '2' } }, { key: 'a', value: { stringValue: '1' } }] } })), /invalid metric attribute value/u, 'nested reordered keyed attributes fail closed');
assert.throws(() => countersFrom(compoundAttribute({ kvlistValue: { values: [{ key: 'a', value: { stringValue: '1' } }, { key: 'a', value: { stringValue: '2' } }] } })), /invalid metric attribute value/u, 'nested duplicate keys fail closed before identity hashing');
assert.throws(() => countersFrom(compoundAttribute({ arrayValue: { values: [{ stringValue: '1' }, { stringValue: '2' }] } })), /invalid metric attribute value/u, 'compound arrays fail closed');
assert.throws(() => countersFrom(compoundAttribute({ stringValue: 'ambiguous', intValue: 11 })), /invalid metric attribute value/u, 'ambiguous scalar values fail closed');
const scalarExport = value => compoundAttribute(value);
for (const [variant, value] of [['stringValue', { nested: { z: 1, a: 2 } }], ['boolValue', { nested: { z: 1, a: 2 } }], ['intValue', [11]], ['stringValue', null], ['boolValue', null], ['doubleValue', null], ['intValue', null], ['stringValue', 1], ['boolValue', 'true'], ['doubleValue', '1'], ['doubleValue', Infinity], ['intValue', '9007199254740992'], ['bytesValue', 'AQI=']]) {
  assert.throws(() => countersFrom(scalarExport({ [variant]: value })), /invalid metric attribute value/u, `${variant} rejects malformed or unsupported payload`);
}
const disguisedA = scalarExport({ stringValue: { nested: { a: 1, b: 2 } } });
const disguisedB = scalarExport({ stringValue: { nested: { b: 2, a: 1 } } });
assert.throws(() => countersFrom(disguisedA), /invalid metric attribute value/u);
assert.throws(() => countersFrom(disguisedB), /invalid metric attribute value/u);
for (const value of [{ stringValue: 'valid' }, { boolValue: true }, { doubleValue: 1.5 }, { intValue: 11 }, { bytesValue: 'AQI=' }]) {
  // Bytes have no supported canonical representation in this consumer.
  if (Object.hasOwn(value, 'bytesValue')) continue;
  assert.equal(countersFrom(scalarExport(value)).length, 1, 'supported scalar payload is accepted');
}
const intNumber = countersFrom(scalarExport({ intValue: 11 }));
assert.throws(() => countersFrom(scalarExport({ intValue: '011' })), /invalid metric attribute value/u, 'noncanonical integer strings fail closed');
assert.equal(intNumber[0].id, countersFrom(scalarExport({ intValue: '11' }))[0].id, 'equivalent integer representations share identity');
assert.throws(() => mergeCumulative(changedSnapshot, [{ ...trackedRow, value: 2, end: '500' }]), /reset detected/u);
assert.equal(mergeCumulative(changedSnapshot, [{ ...trackedRow, value: 18, end: '400' }]).get(trackedRow.id).value, 18, 'identical repeated observation is idempotent');
assert.throws(() => mergeCumulative(changedSnapshot, [{ ...trackedRow, value: 19, end: '400' }]), /conflicting metric observation/u);
assert.throws(() => mergeCumulative(changedSnapshot, [{ ...trackedRow, value: 18, end: '350' }]), /replayed or out-of-order/u);
assert.throws(() => mergeCumulative(changedSnapshot, [{ ...trackedRow, value: 18, start: '101', end: '500' }]), /segment changed/u);
assert.throws(() => countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [metric('input', 'main', false)] }] }] }), /invalid metric counter/u);
assert.throws(() => countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [metric('input', 'main', '')] }] }] }), /invalid metric counter/u);
assert.throws(() => countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [metric('input', 'main', 1, [], { end: '100' })] }] }] }), /timestamp order/u);
const canonicalString = metric('input', 'main', '11');
assert.equal(countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [canonicalString] }] }] })[0].value, 11);
const ambiguous = metric('input', 'main', 11); ambiguous.sum.dataPoints[0].asDouble = null;
assert.throws(() => countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [ambiguous] }] }] }), /invalid metric counter/u);
const doubleCounter = metric('input', 'main', 11); delete doubleCounter.sum.dataPoints[0].asInt; doubleCounter.sum.dataPoints[0].asDouble = 11;
assert.equal(countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [doubleCounter] }] }] })[0].value, 11);
const nullCounter = metric('input', 'main', 11); nullCounter.sum.dataPoints[0].asInt = null; nullCounter.sum.dataPoints[0].asDouble = null;
assert.throws(() => countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [nullCounter] }] }] }), /invalid metric counter/u);
// Native identity: other point attributes and instrumentation scopes stay distinct under one visible projection.
const withEffort = effort => metric('input', 'main', 4, [{ key: 'effort', value: { stringValue: effort } }]);
const twoEfforts = countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [withEffort('low'), withEffort('high')] }] }] });
assert.equal(twoEfforts.length, 2, 'distinct point attributes are distinct series');
const scoped = name => ({ scope: { name, version: '1' }, metrics: [metric('input', 'main', 4)] });
assert.equal(countersFrom({ resourceMetrics: [{ scopeMetrics: [scoped('a'), scoped('b')] }] }).length, 2, 'distinct scopes are distinct series');
assert.throws(() => countersFrom({ resourceMetrics: [{ scopeMetrics: [scoped('a'), scoped('a')] }] }), /duplicate metric series/u);
const reorderedPoint = metric('input', 'main', 4, [{ key: 'effort', value: { stringValue: 'low' } }]);
reorderedPoint.sum.dataPoints[0].attributes.reverse();
assert.equal(countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [reorderedPoint] }] }] })[0].id, countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [withEffort('low')] }] }] })[0].id, 'reordered equivalent attributes keep one identity');
assert.throws(() => countersFrom({ resourceMetrics: [{ scopeMetrics: [{ scope: { name: 7 }, metrics: [metric('input', 'main', 4)] }] }] }), /invalid metric scope/u);

// Retained failure: recorded J006 receipt had input start ...527000000 and other categories ...528000000 (1 ms).
const metadata = { host: 'claude', hostVersion: '2.1.312', effort: 'unknown', taskClass: 'fixture', candidate: 'current' };
const recorded = [['input', 11, '1793704489527000000'], ['output', 7, '1793704489528000000'], ['cacheRead', 5, '1793704489528000000'], ['cacheCreation', 3, '1793704489528000000']]
  .map(([category, value, start], index) => ({ series: String(index + 1).repeat(24), source: 'main', model: 'model-0123456789abcdef01234567', category, start, end: '1793704489600000000', value }));
const receiptOf = series => ({ version: 2, host: 'claude', hostVersion: '2.1.312', sourceVersion: 'claude_code.token.usage-otlp-cumulative', provenance: 'native-claude-otel', capture: '0123456789abcdef01234567', cancellation: null, processExit: 0, signal: null, exportStatus: 'export-observed', receivedExports: 2, ignoredRequests: 0, series });
const permutations = list => list.length <= 1 ? [list] : list.flatMap((item, index) => permutations([...list.slice(0, index), ...list.slice(index + 1)]).map(rest => [item, ...rest]));
const baseline = snapshotClaudeOtel({ input: receiptOf(recorded), meta: metadata });
for (const order of permutations(recorded)) assert.deepEqual(snapshotClaudeOtel({ input: receiptOf(order), meta: metadata }), baseline, 'category order never changes the snapshot');
assert.equal(baseline.observedSubtotal, 26);
assert.equal(baseline.total, null);
assert.equal(baseline.totalStatus, 'unknown-coverage');
assert.deepEqual(baseline.series.map(row => row.start).sort(), ['1793704489527000000', '1793704489528000000', '1793704489528000000', '1793704489528000000'], 'separate intervals are retained, no common window');
const rendered = report(baseline);
assert.equal(rendered.observedSubtotal, 26);
assert.equal(rendered.total, null);
assert.match(rendered.claims, /Not a process, session or workflow total/u);
const partial = snapshotClaudeOtel({ input: receiptOf(recorded.slice(0, 2)), meta: metadata });
assert.equal(partial.observed.length, 2, 'missing categories are absent, never zero');
assert.equal(partial.observedSubtotal, 18);
const independent = snapshotClaudeOtel({ input: { ...receiptOf(recorded.map(row => ({ ...row, series: row.series.replace(/[0-9]/gu, digit => 'abcd'[digit - 1]), start: '200', end: '300', value: row.value + 1 }))), capture: 'abcdef0123456789abcdef01' }, meta: metadata });
const compared = report(independent, baseline).comparison;
assert.equal(compared.status, 'exploratory-coverage-limited', 'matched snapshots compare without identical native IDs');
assert.equal(compared.matched.length, 4);
assert.equal(compared.matched.find(row => row.category === 'input').difference, -1);
const narrower = report(partial, baseline).comparison;
assert.equal(narrower.unmatched.length, 2, 'unmatched categories stay explicit');
assert.equal(report(independent, { ...baseline, taskClass: 'other' }).comparison.status, 'incomparable');
const empty = snapshotClaudeOtel({ input: { ...receiptOf([]), exportStatus: 'no-export-observed', receivedExports: 0 }, meta: metadata });
assert.throws(() => snapshotClaudeOtel({ input: receiptOf([]), meta: metadata }), /invalid native summary/u, 'export-observed requires native series (shared rule)');
assert.throws(() => report({ ...empty, exportStatus: 'export-observed', observedSubtotal: 0 }), /invalid token summary/u, 'report applies the same empty-series rule');
// Explicit per-series intervals for the recorded 1 ms pair.
for (const row of baseline.series) assert.equal(row.start, row.category === 'input' ? '1793704489527000000' : '1793704489528000000', `${row.category} keeps its own start`);
// Equivalent OTLP export through the collector: every point order yields the same series and starts.
const otlpPoints = recorded.map(row => metric(row.category, 'main', row.value, [], { start: row.start, end: row.end }).sum.dataPoints[0]);
const otlpOf = points => ({ resourceMetrics: [{ scopeMetrics: [{ metrics: [{ name: 'claude_code.token.usage', sum: { isMonotonic: true, aggregationTemporality: 2, dataPoints: points } }] }] }] });
const otlpBaseline = [...mergeCumulative(new Map(), countersFrom(otlpOf(otlpPoints))).values()];
for (const order of permutations(otlpPoints)) assert.deepEqual([...mergeCumulative(new Map(), countersFrom(otlpOf(order))).values()], otlpBaseline);
assert.deepEqual(Object.fromEntries(otlpBaseline.map(row => [row.category, row.start])), { input: '1793704489527000000', output: '1793704489528000000', cacheRead: '1793704489528000000', cacheCreation: '1793704489528000000' });
assert.equal(otlpBaseline.reduce((sum, row) => sum + row.value, 0), 26);
// Cardinality overflow is deterministic in both the parser and the merged state.
const manyPoints = count => Array.from({ length: count }, (_, index) => metric('input', 'main', 1, [{ key: 'n', value: { intValue: index } }]).sum.dataPoints[0]);
assert.throws(() => countersFrom(otlpOf(manyPoints(101))), /metric row limit exceeded/u);
const firstHundred = mergeCumulative(new Map(), countersFrom(otlpOf(manyPoints(100))));
const extra = countersFrom(otlpOf([metric('input', 'main', 1, [{ key: 'n', value: { intValue: 500 } }]).sum.dataPoints[0]]));
assert.throws(() => mergeCumulative(firstHundred, extra), /metric row limit exceeded/u);
assert.equal(empty.observedSubtotal, null, 'no observed export is unknown, not zero');
assert.equal(report(independent, empty).comparison.status, 'incomparable');
assert.throws(() => snapshotClaudeOtel({ input: { ...receiptOf(recorded), exportStatus: 'no-export-observed', receivedExports: 0 }, meta: metadata }), /invalid native summary/u);
assert.throws(() => snapshotClaudeOtel({ input: receiptOf([...recorded, recorded[0]]), meta: metadata }), /invalid native summary/u);
assert.throws(() => snapshotClaudeOtel({ input: receiptOf([{ ...recorded[0], email: 'x' }]), meta: metadata }), /invalid native summary/u);
assert.throws(() => report({ ...baseline, extra: 1 }), /invalid token summary/u);
assert.throws(() => report({ ...baseline, observedSubtotal: 27 }), /invalid token summary/u);
assert.throws(() => report(baseline, { version: 1, mode: 'window', rows: [] }), /invalid token summary/u);
assert.doesNotMatch(JSON.stringify(baseline), /secret|claude-sonnet|user.email/u);
assert.throws(() => countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [metric('input', 'main', -1)] }] }] }));
assert.throws(() => countersFrom({ resourceMetrics: [{ scopeMetrics: [{ metrics: [{ name: 'claude_code.token.usage', sum: { isMonotonic: true, aggregationTemporality: 1, dataPoints: [] } }] }] }] }));
assert.deepEqual(conflictingTelemetryEnvironment({ PATH: '/bin', OTEL_EXPORTER_OTLP_ENDPOINT: 'ignored', CLAUDE_CODE_USE_MANAGED_SETTINGS_ONLY: '1' }).sort(), ['CLAUDE_CODE_USE_MANAGED_SETTINGS_ONLY', 'OTEL_EXPORTER_OTLP_ENDPOINT']);
assert.deepEqual(conflictingTelemetryEnvironment({ PATH: '/bin' }), []);
const runHelper = (cwd, entry, args, env, signalAfterReady = false) => new Promise((resolveRun, rejectRun) => {
  const started = Date.now(), child = spawn(process.execPath, [entry, '--', ...args], { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] });
  let stdout = '', stderr = '', signalled = false;
  child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; if (signalAfterReady && stdout.includes('RESISTING')) { signalled = true; child.kill('SIGTERM'); } });
  child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
  child.stdin.end('fixture-stdin');
  const deadline = setTimeout(() => { child.kill('SIGKILL'); rejectRun(Error('helper fixture timed out')); }, 9000);
  child.once('error', rejectRun);
  child.once('close', (code, signal) => { clearTimeout(deadline); resolveRun({ code, signal, stdout, stderr, elapsed: Date.now() - started, signalled }); });
});

const project = await mkdtemp(join(tmpdir(), 'claude-native-config-'));
try {
  assert.equal((await readConfig(project)).enabled, false, 'missing state root disables capture');
  const state = join(project, '.isswf'); await mkdir(state);
  assert.equal((await readConfig(project)).enabled, false, 'missing opt-in does not enable capture');
  const configPath = join(state, 'claude-native-usage.json');
  await writeFile(configPath, JSON.stringify({ version: 1, enabled: false }));
  assert.equal((await readConfig(project)).enabled, false, 'explicitly disabled capture stays disabled');
  await writeFile(configPath, JSON.stringify({ version: 1, enabled: true, destination: 'claude-native-usage' }));
  const enabled = await readConfig(project);
  assert.equal(enabled.enabled, true);
  assert.equal(enabled.destination, join(state, 'claude-native-usage'));
  await writeFile(configPath, JSON.stringify({ version: 1, enabled: true, destination: '../outside' }));
  await assert.rejects(readConfig(project), /unsafe capture destination/u);
  const receiptDirectory = join(state, 'receipts');
  const storedReceipt = { version: 2, capture: '0123456789abcdef01234567', series: [{ value: 11 }] };
  const storedBytes = `${JSON.stringify(storedReceipt)}\n`;
  await persistReceipt({ base: state, destination: receiptDirectory }, storedBytes);
  const receiptPath = join(receiptDirectory, `${storedReceipt.capture}.json`);
  assert.equal(await readFile(receiptPath, 'utf8'), storedBytes);
  await assert.rejects(persistReceipt({ base: state, destination: receiptDirectory }, storedBytes), { code: 'EEXIST' });
  assert.equal(await readFile(receiptPath, 'utf8'), storedBytes, 'existing receipt is never overwritten');
  const fullDirectory = join(state, 'full-receipts');
  await persistReceipt({ base: state, destination: fullDirectory }, `${JSON.stringify({ capture: 'f'.repeat(24), pad: 'x'.repeat(1024 * 1024 - 100) })}\n`);
  await assert.rejects(persistReceipt({ base: state, destination: fullDirectory }, `${JSON.stringify({ capture: 'e'.repeat(24), pad: 'x'.repeat(200) })}\n`), /storage limit exceeded/u, 'byte storage ceiling is deterministic');
  const countDirectory = join(state, 'count-receipts'); await mkdir(countDirectory);
  for (let index = 0; index < 100; index++) await writeFile(join(countDirectory, `${index.toString(16).padStart(24, '0')}.json`), '{}');
  await assert.rejects(persistReceipt({ base: state, destination: countDirectory }, `${JSON.stringify({ capture: 'd'.repeat(24) })}\n`), /storage limit exceeded/u, 'file-count ceiling is deterministic');
  const staleClaim = join(receiptDirectory, '.claude-capture.lock');
  await writeFile(staleClaim, 'existing claim', { flag: 'wx' });
  await assert.rejects(persistReceipt({ base: state, destination: receiptDirectory }, `${JSON.stringify({ ...storedReceipt, capture: 'abcdef0123456789abcdef01' })}\n`), { code: 'EEXIST' });
  assert.equal(await readFile(staleClaim, 'utf8'), 'existing claim', 'stale claim is never removed');
  await writeFile(configPath, JSON.stringify({ version: 1, enabled: false }));
  const bin = join(project, 'bin'); await mkdir(bin);
  const fakeClaude = join(bin, claudeExecutable());
  const fixtureScript = join(project, 'fixture.mjs');
  await writeFile(fixtureScript, `process.stdout.write(JSON.stringify({args: process.argv.slice(2)}) + String.fromCharCode(10)); process.stdin.pipe(process.stdout);\n`);
  await copyFile(process.execPath, fakeClaude);
  const entry = fileURLToPath(new URL('../tools/token-native-claude.mjs', import.meta.url));
  const launch = execFileSync(process.execPath, [entry, '--', fixtureScript, '--model', 'preserve-me'], { cwd: project, env: { ...process.env, PATH: bin }, input: 'stdin-preserved', encoding: 'utf8', timeout: 5000 });
  assert.ok(launch.includes('"args":["--model","preserve-me"]'));
  assert.match(launch, /stdin-preserved/u);
  assert.equal(await readFile(configPath, 'utf8'), JSON.stringify({ version: 1, enabled: false }));
  assert.equal(await import('node:fs/promises').then(({ access }) => access(join(state, 'claude-native-usage'))).then(() => true, () => false), false, 'disabled launch creates no receiver destination or receipt');
  const fixtureBin = join(project, 'fixture-bin'); await mkdir(fixtureBin);
  const fixtureClaude = join(fixtureBin, claudeExecutable());
  const nativeFixtureScript = join(project, 'native-fixture.mjs');
  await copyFile(process.execPath, fixtureClaude);
  await writeFile(nativeFixtureScript, `import http from 'node:http';
const mode = process.argv.find(value => value.startsWith('--mode='))?.slice(7) ?? 'valid';
if (mode === 'resistant') { process.stdout.write('RESISTING\\n'); process.on('SIGTERM', () => {}); setInterval(() => {}, 1000); }
else {
  const endpoint = new URL(process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT);
  const token = decodeURIComponent(process.env.OTEL_EXPORTER_OTLP_METRICS_HEADERS.slice('Authorization='.length).replace('Bearer%20',''));
  const point = { attributes: [{key:'type',value:{stringValue:'input'}},{key:'query_source',value:{stringValue:'main'}},{key:'model',value:{stringValue:'fixture-model'}}], asInt: 11, startTimeUnixNano:'100', timeUnixNano:'200' };
  const exportBody = (value, end, pad = '') => JSON.stringify({resourceMetrics:[{resource:{attributes:[]},scopeMetrics:[{metrics:[{name:'padding',description:pad},{name:'claude_code.token.usage',sum:{isMonotonic:true,aggregationTemporality:2,dataPoints:[{...point,asInt:value,timeUnixNano:String(end)}]}}]}]}]});
  if (['many', 'none', 'intruder', 'nonnative', 'stream-oversize', 'concurrent'].includes(mode)) {
    const send = (body, authorization = 'Bearer ' + token, target = endpoint) => new Promise(done => { const request = http.request(target, {method:'POST',headers:{'content-type':'application/json',authorization,'content-length':Buffer.byteLength(body)}}, response => { response.resume(); response.on('end', done); }); request.on('error', done); request.end(body); });
    if (mode === 'intruder') { await send(exportBody(99, 150), 'Bearer wrong'); await send(exportBody(99, 150), 'Bearer ' + token, new URL(endpoint.pathname + '/bad', endpoint)); await send(exportBody(11, 200)); }
    if (mode === 'nonnative') await send(JSON.stringify({resourceMetrics:[{resource:{attributes:[]},scopeMetrics:[{metrics:[{name:'claude_code.session.count',sum:{isMonotonic:true,aggregationTemporality:2,dataPoints:[]}}]}]}]}));
    if (mode === 'stream-oversize') await new Promise(done => { const request = http.request(endpoint, {method:'POST',headers:{'content-type':'application/json',authorization:'Bearer ' + token}}, response => { response.resume(); response.on('end', done); }); request.on('error', done); for (let index = 0; index < 17; index++) request.write('x'.repeat(65536)); request.end(); });
    if (mode === 'concurrent') {
      const open = [0, 1, 2].map(() => { const request = http.request(endpoint, {method:'POST',headers:{'content-type':'application/json',authorization:'Bearer ' + token,'content-length':10}}); request.on('error', () => {}); request.on('response', response => response.resume()); request.write('{'); return request; });
      await new Promise(done => setTimeout(done, 300));
      await Promise.all(open.map(request => new Promise(done => { request.on('close', done); request.end('"a":1234}'); })));
    }
    if (mode === 'many') for (let index = 0; index < 12; index++) await send(exportBody(11 + index, 200 + index, 'x'.repeat(100000)));
    process.stdout.write('done' + String.fromCharCode(10));
  } else {
  let body = JSON.stringify({resourceMetrics:[{resource:{attributes:[]},scopeMetrics:[{metrics:[{name:'claude_code.token.usage',sum:{isMonotonic:true,aggregationTemporality:2,dataPoints:[point]}}]}]}]});
  if (mode === 'schema') body = JSON.stringify({resourceMetrics:[{scopeMetrics:[{metrics:[{name:'claude_code.token.usage',sum:{isMonotonic:true,aggregationTemporality:2,dataPoints:[{...point,asInt:false}]}}]}]}]});
  if (mode === 'oversize') body = 'x'.repeat(1024 * 1024 + 1);
  if (mode === 'wrong-route') endpoint.pathname += '/bad';
  const authorization = mode === 'auth' ? 'Bearer wrong' : 'Bearer ' + token;
  const request = http.request(endpoint, {method:'POST',headers:{'content-type':'application/json',authorization,'content-length':Buffer.byteLength(body)}}, response => response.resume());
  request.on('error', () => {}); request.end(body);
  process.stdout.write(JSON.stringify(process.argv.slice(2)) + String.fromCharCode(10)); process.stdin.pipe(process.stdout);
  }
}
`);
  const enabledCase = async mode => {
    const cwd = join(project, `case-${mode}`), caseState = join(cwd, '.isswf');
    await mkdir(caseState, { recursive: true });
    await writeFile(join(caseState, 'claude-native-usage.json'), JSON.stringify({ version: 1, enabled: true, destination: 'capture' }));
    return { cwd, caseState, env: { ...process.env, PATH: fixtureBin } };
  };
  const validCase = await enabledCase('valid');
  const enabledRun = await runHelper(validCase.cwd, entry, [nativeFixtureScript, '--model', 'preserved', '--mode=valid'], validCase.env);
  assert.equal(enabledRun.code, 0, enabledRun.stderr);
  assert.doesNotMatch(enabledRun.stderr, /capture invalid|no-export-observed/u, enabledRun.stderr);
  assert.ok(enabledRun.stdout.includes('"--model","preserved"'));
  assert.ok(enabledRun.stdout.includes('fixture-stdin'));
  const { readdir } = await import('node:fs/promises');
  const captured = await readdir(join(validCase.caseState, 'capture'));
  assert.equal(captured.length, 1);
  const retained = JSON.parse(await readFile(join(validCase.caseState, 'capture', captured[0]), 'utf8'));
  assert.equal(retained.series[0].value, 11);
  assert.equal(retained.exportStatus, 'export-observed');
  assert.doesNotMatch(JSON.stringify(retained), /policyStatus|managed-policy-not-inspected/u);
  const manyCase = await enabledCase('many');
  const manyRun = await runHelper(manyCase.cwd, entry, [nativeFixtureScript, '--mode=many'], manyCase.env);
  assert.equal(manyRun.code, 0, manyRun.stderr);
  const manyReceipt = JSON.parse(await readFile(join(manyCase.caseState, 'capture', (await readdir(join(manyCase.caseState, 'capture')))[0]), 'utf8'));
  assert.equal(manyReceipt.receivedExports, 12, 'over 1 MiB cumulative bounded exports do not expire collection');
  assert.deepEqual(manyReceipt.series.map(row => row.value), [22], 'retained state is latest-per-series, not growing');
  const noneCase = await enabledCase('none');
  const noneRun = await runHelper(noneCase.cwd, entry, [nativeFixtureScript, '--mode=none'], noneCase.env);
  assert.equal(noneRun.code, 0, noneRun.stderr);
  assert.match(noneRun.stderr, /no-export-observed; coverage unknown/u);
  const noneReceipt = JSON.parse(await readFile(join(noneCase.caseState, 'capture', (await readdir(join(noneCase.caseState, 'capture')))[0]), 'utf8'));
  assert.equal(noneReceipt.exportStatus, 'no-export-observed');
  assert.deepEqual(noneReceipt.series, []);
  const intruderCase = await enabledCase('intruder');
  const intruderRun = await runHelper(intruderCase.cwd, entry, [nativeFixtureScript, '--mode=intruder'], intruderCase.env);
  const intruderReceipt = JSON.parse(await readFile(join(intruderCase.caseState, 'capture', (await readdir(join(intruderCase.caseState, 'capture')))[0]), 'utf8'));
  assert.equal(intruderRun.code, 0, intruderRun.stderr);
  assert.equal(intruderReceipt.ignoredRequests, 2, 'unauthenticated and wrong-route requests are counted');
  assert.deepEqual(intruderReceipt.series.map(row => row.value), [11], 'ignored requests neither discard nor contribute data');
  const nonnativeCase = await enabledCase('nonnative');
  await runHelper(nonnativeCase.cwd, entry, [nativeFixtureScript, '--mode=nonnative'], nonnativeCase.env);
  const nonnativeReceipt = JSON.parse(await readFile(join(nonnativeCase.caseState, 'capture', (await readdir(join(nonnativeCase.caseState, 'capture')))[0]), 'utf8'));
  assert.equal(nonnativeReceipt.exportStatus, 'no-export-observed', 'an export without native token series is not observed coverage');
  assert.equal(nonnativeReceipt.receivedExports, 0);
  assert.equal(snapshotClaudeOtel({ input: nonnativeReceipt, meta: { ...metadata, hostVersion: nonnativeReceipt.hostVersion } }).observedSubtotal, null);
  for (const [mode, code] of [['schema', 'invalid metric counter'], ['oversize', 'request-too-large'], ['stream-oversize', 'request-too-large'], ['concurrent', 'concurrency-limit']]) {
    const failedCase = await enabledCase(mode);
    const failedRun = await runHelper(failedCase.cwd, entry, [nativeFixtureScript, `--mode=${mode}`], failedCase.env);
    assert.equal(failedRun.code, 0, `${mode} does not alter the child exit status`);
    assert.ok(failedRun.stderr.includes(`rejection=${code})`), `${mode}: ${failedRun.stderr}`);
    assert.equal(await import('node:fs/promises').then(({ access }) => access(join(failedCase.caseState, 'capture'))).then(() => true, () => false), false, `${mode} retains no receipt`);
  }
  const missingExecutable = await enabledCase('spawn-failure');
  const emptyPath = join(project, 'empty-executable-path'); await mkdir(emptyPath);
  const spawnFailure = await runHelper(missingExecutable.cwd, entry, [nativeFixtureScript, '--mode=valid'], { ...process.env, PATH: emptyPath });
  assert.equal(spawnFailure.code, 1, 'version/spawn failure is surfaced');
  const resistantCase = await enabledCase('resistant');
  if (process.platform !== 'win32') {
    const cancellation = await runHelper(resistantCase.cwd, entry, [nativeFixtureScript, '--mode=resistant'], resistantCase.env, true);
    assert.equal(cancellation.signalled, true);
    assert.equal(cancellation.code, 1);
    assert.ok(cancellation.elapsed < 6000, `POSIX resistant-child cancellation was bounded (${cancellation.elapsed}ms)`);
  } else {
    assert.equal(claudeExecutable('win32'), 'claude.exe', 'Windows fixture uses a copied native Node executable, not a .cmd/shim');
  }
  await mkdir(join(project, '.factory'));
  assert.equal((await readConfig(project)).enabled, false, 'ambiguous state roots fail closed');
} finally { await rm(project, { recursive: true, force: true }); }
console.log('PASS: Claude OTLP token metric allowlist, exact cumulative counters and malformed-value refusal');
