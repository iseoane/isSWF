import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const source = resolve('.');
const sourceSha = '3cc796f27b948069b628e1809b1fad49267d4cfd';
const git = (repo, ...args) => {
  const result = spawnSync('git', ['-C', repo, ...args], { encoding: 'utf8', timeout: 10000, maxBuffer: 128000 });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};
const factorySha = git(source, 'rev-parse', `${sourceSha}^{commit}`);
const root = await mkdtemp(join(tmpdir(), 'isswf-coordinator-exit44-'));
const repo = join(root, 'repo');
await mkdir(join(repo, 'src'), { recursive: true });
git(repo, 'init', '-q');
await writeFile(join(repo, 'src/math.mjs'), 'export const add = (a, b) => a + b;\nexport const multiply = (a, b) => a + b + 1;\n');
await writeFile(join(repo, 'check.mjs'), "import assert from 'node:assert/strict';import {add,multiply} from './src/math.mjs';assert.equal(multiply(3,7),21);assert.equal(multiply(-2,3),-6);assert.equal(multiply(0,8),0);assert.equal(add(7,3),10);assert.equal(add(-2,3),1);console.log('PASS two sum and three product assertions');\n");
const commit = message => {
  git(repo, 'add', '.');
  git(repo, '-c', 'user.name=isSWF Fixture', '-c', 'user.email=fixture@local.invalid', 'commit', '-qm', message);
  return git(repo, 'rev-parse', 'HEAD');
};
const targetBase = commit('Pin disposable product regression');
const briefPath = '.factory/jobs/J705/brief-r1.md';
await mkdir(join(repo, '.factory/jobs/J705'), { recursive: true });
const brief = '# J705\n\nCorrect multiply(a,b) in src/math.mjs to return the arithmetic product for positive, negative, and zero inputs. Preserve add(a,b). Read src/math.mjs and check.mjs, then edit ONLY src/math.mjs. The two referenced files are available unchanged at the job input and target base. Run node check.mjs and request the trusted sandbox_shell boundary_check operation. Original check.mjs must stay byte-identical.\n\nOne native worker total, openai-codex/gpt-6-luna high. No replacement, agents, Git operations, provider calls from commands, Python, installs, network, configuration changes, or other project writes. Use only the supplied sandbox tool. The host SDK is the sole worker provider transport. Report actual checks, not self-acceptance.\n';
await writeFile(join(repo, briefPath), brief);
const inputSha = commit('Pin J705 self-contained native worker brief');
assert.notEqual(inputSha, targetBase);
for (const path of ['src/math.mjs', 'check.mjs']) assert.equal(git(repo, 'rev-parse', `${inputSha}:${path}`), git(repo, 'rev-parse', `${targetBase}:${path}`));
const route = JSON.parse(spawnSync('git', ['-C', source, 'show', `${factorySha}:.factory/models.json`], { encoding: 'utf8' }).stdout).roles.worker;
assert.deepEqual(route, [{ model: 'openai-codex/gpt-6-luna', effort: 'high' }]);
const fixture = { version: 1, root, repo, source, factorySha, coordinatorProfileSha: factorySha, modelConfigPath: '.factory/models.json', modelConfigSha: factorySha, workerMethodologySha: '37a56ebc902e94f21fc10666f33fceac44946af7', workerRoute: route, coordinatorOverride: { model: 'openai-codex/gpt-6-luna', effort: 'high', authority: 'Operator authorized native coordinator E2E; trusted whole-role override, not a configured default' }, inputSha, targetBase, briefPath, briefSha256: createHash('sha256').update(brief).digest('hex'), referencedInputs: ['src/math.mjs', 'check.mjs'], writePaths: ['src/math.mjs'], attemptId: 'J705-native-A001', actorBudget: { coordinator: 1, workerTotal: 1, automaticRetries: 0 }, providerPromptStarted: false, scope: 'Disposable coordinator exit and fresh-reader observation proof; no source implementation or real client project' };
await writeFile('.audit/coordinator-exit-44-fixture.json', JSON.stringify(fixture, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(fixture));
