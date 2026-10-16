import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { access, mkdir, mkdtemp, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { safeAssistantDiagnostic } from './coordinator-44-diagnostic.mjs';

const SOURCE = resolve(fileURLToPath(new URL('..', import.meta.url)));
const SDK = '/home/iseoane/.pi/agent/install/releases/1.2.0/node_modules/@earendil-works/pi-coding-agent';
const AUTH = '/home/iseoane/.pi/agent/auth.json';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const cli = join(SOURCE, 'tools/worker-lifecycle.mjs');
const preparer = join(SOURCE, 'tools/pi-worker-task.mjs');
const checker = join(SOURCE, '.audit/verify-pi-worker-44-parent.mjs');
const selfPath = fileURLToPath(import.meta.url);
const command = (program, args, cwd = SOURCE) => {
  const result = spawnSync(program, args, { cwd, encoding: 'utf8', timeout: 15000, maxBuffer: 128000, env: { PATH: process.env.PATH, HOME: '/nonexistent', PI_TELEMETRY: '0' } });
  assert.equal(result.error, undefined, 'bounded command must complete');
  assert.equal(result.status, 0, 'fixed local command must succeed');
  return result.stdout;
};
const gitBytes = (repo, object) => {
  const result = spawnSync('git', ['-C', repo, 'show', object], { timeout: 10000, maxBuffer: 128000 });
  assert.equal(result.status, 0, 'pinned Git object must exist');
  return result.stdout;
};
async function validate(f) {
  for (const key of ['factorySha', 'modelConfigSha', 'coordinatorProfileSha', 'workerMethodologySha', 'inputSha', 'targetBase']) assert.match(f[key], /^[0-9a-f]{40}$/);
  assert.deepEqual(f.actorBudget, { coordinator: 1, workerTotal: 1, automaticRetries: 0 });
  assert.deepEqual(f.workerRoute, [{ model: 'openai-codex/gpt-6-luna', effort: 'high' }]);
  assert.equal(f.coordinatorOverride.model, 'openai-codex/gpt-6-luna');
  assert.equal(f.coordinatorOverride.effort, 'high');
  assert.deepEqual(JSON.parse(gitBytes(SOURCE, `${f.modelConfigSha}:${f.modelConfigPath}`)).roles.worker, f.workerRoute);
  assert.equal(hash(gitBytes(f.repo, `${f.inputSha}:${f.briefPath}`)), f.briefSha256);
  for (const path of f.referencedInputs) assert(gitBytes(f.repo, `${f.inputSha}:${path}`).equals(gitBytes(f.repo, `${f.targetBase}:${path}`)), 'referenced inputs must match target base');
  for (const path of ['tools/pi-worker-task.mjs', 'tools/worker-lifecycle.mjs', '.agents/skills/isswf-coordinator/SKILL.md', '.audit/verify-pi-worker-44-parent.mjs', '.audit/coordinator-44-diagnostic.mjs']) assert((await readFile(join(SOURCE, path))).equals(gitBytes(SOURCE, `${f.factorySha}:${path}`)), 'approved source bytes must still match');
  assert.deepEqual(f.writePaths, ['src/math.mjs']);
  assert(['J704-native-A001', 'J705-native-A001'].includes(f.attemptId));
}
async function createBridge(f, root, mode, releasePath) {
  await validate(f);
  const runs = join(root, 'runs');
  const attemptDir = join(runs, f.attemptId);
  const workspace = join(attemptDir, 'workspace');
  const baseline = join(root, 'baseline');
  await mkdir(join(baseline, 'src'), { recursive: true });
  for (const path of f.referencedInputs) await writeFile(join(baseline, path), gitBytes(f.repo, `${f.targetBase}:${path}`));
  const checkpoint = join(root, 'before.json');
  const before = JSON.parse(command(process.execPath, [checker, 'before', baseline, checkpoint, JSON.stringify(f.writePaths)]));
  const baselineRecord = JSON.parse(await readFile(checkpoint, 'utf8'));
  baselineRecord.workspace = workspace;
  baselineRecord.binding = 'Exact target-base Git blobs, checked before launch; not an observation of a live worker workspace';
  await writeFile(checkpoint, JSON.stringify(baselineRecord, null, 2) + '\n');
  const profileFiles = ['.agents/roles/worker.md', ...['bug-diagnosis', 'tdd', 'design-principles', 'execution-principles', 'verification-principles', 'code-quality', 'comments'].map(name => `.agents/roles/references/${name}.md`)];
  const config = { version: 1, mode, sdkPath: SDK, nodeBinary: process.execPath, authPath: AUTH, profile: { repo: SOURCE, sha: f.workerMethodologySha, files: profileFiles }, brief: { repo: f.repo, inputSha: f.inputSha, path: f.briefPath }, expectedMutablePaths: f.writePaths, protectedCheckCommand: 'node check.mjs', checks: mode === 'offline' ? [
    { name: 'red', command: 'node check.mjs', expectedExitCode: 1 },
    { name: 'deterministic-control', command: `node -e "const fs=require('node:fs');fs.writeFileSync('src/math.mjs',fs.readFileSync('src/math.mjs','utf8').replace('a + b + 1','a * b'))"`, expectedExitCode: 0 },
    { name: 'green', command: 'node check.mjs', expectedExitCode: 0 },
  ] : [] };
  const configPath = join(root, 'worker-config.json'), taskPath = join(root, 'worker-task.mjs');
  await writeFile(configPath, JSON.stringify(config), { flag: 'wx', mode: 0o600 });
  let state = 'fresh', prepared, launch, terminal, dispatchTaskSha256;
  const trace = [];
  let toolCalls = 0;
  const observe = operation => JSON.parse(command(process.execPath, [cli, operation, '--runs-store', runs, '--attempt-id', f.attemptId]));
  async function execute(args) {
    assert(args && Object.keys(args).length === 1 && Object.hasOwn(args, 'operation'), 'only the operation enum is accepted');
    assert(['prepare', 'launch', 'read', 'reconcile'].includes(args.operation), 'unknown operation');
    assert(++toolCalls <= 24, 'coordinator tool budget exhausted');
    const operation = args.operation;
    let output;
    if (operation === 'prepare') {
      assert.equal(state, 'fresh', 'prepare must be exclusive');
      prepared = JSON.parse(command(process.execPath, [preparer, 'prepare', '--config', configPath, '--output', taskPath]));
      assert.deepEqual([prepared.briefPath, prepared.inputSha, prepared.briefSha256], [f.briefPath, f.inputSha, f.briefSha256]);
      assert.equal(prepared.taskSha256, hash(await readFile(taskPath)));
      dispatchTaskSha256 = prepared.taskSha256;
      if (releasePath !== undefined) {
        assert.equal(releasePath, join(root, 'parent-release'), 'trusted barrier must use the private run root');
        const original = await readFile(taskPath);
        const barrier = `const barrierFs=await import('node:fs/promises');let barrierReady=false;for(let i=0;i<400;i++){try{await barrierFs.access(${JSON.stringify(releasePath)});barrierReady=true;break;}catch{}await new Promise(r=>setTimeout(r,25));}if(!barrierReady)process.exit(9);\n`;
        await writeFile(join(root, 'worker-task-original.mjs'), original, { flag: 'wx', mode: 0o600 });
        const gated = barrier + original.toString('utf8').replace(/^#![^\n]*(?:\n|$)/, '');
        await writeFile(taskPath, gated, { mode: 0o600 });
        command(process.execPath, ['--check', taskPath]);
        dispatchTaskSha256 = hash(gated);
        prepared = { ...prepared, originalTaskSha256: prepared.taskSha256, dispatchTaskSha256, barrierSha256: hash(barrier), transform: 'Remove initial shebang and prefix trusted 10-second parent-release barrier before SDK imports' };
      }
      state = 'prepared';
      output = prepared;
    } else if (operation === 'launch') {
      assert.equal(state, 'prepared', 'one total worker: launch only after successful preparation');
      assert.equal(await access(attemptDir).then(() => true, error => { assert.equal(error.code, 'ENOENT'); return false; }), false, 'fresh attempt requires explicit absence');
      assert.equal(hash(await readFile(taskPath)), dispatchTaskSha256);
      state = 'claimed';
      launch = JSON.parse(command(process.execPath, [cli, 'launch', '--repo', f.repo, '--input-sha', f.inputSha, '--brief', f.briefPath, '--target-base', f.targetBase, '--attempt-id', f.attemptId, '--runs-store', runs, '--grant-ref', 'operator-native-coordinator-E2E-one-worker-total', '--task-script', taskPath, '--timeout-ms', '120000', '--output-bytes', '16384']));
      const dispatch = JSON.parse(await readFile(join(attemptDir, 'dispatch.json'), 'utf8'));
      assert.equal(dispatch.taskSha256, dispatchTaskSha256);
      state = 'launched';
      output = { attemptId: launch.attemptId, state: 'launched', taskSha256: dispatchTaskSha256 };
    } else {
      assert.equal(state, 'launched', 'observation requires this attempt to have launched');
      await delay(1500);
      const record = observe(operation);
      if (record.state === 'terminal') terminal = record;
      output = { attemptId: f.attemptId, state: record.state, ...(record.state === 'terminal' ? { outcome: record.terminal.outcome, exitCode: record.terminal.exitCode, timedOut: record.terminal.timedOut } : {}) };
    }
    trace.push({ operation, state: output.state ?? 'prepared', ok: true, ...(output.outcome ? { outcome: output.outcome } : {}) });
    return output;
  }
  async function outcome() {
    assert(terminal?.state === 'terminal', 'coordinator must observe terminal state');
    assert.equal(terminal.terminal.outcome, 'success');
    const worker = JSON.parse(await readFile(join(attemptDir, 'pi-result.json'), 'utf8'));
    assert.deepEqual([worker.briefPath, worker.inputSha, worker.briefSha256], [f.briefPath, f.inputSha, f.briefSha256]);
    assert.deepEqual([worker.provider, worker.model, worker.effort], ['openai-codex', 'gpt-6-luna', 'high']);
    assert.equal(worker.status, 'completed');
    assert.equal(worker.protectedHashesPreserved, true);
    if (mode === 'real') { assert.equal(worker.acceptance, true); assert.equal(worker.boundaryCallAttributed, true); }
    else { assert.equal(worker.providerPromptStarted, false); assert.equal(worker.boundaryCheckPassed, true); }
    assert.deepEqual(await readdir(runs), [f.attemptId]);
    const parent = JSON.parse(command(process.execPath, [checker, 'after', workspace, checkpoint]));
    assert.deepEqual(parent.changed, f.writePaths);
    return { worker, parent, before, prepared, attemptDir, trace };
  }
  return { execute, outcome, trace, root, attemptDir, get state() { return state; } };
}
async function runtime(root, skill) {
  const requireSdk = createRequire(join(SDK, 'package.json'));
  const sdk = requireSdk(SDK), Type = requireSdk('typebox').Type;
  const modelRuntime = await sdk.ModelRuntime.create({ authPath: AUTH, modelsPath: join(root, 'unused-models.json'), allowModelNetwork: false, refreshOnCreate: true });
  assert.equal(modelRuntime.hasConfiguredAuth('openai-codex'), true, 'configured opaque host auth required');
  const model = modelRuntime.getModel('openai-codex', 'gpt-6-luna');
  assert.deepEqual([model?.provider, model?.id], ['openai-codex', 'gpt-6-luna']);
  const resourceLoader = { getExtensions: () => ({ extensions: [], errors: [], runtime: sdk.createExtensionRuntime() }), getSkills: () => ({ skills: [], diagnostics: [] }), getPrompts: () => ({ prompts: [], diagnostics: [] }), getThemes: () => ({ themes: [], diagnostics: [] }), getAgentsFiles: () => ({ agentsFiles: [] }), getSystemPrompt: () => skill, getSystemPromptSource: () => undefined, getAppendSystemPrompt: () => [], getAppendSystemPromptSources: () => [], extendResources: () => {}, reload: async () => {} };
  const toolSchema = Type.Object({ operation: Type.Union(['prepare', 'launch', 'read', 'reconcile'].map(value => Type.Literal(value))) }, { additionalProperties: false });
  return { sdk, modelRuntime, model, resourceLoader, toolSchema };
}
async function main() {
  const mode = process.argv[2];
  assert(['--offline', '--run-model'].includes(mode), 'explicit --offline|--run-model required');
  const fixturePath = join(SOURCE, '.audit/native-coordinator-44-fixture.json');
  const f = JSON.parse(await readFile(fixturePath, 'utf8'));
  await validate(f);
  const scriptSha256 = hash(await readFile(selfPath));
  const fixtureSha256 = hash(await readFile(fixturePath));
  const skill = gitBytes(SOURCE, `${f.coordinatorProfileSha}:.agents/skills/isswf-coordinator/SKILL.md`).toString('utf8');
  const root = mode === '--offline' ? await mkdtemp(join(tmpdir(), 'isswf-native-coord44-offline-')) : join(f.root, 'real');
  if (mode === '--run-model') {
    const gate = JSON.parse(await readFile(join(SOURCE, '.audit/native-coordinator-44-precall.json'), 'utf8'));
    const offline = JSON.parse(await readFile(join(SOURCE, '.audit/native-coordinator-44-offline.json'), 'utf8'));
    assert.equal(gate.verdict, 'PASS');
    assert.equal(gate.scriptSha256, scriptSha256); assert.equal(gate.fixtureSha256, fixtureSha256);
    assert.equal(offline.status, 'PASS'); assert.equal(offline.scriptSha256, scriptSha256); assert.equal(offline.providerPromptStarted, false);
    await writeFile(join(f.root, 'coordinator-invocation.json'), JSON.stringify({ scriptSha256, fixtureSha256, coordinator: 1, workerTotal: 1, startedAt: new Date().toISOString() }) + '\n', { flag: 'wx', mode: 0o600 });
    await mkdir(root);
  }
  const bridge = await createBridge(f, root, mode === '--offline' ? 'offline' : 'real');
  const env = await runtime(root, skill);
  let session;
  const summary = { providerPromptStarted: false, coordinatorRoute: f.coordinatorOverride, callableTools: ['coordinator_cli'], scriptSha256, fixtureSha256, root, profileSha256: hash(skill), workerBudget: 1 };
  const requests = [], toolEvents = [];
  const tool = { name: 'coordinator_cli', label: 'Fixed native worker CLI', description: 'Choose one operation against the fixed authorized job. prepare uses the pinned config; launch claims the one total worker. read or reconcile observe only. No arbitrary arguments, shell, new attempt IDs, or alternate routes.', parameters: env.toolSchema, execute: async (id, args) => {
    if (requests.length >= 24) { summary.toolBudgetExceeded = true; void session?.abort(); return { content: [{ type: 'text', text: 'Coordinator tool budget exhausted.' }], isError: true }; }
    const request = { callIdSha256: hash(String(id)), operation: ['prepare', 'launch', 'read', 'reconcile'].includes(args?.operation) ? args.operation : 'invalid', ok: false };
    requests.push(request);
    try { const result = await bridge.execute(args); request.ok = true; return { content: [{ type: 'text', text: JSON.stringify(result) }], details: { operation: args.operation, ok: true } }; }
    catch { return { content: [{ type: 'text', text: 'Operation refused or failed. Do not retry launch or create another actor; report the blocked state.' }], details: { ok: false }, isError: true }; }
  } };
  const created = await env.sdk.createAgentSession({ cwd: root, agentDir: root, modelRuntime: env.modelRuntime, model: env.model, thinkingLevel: 'high', settingsManager: env.sdk.SettingsManager.inMemory({ retry: { enabled: false, maxRetries: 0 }, compaction: { enabled: false } }), sessionManager: env.sdk.SessionManager.inMemory(root), resourceLoader: env.resourceLoader, noTools: 'all', tools: ['coordinator_cli'], excludeTools: ['mcp__*'], customTools: [tool] });
  session = created.session;
  let timer;
  try {
    assert.deepEqual([session.model?.provider, session.model?.id, session.thinkingLevel], ['openai-codex', 'gpt-6-luna', 'high']);
    assert.deepEqual(session.getCallableToolNames(), ['coordinator_cli']);
    if (mode === '--offline') {
      await assert.rejects(bridge.execute({ operation: 'shell' }), /unknown operation/);
      await assert.rejects(bridge.execute({ operation: 'prepare', command: 'anything' }), /only the operation/);
      await assert.rejects(bridge.execute({ operation: 'launch' }), /only after successful/);
      await bridge.execute({ operation: 'prepare' });
      await assert.rejects(bridge.execute({ operation: 'prepare' }), /exclusive/);
      await bridge.execute({ operation: 'launch' });
      await assert.rejects(bridge.execute({ operation: 'launch' }), /only after successful/);
      for (let i = 0; i < 12; i++) { const r = await bridge.execute({ operation: 'read' }); if (r.state === 'terminal') break; }
      const outcome = await bridge.outcome();
      await assert.rejects(bridge.execute({ operation: 'launch' }), /only after successful/);
      console.log(JSON.stringify({ status: 'PASS', ...summary, controls: ['unknown-operation', 'extra-argument', 'launch-before-prepare', 'duplicate-prepare', 'one-total-launch', 'no-replacement-after-terminal', 'singleton-callable-tool'], outcome, scope: 'Direct offline test driver using the actual bridge and deterministic worker SDK controls. Not a model-driven coordinator proof.' }));
    } else {
      let deadline = false;
      session.subscribe(event => {
        if (event.type === 'message_end') { const diagnostic = safeAssistantDiagnostic(event.message); if (diagnostic) Object.assign(summary, diagnostic); }
        if (['tool_execution_start', 'tool_execution_end'].includes(event.type) && toolEvents.length < 50) toolEvents.push({ type: event.type, tool: event.toolName === 'coordinator_cli' ? 'coordinator_cli' : 'unexpected', callIdSha256: hash(String(event.toolCallId)) });
      });
      timer = setTimeout(() => { deadline = true; void session.abort(); }, 180000);
      summary.providerPromptStarted = true;
      const facts = { ...f, source: SOURCE, capabilityPreflight: 'Offline SDK/tool/bridge/worker controls passed; no Pstack transport exists in this session.', modelConfig: JSON.parse(gitBytes(SOURCE, `${f.modelConfigSha}:${f.modelConfigPath}`)), workerBrief: gitBytes(f.repo, `${f.inputSha}:${f.briefPath}`).toString('utf8') };
      await session.prompt(`Apply the supplied coordinator skill to this fixed disposable authorized job. You have exactly one coordinator actor and at most one native worker, no retries or fallback. The whole-role coordinator override is explicitly authorized; it is not a project default. Inspect the pinned facts below, choose whether dispatch is permitted, then use coordinator_cli yourself for prepare, launch, and read or reconcile until you observe terminal evidence. Each observation waits 1.5 seconds before one actual CLI query. No other tool or transport is available. Never repeat launch after any result. A failed/unknown worker blocks acceptance. Terminal success must be observed, not inferred; report limits without claiming independent review or full factory completion.\n${JSON.stringify(facts)}`, { expandPromptTemplates: false, source: 'extension' });
      clearTimeout(timer);
      assert.equal(deadline, false, 'coordinator deadline must not be reached');
      assert.notEqual(summary.toolBudgetExceeded, true);
      assert(requests.every(request => request.ok), 'refused calls must not disappear from behavioral evidence');
      assert.equal(requests.filter(request => request.operation === 'launch').length, 1);
      assert(toolEvents.every(event => event.tool === 'coordinator_cli'));
      for (const request of requests) for (const type of ['tool_execution_start', 'tool_execution_end']) assert.equal(toolEvents.filter(event => event.type === type && event.callIdSha256 === request.callIdSha256).length, 1, 'actual SDK event must attribute each operation');
      assert.equal(bridge.trace.filter(e => e.operation === 'launch').length, 1);
      assert.deepEqual(bridge.trace.slice(0, 2).map(e => e.operation), ['prepare', 'launch']);
      assert(bridge.trace.some(e => ['read', 'reconcile'].includes(e.operation) && e.state === 'terminal'), 'model must observe terminal');
      const outcome = await bridge.outcome();
      console.log(JSON.stringify({ status: 'PASS', ...summary, requests, toolEvents, outcome, scope: 'Actual SDK coordinator chose fixed CLI operations and observed one native worker; parent independently checks product. No main-chat teardown or general coordinator/runtime security proof.' }));
    }
  } catch (error) {
    console.log(JSON.stringify({ status: 'PARTIAL', ...summary, requests, toolEvents, errorName: error?.name ?? 'Error', trace: bridge.trace, state: bridge.state, attemptDir: bridge.attemptDir, scope: 'No automatic retry or fallback; inspect retained attempt and reconcile ownership before another actor.' }));
    process.exitCode = 2;
  } finally {
    clearTimeout(timer);
    await session.dispose();
  }
}
export { createBridge, runtime, validate };
if (process.argv[1] && resolve(process.argv[1]) === selfPath) await main();
