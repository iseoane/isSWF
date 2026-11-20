import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { gitFixtureArgs } from './support/git-fixture.mjs';

const source = resolve(process.argv[2] || '.');
const runner = join(source, 'tools/isswf-verify.mjs');
const temp = realpathSync(mkdtempSync(join(tmpdir(), 'isswf-verify-')));
const sha256 = text => createHash('sha256').update(text).digest('hex');
const git = (cwd, ...args) => execFileSync('git', gitFixtureArgs(args), { cwd, encoding: 'utf8' }).trim();
const write = (repo, path, text) => {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), text);
};
const node = (...argv) => ['node', ...argv];
const file = checks => `${JSON.stringify({ schemaVersion: 1, derivedFrom: [], checks }, null, 2)}\n`;
const check = (id, argv, extra = {}) => ({ id, argv, platforms: [process.platform], cost: 'job', covers: ['tools/'], timeoutSeconds: 20, ...extra });

// A repository whose HEAD commit holds `.factory/verification.json` with `checks`.
function makeRepo(name, checks) {
  const repo = join(temp, name);
  mkdirSync(repo, { recursive: true });
  git(repo, 'init', '-q', '-b', 'main', '.');
  git(repo, 'config', 'user.email', 't@example.invalid');
  git(repo, 'config', 'user.name', 'T');
  write(repo, '.factory/verification.json', file(checks));
  git(repo, 'add', '-A');
  git(repo, 'commit', '-qm', 'base');
  return { repo, head: git(repo, 'rev-parse', 'HEAD') };
}
function verify(repo, ...args) {
  const result = spawnSync(process.execPath, [runner, '--project', repo, ...args], { encoding: 'utf8', timeout: 60000 });
  assert.equal(result.error, undefined);
  let out;
  try { out = JSON.parse(result.stdout); } catch { assert.fail(`no JSON output (exit ${result.status}): ${result.stderr}`); }
  return { status: result.status, out };
}
const statusOf = out => Object.fromEntries(out.results.map(result => [result.checkId, result.status]));

