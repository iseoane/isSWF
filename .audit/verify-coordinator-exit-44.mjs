import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { fork, spawnSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readFile, readdir, readlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { createBridge, runtime, validate } from './verify-native-coordinator-44.mjs';
import { safeAssistantDiagnostic } from './coordinator-44-diagnostic.mjs';

const self = fileURLToPath(import.meta.url), source = resolve(fileURLToPath(new URL('..', import.meta.url)));
const fixturePath = join(source, '.audit/coordinator-exit-44-fixture.json');
const dependencies = ['.audit/verify-coordinator-exit-44.mjs', '.audit/verify-native-coordinator-44.mjs', '.audit/prepare-coordinator-exit-44.mjs', '.audit/coordinator-exit-44-fixture.json'];
const hash = b => createHash('sha256').update(b).digest('hex');
const cli = join(source, 'tools/worker-lifecycle.mjs');
const checker = join(source, '.audit/verify-pi-worker-44-parent.mjs');
const run = (program, args) => {
  const result = spawnSync(program, args, { cwd: source, encoding: 'utf8', timeout: 15000, maxBuffer: 128000, env: { PATH: process.env.PATH, HOME: '/nonexistent', PI_TELEMETRY: '0' } });
  assert.equal(result.error, undefined); assert.equal(result.status, 0, 'bounded fixed command must succeed');
  return result.stdout;
};
const git = (f, sha, path) => Buffer.from(run('git', ['-C', f.repo, 'show', `${sha}:${path}`]));
const exists = path => access(path).then(() => true, error => { assert.equal(error.code, 'ENOENT'); return false; });
async function bindings() { return Object.fromEntries(await Promise.all(dependencies.map(async path => [path, hash(await readFile(join(source, path)))]))); }
async function identity(pid, nonce) {
  const stat = await readFile(`/proc/${pid}/stat`, 'utf8');
  const args = (await readFile(`/proc/${pid}/cmdline`, 'utf8')).split('\0');
  assert(args.includes(nonce), 'own child must carry the exact random identity argument');
  return { pid, nonce, startTicks: stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19], bootId: (await readFile('/proc/sys/kernel/random/boot_id', 'utf8')).trim(), exe: await readlink(`/proc/${pid}/exe`) };
}
async function child(mode, root, nonce) {
  assert.equal(typeof process.send, 'function', 'child entry requires parent-owned IPC');
  assert.match(nonce, /^[a-f0-9]{48}$/);
  assert(['offline', 'real'].includes(mode));
  const hardStop = setTimeout(() => process.exit(9), 190000);
  const f = JSON.parse(await readFile(fixturePath, 'utf8'));
  await validate(f);
  const bridge = await createBridge(f, root, mode, join(root, 'parent-release'));
  const skill = run('git', ['-C', source, 'show', `${f.coordinatorProfileSha}:.agents/skills/isswf-coordinator/SKILL.md`]);
  const env = await runtime(root, skill);
  const requests = [], events = [], safe = { providerPromptStarted: false };
  let session, prepared, notified = false;
  const send = data => new Promise((yes, no) => process.send(data, error => error ? no(error) : yes()));
  async function ready(provenance) {
    if (notified) return;
    notified = true;
    await send({ event: 'launch-complete', provenance, pid: process.pid, nonce, requests, events, prepared, attemptDir: bridge.attemptDir, selectedRoute: { provider: session.model.provider, model: session.model.id, effort: session.thinkingLevel }, safe });
  }
  const tool = { name: 'coordinator_cli', label: 'Fixed native worker CLI', description: 'Use prepare then launch for the fixed one-worker grant. No arbitrary arguments, new IDs, retries, or other tools. After launch, stop; the external fresh reader owns observation.', parameters: env.toolSchema, execute: async (id, args) => {
    const request = { callIdSha256: hash(String(id)), operation: ['prepare', 'launch', 'read', 'reconcile'].includes(args?.operation) ? args.operation : 'invalid', ok: false };
    assert(requests.length < 8, 'coordinator tool budget exhausted'); requests.push(request);
    try { const result = await bridge.execute(args); request.ok = true; if (args.operation === 'prepare') prepared = result; return { content: [{ type: 'text', text: JSON.stringify(result) }], details: { ok: true } }; }
    catch { void session?.abort(); return { content: [{ type: 'text', text: 'Fixed operation failed; no replacement or retry is authorized.' }], details: { ok: false }, isError: true }; }
  } };
  const created = await env.sdk.createAgentSession({ cwd: root, agentDir: root, modelRuntime: env.modelRuntime, model: env.model, thinkingLevel: 'high', settingsManager: env.sdk.SettingsManager.inMemory({ retry: { enabled: false, maxRetries: 0 }, compaction: { enabled: false } }), sessionManager: env.sdk.SessionManager.inMemory(root), resourceLoader: env.resourceLoader, noTools: 'all', tools: ['coordinator_cli'], excludeTools: ['mcp__*'], customTools: [tool] });
  session = created.session;
  assert.deepEqual([session.model.provider, session.model.id, session.thinkingLevel], ['openai-codex', 'gpt-6-luna', 'high']);
  assert.deepEqual(session.getCallableToolNames(), ['coordinator_cli']);
  const consume = event => {
    if (event.type === 'message_end') { const diagnostic = safeAssistantDiagnostic(event.message); if (diagnostic) Object.assign(safe, diagnostic); }
    if (!['tool_execution_start', 'tool_execution_end'].includes(event.type) || events.length >= 16) return;
    assert.equal(event.toolName, 'coordinator_cli');
    const idHash = hash(String(event.toolCallId));
    events.push({ type: event.type, callIdSha256: idHash });
    const request = requests.find(row => row.callIdSha256 === idHash);
    if (event.type === 'tool_execution_end' && request?.operation === 'launch' && request.ok && event.result?.isError !== true && event.result?.details?.ok === true) {
      void ready(mode === 'offline' ? 'deterministic-offline-control-not-model' : 'actual-SDK-events').catch(() => process.exit(8));
      void session.abort();
    }
  };
  session.subscribe(consume);
  if (mode === 'offline') {
    for (const [id, operation] of [['control-prepare', 'prepare'], ['control-launch', 'launch']]) {
      consume({ type: 'tool_execution_start', toolName: 'coordinator_cli', toolCallId: id });
      const reply = await tool.execute(id, { operation }); assert.notEqual(reply.isError, true);
      consume({ type: 'tool_execution_end', toolName: 'coordinator_cli', toolCallId: id, result: reply });
    }
    await ready('deterministic-offline-control-not-model');
  } else {
    const promptTimer = setTimeout(() => { void session.abort(); }, 180000);
    try {
      safe.providerPromptStarted = true;
      await session.prompt(`Apply the supplied coordinator skill to this authorized disposable job. You are the one explicit LunaHigh coordinator override, not a configured default. At most one canonical native worker is authorized. Use coordinator_cli to prepare then launch exactly once, choosing these operations yourself only if the pinned facts allow it. After successful launch, stop: the external observer owns read/reconcile, and your process will be terminated for the lifecycle test. A trusted task barrier intentionally changes the dispatched task hash; preserve originalTaskSha256 and dispatchTaskSha256 separately, while brief identity remains exact. No replacement, retries, other tools, or Pstack transport. The previous offline gate proves available SDK, CLI, and bwrap prerequisites. All referenced inputs have matching Git blobs at target base; the committed brief is self-contained.\n${JSON.stringify(f)}`, { expandPromptTemplates: false, source: 'extension' });
    } finally { clearTimeout(promptTimer); }
    if (!notified) await send({ event: 'partial', safe, requests, events });
  }
  await new Promise(() => {});
  clearTimeout(hardStop);
}
async function parent(mode) {
  assert(['--offline', '--run-model'].includes(mode));
  const f = JSON.parse(await readFile(fixturePath, 'utf8'));
  await validate(f); assert.equal(f.attemptId, 'J705-native-A001');
  const files = await bindings();
  if (mode === '--run-model') {
    const gate = JSON.parse(await readFile(join(source, '.audit/coordinator-exit-44-precall.json'), 'utf8'));
    const offline = JSON.parse(await readFile(join(source, '.audit/coordinator-exit-44-offline.json'), 'utf8'));
    assert.equal(gate.verdict, 'PASS'); assert.deepEqual(gate.files, files);
    assert.equal(offline.status, 'PASS'); assert.deepEqual(offline.files, files);
    assert.equal(offline.providerPromptStarted, false);
    await writeFile(join(f.root, 'real-invocation.json'), JSON.stringify({ coordinator: 1, workerTotal: 1, files }) + '\n', { flag: 'wx', mode: 0o600 });
  }
  const root = mode === '--offline' ? await mkdtemp(join(tmpdir(), 'isswf-coordinator-exit44-control-')) : join(f.root, 'real');
  if (mode === '--run-model') await mkdir(root);
  const nonce = randomBytes(24).toString('hex');
  const coordinator = fork(self, ['--child', mode === '--offline' ? 'offline' : 'real', root, nonce], { cwd: source, env: { PATH: process.env.PATH, HOME: '/nonexistent', PI_TELEMETRY: '0' }, stdio: ['ignore', 'ignore', 'ignore', 'ipc'] });
  const exited = new Promise((yes, no) => { coordinator.once('exit', (code, signal) => yes({ code, signal })); coordinator.once('error', no); });
  let receiptTimer, owner, result, receipt, partialMessage;
  try {
    owner = await identity(coordinator.pid, nonce);
    receipt = await new Promise((yes, no) => {
      receiptTimer = setTimeout(() => no(Error('bounded coordinator launch receipt missing')), 185000);
      coordinator.on('message', message => { if (message?.event === 'launch-complete') yes(message); else if (message?.event === 'partial') { partialMessage = message; no(Error('coordinator ended without launch')); } });
      coordinator.once('exit', () => no(Error('coordinator exited before launch receipt')));
    });
    clearTimeout(receiptTimer);
    assert.equal(receipt.pid, coordinator.pid); assert.equal(receipt.nonce, nonce);
    assert.deepEqual(receipt.requests.map(row => row.operation), ['prepare', 'launch']);
    assert(receipt.requests.every(row => row.ok));
    assert.deepEqual(receipt.selectedRoute, { provider: 'openai-codex', model: 'gpt-6-luna', effort: 'high' });
    assert.equal(receipt.provenance, mode === '--offline' ? 'deterministic-offline-control-not-model' : 'actual-SDK-events');
    if (mode === '--run-model') for (const request of receipt.requests) for (const type of ['tool_execution_start', 'tool_execution_end']) assert.equal(receipt.events.filter(row => row.type === type && row.callIdSha256 === request.callIdSha256).length, 1);
    assert.notEqual(receipt.prepared.originalTaskSha256, receipt.prepared.dispatchTaskSha256);
    const dispatch = JSON.parse(await readFile(join(receipt.attemptDir, 'dispatch.json'), 'utf8'));
    assert.deepEqual([dispatch.inputSha, dispatch.targetBase, dispatch.briefPath, dispatch.briefSha256], [f.inputSha, f.targetBase, f.briefPath, f.briefSha256]);
    assert.equal(dispatch.taskSha256, receipt.prepared.dispatchTaskSha256);
    assert.equal(hash(await readFile(join(root, 'worker-task-original.mjs'))), receipt.prepared.originalTaskSha256);
    assert.equal(hash(await readFile(join(receipt.attemptDir, 'task.mjs'))), dispatch.taskSha256);
    assert.deepEqual(await identity(coordinator.pid, nonce), owner, 'only the confirmed own child may be signalled');
    coordinator.kill('SIGKILL');
    const exit = await exited;
    assert.equal(exit.signal, 'SIGKILL');
    assert.throws(() => process.kill(coordinator.pid, 0), { code: 'ESRCH' });
    const observe = operation => JSON.parse(run(process.execPath, [cli, operation, '--runs-store', join(root, 'runs'), '--attempt-id', f.attemptId]));
    const beforeRelease = observe('read');
    assert.equal(beforeRelease.state, 'running', 'fresh reader must observe the same held worker after coordinator death');
    assert.equal(await exists(join(receipt.attemptDir, 'pi-result.json')), false);
    await writeFile(join(root, 'parent-release'), 'Confirmed coordinator ESRCH; original attempt only.\n', { flag: 'wx', mode: 0o600 });
    const observations = [];
    let after;
    for (let i = 0; i < 250; i++) {
      after = observe('reconcile'); observations.push({ state: after.state });
      if (after.state === 'terminal') break;
      await delay(500);
    }
    assert.equal(after.state, 'terminal'); assert.equal(after.terminal.outcome, 'success');
    const worker = JSON.parse(await readFile(join(receipt.attemptDir, 'pi-result.json'), 'utf8'));
    assert.equal(worker.status, 'completed'); assert.equal(worker.protectedHashesPreserved, true);
    assert.deepEqual([worker.briefPath, worker.inputSha, worker.briefSha256], [f.briefPath, f.inputSha, f.briefSha256]);
    assert.deepEqual([worker.provider, worker.model, worker.effort], ['openai-codex', 'gpt-6-luna', 'high']);
    if (mode === '--run-model') { assert.equal(worker.acceptance, true); assert.equal(worker.boundaryCallAttributed, true); }
    else { assert.equal(worker.providerPromptStarted, false); assert.equal(worker.boundaryCheckPassed, true); }
    const checkpoint = JSON.parse(await readFile(join(root, 'before.json'), 'utf8'));
    for (const path of f.referencedInputs) assert.equal(checkpoint.files[path].sha256, hash(git(f, f.targetBase, path)));
    const parentOutcome = JSON.parse(run(process.execPath, [checker, 'after', join(receipt.attemptDir, 'workspace'), join(root, 'before.json')]));
    assert.deepEqual(parentOutcome.changed, ['src/math.mjs']);
    assert.deepEqual(await readdir(join(root, 'runs')), [f.attemptId]);
    result = { status: 'PASS', providerPromptStarted: mode === '--run-model', root, files, receipt, coordinatorExit: { ...exit, confirmedIdentity: owner, esrchBeforeRelease: true }, beforeRelease: { state: beforeRelease.state, reader: 'fresh CLI process, no model' }, observations, worker, parentOutcome, workerTotal: 1, scope: 'Own disposable native coordinator process killed after launch; same detached attempt survives and fresh CLI processes observe terminal. Not main-chat teardown, model restart, general recovery, all-descendant death, daemon, or client readiness.' };
  } catch (error) {
    result = { status: 'PARTIAL', providerPromptStarted: receipt?.safe?.providerPromptStarted ?? partialMessage?.safe?.providerPromptStarted ?? (mode === '--offline' ? false : null), safe: partialMessage?.safe, root, files, errorName: error?.name ?? 'Error', scope: 'No retry/replacement. Retain partial attempt and reconcile ownership. Release is not performed when coordinator identity/death is uncertain.' };
    process.exitCode = 2;
  } finally {
    clearTimeout(receiptTimer);
    if (owner && coordinator.exitCode === null && coordinator.signalCode === null) {
      try { assert.deepEqual(await identity(coordinator.pid, nonce), owner); coordinator.kill('SIGKILL'); await exited; } catch {}
    }
  }
  console.log(JSON.stringify(result));
}
if (process.argv[2] === '--child') await child(...process.argv.slice(3));
else await parent(process.argv[2]);
