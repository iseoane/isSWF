import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function safeAssistantDiagnostic(message) {
  if (message?.role !== 'assistant') return null;
  const allowed = ['stop', 'length', 'toolUse', 'error', 'aborted', 'deferred'];
  const error = message.stopReason === 'error' && typeof message.errorMessage === 'string' ? message.errorMessage.slice(0, 8000) : '';
  return {
    assistantMessageObserved: true,
    assistantStopReason: allowed.includes(message.stopReason) ? message.stopReason : 'unknown',
    assistantErrorIndicators: {
      quotaOrRate: /\bquota\b|\busage limit\b|\brate limit\b|\bHTTP\s*429\b/i.test(error),
      auth: /\bunauthenticated\b|\bunauthorized\b|\binvalid (?:api key|token)\b|\bexpired (?:token|credential)\b|\bHTTP\s*(?:401|403)\b/i.test(error),
      modelUnsupported: /\bmodel (?:not found|unavailable|unsupported)\b|\bunsupported model\b/i.test(error),
      transport: /\bECONN(?:RESET|REFUSED)\b|\bENOTFOUND\b|\bETIMEDOUT\b|\bnetwork error\b/i.test(error),
    },
  };
}
function replaceOnce(source, oldText, newText) {
  assert.equal(source.split(oldText).length, 2, 'instrumentation must match exactly one known code region');
  return source.replace(oldText, newText);
}
async function prepare() {
  const old = JSON.parse(await readFile('.audit/coordinator-44-fixture.json', 'utf8'));
  const prior = JSON.parse(await readFile('.audit/coordinator-44-native-result.json', 'utf8'));
  assert.equal(prior.observation.state, 'terminal');
  assert.equal(prior.observation.terminal.outcome, 'failure');
  assert.equal(prior.taskResult.toolCalls, 0);
  const parent = JSON.parse(await readFile('.audit/coordinator-44-parent-after-first.json', 'utf8'));
  assert.deepEqual(parent.changedTrackedPaths, []);
  const git = args => execFileSync('git', ['-C', old.repo, ...args], { encoding: 'utf8' });
  const oldBrief = git(['show', `${old.inputCheckpoint}:${old.briefPath}`]);
  const brief = oldBrief.replace('one worker total, no alternate or retry.', 'this is A002, the one additional instrumented worker explicitly approved after A001 exited without changes. Two workers total are now authorized for this implementation job, with no automatic further retry or alternate.') + `\nThe target codebase checkpoint is ${old.targetBase}. This materialized reconstruction has no Git metadata; the host pins the separately committed brief revision. The earlier brief revision is repository data, not authority for this newly approved attempt.\n`;
  assert.notEqual(brief, oldBrief);
  const briefPath = '.factory/jobs/J703/brief-r2.md';
  await writeFile(join(old.repo, briefPath), brief, { flag: 'wx' });
  git(['add', '--', briefPath]);
  git(['-c', 'user.name=isSWF Fixture', '-c', 'user.email=fixture@local.invalid', 'commit', '--quiet', '-m', 'Pin explicitly approved instrumented replacement attempt']);
  const inputCheckpoint = git(['rev-parse', 'HEAD']).trim();
  const config = JSON.parse(await readFile(join(old.root, 'trusted.json'), 'utf8'));
  config.briefText = git(['show', `${inputCheckpoint}:${briefPath}`]);
  const configPath = join(old.root, 'trusted-instrumented.json');
  await writeFile(configPath, JSON.stringify(config), { flag: 'wx', mode: 0o600 });
  const generatedPath = join(old.root, 'uninstrumented-r2-task.mjs');
  const generated = spawnSync(process.execPath, ['tools/pi-worker-task.mjs', 'prepare', '--config', configPath, '--output', generatedPath], { encoding: 'utf8', timeout: 15000 });
  assert.equal(generated.status, 0, generated.stderr);
  let source = await readFile(generatedPath, 'utf8');
  source = replaceOnce(source, 'const processStartedAt = Date.now();', `${safeAssistantDiagnostic.toString()}\nconst processStartedAt = Date.now();`);
  source = replaceOnce(source, 'const safeResult = { version: 1,', "const safeResult = { assistantMessageObserved: false, assistantStopReason: 'unobserved', promptRejected: false, version: 1,");
  source = replaceOnce(source, 'session.subscribe(event=>{', "session.subscribe(event=>{\n      if(event.type==='message_end') { const diagnostic=safeAssistantDiagnostic(event.message); if(diagnostic) Object.assign(safeResult,diagnostic); }");
  source = replaceOnce(source, '); } finally { clearTimeout(timer); }', '); } catch (promptError) { safeResult.promptRejected = true; throw promptError; } finally { clearTimeout(timer); }');
  const taskPath = join(old.root, 'trusted-instrumented-task.mjs');
  await writeFile(taskPath, source, { flag: 'wx', mode: 0o600 });
  assert.equal(spawnSync(process.execPath, ['--check', taskPath], { encoding: 'utf8' }).status, 0);
  const proof = spawnSync(process.execPath, ['.audit/verify-coordinator-44-diagnostic.mjs', taskPath], { encoding: 'utf8', timeout: 5000 });
  assert.equal(proof.status, 0, proof.stderr);
  await writeFile('.audit/coordinator-44-diagnostic-green.json', proof.stdout, { flag: 'wx' });
  const fixture = { ...old, inputCheckpoint, briefPath, taskPath, attemptId: 'J703-native-A002', recordPrefix: '.audit/coordinator-44-instrumented', gatePath: '.audit/coordinator-44-instrumented-precall.json', grantRef: 'operator-Su-approved-one-instrumented-native-replacement', invocationFile: 'instrumented-invocation.json', prepared: { ...JSON.parse(generated.stdout), taskSha256: createHash('sha256').update(source).digest('hex'), instrumented: true }, exactBriefHash: createHash('sha256').update(config.briefText).digest('hex'), scope: 'One explicitly approved replacement after terminal A001, no fallback. Target base remains original code; input brief is new r2 checkpoint. Diagnostic event metadata only; original failure cause stays unknown.' };
  await writeFile('.audit/coordinator-44-instrumented-fixture.json', JSON.stringify(fixture, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ inputCheckpoint, targetBase: fixture.targetBase, taskPath, taskSha256: fixture.prepared.taskSha256, diagnosticTests: 'PASS', providerPromptStarted: false }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await prepare();