try {
  // Every status a check can end in, from one file.
  const all = makeRepo('statuses', [
    check('ok', node('-e', 'process.stdout.write("fine")')),
    check('bad', node('-e', 'process.stderr.write("broken thing"); process.exit(3)')),
    check('slow', node('-e', 'setInterval(() => {}, 1000)'), { timeoutSeconds: 1 }),
    check('launcher', ['npm', 'test']),
    check('batch', ['tool.cmd']),
    check('missing', ['isswf-no-such-executable-xyz']),
    check('elsewhere', node('-e', 'process.exit(0)'), { platforms: ['plan9'] }),
  ]);
  const ran = verify(all.repo, '--base', all.head, '--tier', 'job');
  assert.equal(ran.out.ok, true);
  assert.deepEqual(ran.out.results.map(result => result.checkId), ['ok', 'bad', 'slow', 'launcher', 'batch', 'missing', 'elsewhere']);
  assert.deepEqual(statusOf(ran.out), {
    ok: 'passed', bad: 'failed', slow: 'timeout', launcher: 'refused', batch: 'refused', missing: 'unavailable', elsewhere: 'not run',
  });
  const byId = Object.fromEntries(ran.out.results.map(result => [result.checkId, result]));
  assert.equal(byId.ok.exitCode, 0);
  assert.equal(byId.bad.exitCode, 3);
  assert.match(byId.bad.stderrTail, /broken thing/u);
  assert.equal(byId.elsewhere.exitCode, null);
  assert.match(byId.launcher.message, /node <cli\.js>/u);
  assert.match(byId.batch.message, /node <cli\.js>/u);
  assert.equal(ran.status, 1, 'a failed, timed out, refused or unavailable check fails the run');
  // The stamp fields identify the platform, the argv, the candidate and the approved file.
  assert.equal(byId.ok.platform, process.platform);
  assert.equal(byId.ok.argvSha256, sha256(JSON.stringify(node('-e', 'process.stdout.write("fine")'))));
  assert.equal(byId.ok.candidate, all.head);
  assert.equal(byId.ok.dirty, false);
  assert.equal(byId.ok.verificationSha256, sha256(git(all.repo, 'show', 'HEAD:.factory/verification.json') + '\n'));

  // Tiers select by cost; a check outside the tier is reported as not run.
  const tiers = makeRepo('tiers', [
    check('job-one', node('-e', '')),
    check('init-one', node('-e', ''), { cost: 'initiative' }),
    check('ci-one', node('-e', ''), { cost: 'ci' }),
  ]);
  assert.deepEqual(statusOf(verify(tiers.repo, '--base', tiers.head, '--tier', 'job').out), { 'job-one': 'passed', 'init-one': 'not run', 'ci-one': 'not run' });
  const initiative = verify(tiers.repo, '--base', tiers.head, '--tier', 'initiative');
  assert.deepEqual(statusOf(initiative.out), { 'job-one': 'passed', 'init-one': 'passed', 'ci-one': 'not run' });
  assert.equal(initiative.status, 0, 'checks left not run do not fail the run');
  assert.deepEqual(statusOf(verify(tiers.repo, '--base', tiers.head, '--only', 'init-one').out), { 'init-one': 'passed' });
  assert.equal(verify(tiers.repo, '--base', tiers.head, '--only', 'nope').out.code, 'check-not-found');

  // The approved file comes from the base, not from the candidate that may rewrite it.
  const approved = makeRepo('approved', [check('real', node('-e', 'process.exit(0)'))]);
  write(approved.repo, '.factory/verification.json', file([check('real', node('-e', 'process.exit(5)'))]));
  const edited = verify(approved.repo, '--base', approved.head, '--tier', 'job');
  assert.equal(edited.out.results[0].status, 'passed');
  assert.equal(edited.out.results[0].dirty, true);
  git(approved.repo, 'add', '-A');
  git(approved.repo, 'commit', '-qm', 'candidate rewrites the approved file');
  const committed = verify(approved.repo, '--base', approved.head, '--tier', 'job');
  assert.equal(committed.out.results[0].status, 'passed');
  assert.equal(committed.out.results[0].dirty, false);
  assert.notEqual(committed.out.results[0].candidate, approved.head);

  // Without --base the base is the merge base with origin/main.
  git(approved.repo, 'update-ref', 'refs/remotes/origin/main', approved.head);
  assert.equal(verify(approved.repo, '--tier', 'job').out.base, approved.head);

  // Output is bounded to tails.
  const noisy = makeRepo('noisy', [check('noisy', node('-e', 'process.stdout.write("a".repeat(500000) + "END")'))]);
  const tail = verify(noisy.repo, '--base', noisy.head, '--tier', 'job').out.results[0].stdoutTail;
  assert.ok(tail.endsWith('END') && tail.length <= 4096, `tail length ${tail.length}`);

  // A missing or malformed file is refused with a code, never read as an empty check list.
  const bare = join(temp, 'bare');
  mkdirSync(bare);
  git(bare, 'init', '-q', '-b', 'main', '.');
  git(bare, 'config', 'user.email', 't@example.invalid');
  git(bare, 'config', 'user.name', 'T');
  write(bare, '.factory/keep', 'x');
  git(bare, 'add', '-A');
  git(bare, 'commit', '-qm', 'no verification file');
  const bareHead = git(bare, 'rev-parse', 'HEAD');
  const missing = verify(bare, '--base', bareHead, '--tier', 'job');
  assert.deepEqual([missing.status, missing.out.ok, missing.out.code], [1, false, 'verification-not-found']);
  for (const [label, text] of [
    ['not json', '{'],
    ['version', JSON.stringify({ schemaVersion: 2, derivedFrom: [], checks: [] })],
    ['argv as string', file([{ ...check('a', ['x']), argv: 'node -e 1' }])],
    ['empty argv', file([check('a', [])])],
    ['bad cost', file([check('a', ['x'], { cost: 'sometimes' })])],
    ['duplicate id', file([check('a', ['x']), check('a', ['y'])])],
    ['timeout', file([check('a', ['x'], { timeoutSeconds: 0 })])],
  ]) {
    write(bare, '.factory/verification.json', text);
    git(bare, 'add', '-A');
    git(bare, 'commit', '-qm', label);
    const refused = verify(bare, '--base', git(bare, 'rev-parse', 'HEAD'), '--tier', 'job');
    assert.deepEqual([refused.status, refused.out.ok, refused.out.code], [1, false, 'verification-invalid'], label);
  }
  assert.equal(verify(bare, '--tier', 'job').out.code, 'base-not-found');
  assert.equal(verify(bare, '--base', bareHead).out.code, 'tier-required');
  console.log('PASS isswf-verify statuses, tiers, base-read file, bounded output and refusals');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
