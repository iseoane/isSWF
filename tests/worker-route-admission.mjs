import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, cp, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const source = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));
const temp = await mkdtemp(join(tmpdir(), 'isswf-worker-route-'));
const fixture = join(temp, 'fixture');
const packageStore = join(temp, 'packages');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
function command(binary, args, cwd = fixture) {
  const result = spawnSync(binary, args, { cwd, encoding: 'utf8', timeout: 8000, maxBuffer: 1024 * 1024, env: { PATH: process.env.PATH || '/usr/bin:/bin', HOME: temp } });
  if (result.error) throw result.error;
  return result;
}
function git(...args) {
  const result = command('git', args);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
const commit = message => { git('add', '-A'); git('commit', '-m', message); return git('rev-parse', 'HEAD'); };
const readJSON = async path => JSON.parse(await readFile(path, 'utf8'));
try {
  await mkdir(fixture, { recursive: true });
  for (const path of ['.gitattributes', '.agents/skills/isswf-coordinator', '.agents/skills/isswf-setup', '.agents/skills/isswf-writing', '.agents/skills/isswf-understanding', '.agents/skills/isswf-pr', '.agents/skills/isswf-issue', '.agents/skills/isswf-e2e', '.agents/skills/isswf-debug', '.agents/skills/isswf-review', '.agents/skills/isswf-retrospective', '.agents/skills/isswf-tdd', '.agents/skills/isswf-security', '.agents/skills/isswf-performance', '.agents/skills/isswf-observability', '.agents/roles', 'docs/model-routing.md', 'docs/durable-work.md', '.factory/templates', '.factory/models.json', 'package.json']) {
    await mkdir(dirname(join(fixture, path)), { recursive: true });
    await cp(join(source, path), join(fixture, path), { recursive: true });
  }
  const runtime = ['isswf-job.mjs', 'factory-package.mjs', 'pi-worker-task.mjs', 'worker-lifecycle.mjs', 'native-recovery.mjs', 'external-effect-journal.mjs', 'recovery-review.mjs', 'job-successor.mjs', 'isswf-plan.mjs', 'release-source.mjs', 'project-state.mjs', 'platform-runtime.mjs', 'windows-tool-sandbox.mjs', 'windows-worker-identity.mjs', 'windows-worker-host.mjs'];
  await mkdir(join(fixture, 'tools'), { recursive: true });
  for (const name of runtime) await cp(join(source, 'tools', name), join(fixture, 'tools', name));
  git('init', '-q');
  git('config', 'user.name', 'Regression Test'); git('config', 'user.email', 'test@example.invalid');
  const runtimeSha = commit('fixture runtime and factory resources');
  // Materialize the repository checkout policy in this disposable fixture.
  // This never normalizes bytes in the production runtime integrity check.
  for (const name of runtime) await rm(join(fixture, 'tools', name));
  git('checkout-index', '--all', '--force');

  await mkdir(join(fixture, '.pi'), { recursive: true });
  await writeFile(join(fixture, '.pi/settings.json'), '{"packages":[]}\n');
  const canonicalConfig = await readJSON(join(fixture, '.factory/models.json'));
  let config = structuredClone(canonicalConfig);
  const setupConfigCommit = async route => {
    config.roles.worker = route;
    await writeFile(join(fixture, '.factory/models.json'), `${JSON.stringify(config, null, 2)}\n`);
    const configSha = commit('pinned worker model configuration');
    return { sha: configSha, bytes: await readFile(join(fixture, '.factory/models.json')) };
  };
  const initial = await setupConfigCommit(config.roles.worker);
  const materialize = command(process.execPath, [join(fixture, 'tools/factory-package.mjs'), 'materialize', '--source', fixture, '--revision', runtimeSha, '--store', packageStore]);
  assert.equal(materialize.status, 0, materialize.stderr);
  const packagePath = join(packageStore, runtimeSha);
  const activate = command(process.execPath, [join(fixture, 'tools/factory-package.mjs'), 'activate', '--package', packagePath, '--project', fixture]);
  assert.equal(activate.status, 0, activate.stderr);

  await mkdir(join(fixture, '.factory/jobs/route-regression'), { recursive: true });
  const briefPath = '.factory/jobs/route-regression/brief.md';
  await writeFile(join(fixture, briefPath), 'Local route admission regression fixture.\n');
  const input = async (modelPin, id) => {
    const job = {
      version: 1, runtimeSha, targetBase: runtimeSha,
      methodologySha: '37a56ebc902e94f21fc10666f33fceac44946af7',
      exclusiveAttempt: true, workerTotal: 1, logicalJobRef: `route-regression-${id}`,
      models: { sha: modelPin.sha, path: '.factory/models.json', sha256: sha256(modelPin.bytes) },
      briefPath, sdkPath: 'relative-sdk-path', expectedMutablePaths: [],
      protectedCheckCommand: [], offlineChecks: [],
    };
    const path = join(fixture, `.factory/jobs/route-regression/${id}.json`);
    await writeFile(path, `${JSON.stringify(job, null, 2)}\n`);
    return commit(`job input ${id}`);
  };
  const run = async (id, inputSha, expected) => {
    const store = join(temp, `runs-${id}`);
    const result = command(process.execPath, [join(fixture, 'tools/isswf-job.mjs'), 'run', '--project', fixture, '--input-sha', inputSha, '--job', `.factory/jobs/route-regression/${id}.json`, '--runs-store', store, '--attempt-id', `attempt-${id}`, '--grant-ref', 'trusted-regression-fixture', '--mode', 'offline']);
    assert.notEqual(result.status, 0, `${id}: command unexpectedly succeeded`);
    assert.match(result.stderr, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${id}: ${result.stderr}`);
    await assert.rejects(readdir(store), error => error.code === 'ENOENT', `${id}: runs store was created`);
    return result;
  };

  let pin = initial;
  let inputSha = await input(pin, 'canonical');
  await run('canonical', inputSha, 'job.sdkPath must be absolute');

  const cases = [
    ['wrong-model', [{ model: 'openai-codex/not-luna', effort: 'high' }]],
    ['wrong-effort', [{ model: 'openai-codex/gpt-6-luna', effort: 'medium' }]],
    ['two-routes', [{ model: 'openai-codex/gpt-6-luna', effort: 'high' }, { model: 'openai-codex/gpt-6-luna', effort: 'high' }]],
    ['extra-tuple-key', [{ model: 'openai-codex/gpt-6-luna', effort: 'high', fallback: false }]],
    ['wrong-schema-version', null],
    ['malformed-worker-shape', 'openai-codex/gpt-6-luna'],
  ];
  for (const [id, route] of cases) {
    config = structuredClone(canonicalConfig);
    if (id === 'wrong-schema-version') config.schemaVersion = 2;
    else config.roles.worker = route;
    const bytes = Buffer.from(`${JSON.stringify(config, null, 2)}\n`);
    await writeFile(join(fixture, '.factory/models.json'), bytes);
    pin = { sha: commit(`invalid config ${id}`), bytes };
    inputSha = await input(pin, id);
    await run(id, inputSha, 'only exact configured LunaHigh worker route supported; no fallback');
  }
  console.log('PASS public worker route admission guard and canonical-route positive control');
} finally {
  await rm(temp, { recursive: true, force: true });
}
