import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gitFixtureArgs, initRepository } from './support/git-fixture.mjs';

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
const file = (checks, derivedFrom = []) => `${JSON.stringify({ schemaVersion: 1, derivedFrom, checks }, null, 2)}\n`;
const check = (id, argv, extra = {}) => ({ id, argv, platforms: [process.platform], cost: 'job', covers: ['tools/'], timeoutSeconds: 20, ...extra });

// A repository whose HEAD commit holds `.factory/verification.json` with `checks`.
function makeRepo(name, checks, derivedFrom = [], files = {}) {
  const repo = join(temp, name);
  mkdirSync(repo, { recursive: true });
  initRepository(repo, ['-b', 'main']);
  git(repo, 'config', 'user.email', 't@example.invalid');
  git(repo, 'config', 'user.name', 'T');
  for (const [path, text] of Object.entries(files)) write(repo, path, text);
  write(repo, '.factory/verification.json', file(checks, derivedFrom));
  git(repo, 'add', '-A');
  git(repo, 'commit', '-qm', 'base');
  return { repo, head: git(repo, 'rev-parse', 'HEAD') };
}
function verify(repo, ...args) {
  const result = spawnSync(process.execPath, [runner, '--project', repo, ...args], { encoding: 'utf8', timeout: 60000 });
  assert.equal(result.error, undefined);
  let out;
  try { out = JSON.parse(result.stdout); } catch { assert.fail(`no JSON output (exit ${result.status}): ${result.stderr}`); }
  return { status: result.status, out, stderr: result.stderr };
}
const statusOf = out => Object.fromEntries(out.results.map(result => [result.checkId, result.status]));

try {
  // Every status a check can end in, from one file.
  const all = makeRepo('statuses', [
    check('ok', node('-e', 'process.stdout.write("fine")')),
    check('bad', node('-e', 'process.stderr.write("broken thing"); process.exit(3)')),
    check('slow', node('-e', 'setInterval(() => {}, 1000)'), { timeoutSeconds: 1 }),
    check('launcher', ['npm', 'test']),
    check('unix-npm', ['/usr/bin/npm', 'test']),
    check('win-npx', ['C:\\x\\NPX.CMD']),
    check('exe-npm', ['C:/x/npm.exe']),
    check('batch', ['tool.cmd']),
    check('missing', ['isswf-no-such-executable-xyz']),
    check('elsewhere', node('-e', 'process.exit(0)'), { platforms: ['plan9'] }),
  ]);
  const ran = verify(all.repo, '--base', all.head, '--tier', 'job');
  assert.equal(ran.out.ok, true);
  assert.deepEqual(ran.out.results.map(result => result.checkId), ['ok', 'bad', 'slow', 'launcher', 'unix-npm', 'win-npx', 'exe-npm', 'batch', 'missing', 'elsewhere']);
  assert.deepEqual(statusOf(ran.out), {
    ok: 'passed', bad: 'failed', slow: 'timeout', launcher: 'refused', 'unix-npm': 'refused', 'win-npx': 'refused', 'exe-npm': 'refused', batch: 'refused', missing: 'unavailable', elsewhere: 'not run',
  });
  const byId = Object.fromEntries(ran.out.results.map(result => [result.checkId, result]));
  assert.equal(byId.ok.exitCode, 0);
  assert.equal(byId.bad.exitCode, 3);
  assert.match(byId.bad.stderrTail, /broken thing/u);
  assert.equal(byId.elsewhere.exitCode, null);
  assert.match(byId.launcher.message, /node <cli\.js>/u);
  assert.match(byId.batch.message, /node <cli\.js>/u);
  assert.equal(byId['unix-npm'].durationMs, undefined, 'a refused check never started');
  assert.equal(ran.status, 1, 'a failed, timed out, refused or unavailable check fails the run');
  // The stamp fields identify the platform, the argv, the candidate and the approved file.
  assert.equal(byId.ok.platform, process.platform);
  assert.equal(byId.ok.argvSha256, sha256(JSON.stringify(node('-e', 'process.stdout.write("fine")'))));
  assert.equal(byId.ok.candidate, all.head);
  assert.equal(byId.ok.dirty, false);
  assert.equal(byId.ok.verificationSha256, sha256(git(all.repo, 'show', 'HEAD:.factory/verification.json') + '\n'));

  // A git status that cannot be read is unknown, not clean.
  const broken = makeRepo('broken-status', [check('ok', node('-e', ''))]);
  writeFileSync(join(broken.repo, '.git/index'), 'not an index');
  assert.equal(verify(broken.repo, '--base', broken.head, '--tier', 'job').out.results[0].dirty, null);

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

  // Staleness: a derivedFrom file whose working-tree hash differs from the recorded one, or is missing, is reported with both hashes.
  const recorded = path => ({ path, sha256: sha256('one') });
  const fresh = makeRepo('stale', [check('ok', node('-e', ''))], [recorded('tools/a.txt'), recorded('tools/b.txt')], { 'tools/a.txt': 'one', 'tools/b.txt': 'one' });
  const current = verify(fresh.repo, '--base', fresh.head, '--tier', 'job');
  assert.deepEqual([current.status, current.out.ok, current.out.stale], [0, true, []]);
  write(fresh.repo, 'tools/a.txt', 'two');
  rmSync(join(fresh.repo, 'tools/b.txt'));
  const stale = verify(fresh.repo, '--base', fresh.head, '--tier', 'job');
  assert.deepEqual(stale.out.stale, [
    { path: 'tools/a.txt', recorded: sha256('one'), current: sha256('two') },
    { path: 'tools/b.txt', recorded: sha256('one'), current: null },
  ]);
  assert.deepEqual([stale.status, stale.out.ok, stale.out.code], [2, false, 'stale']);
  assert.equal(stale.out.results[0].status, 'passed', 'results still print when stale');
  const allowed = verify(fresh.repo, '--base', fresh.head, '--tier', 'job', '--allow-stale');
  assert.deepEqual([allowed.status, allowed.out.ok, allowed.out.stale.length], [0, true, 2]);
  // --stale reports the verdict alone: no tier, no checks run.
  const verdict = verify(fresh.repo, '--base', fresh.head, '--stale');
  assert.deepEqual([verdict.status, verdict.out.code, verdict.out.stale.length, verdict.out.results], [2, 'stale', 2, []]);
  write(fresh.repo, 'tools/a.txt', 'one');
  write(fresh.repo, 'tools/b.txt', 'one');
  assert.deepEqual([verify(fresh.repo, '--base', fresh.head, '--stale').status, verify(fresh.repo, '--base', fresh.head, '--stale').out.ok], [0, true]);
  // A manifest change whose refreshed file is committed is fresh: derivedFrom comes from the candidate, the checks from the base.
  write(fresh.repo, 'tools/a.txt', 'two');
  write(fresh.repo, '.factory/verification.json', file([check('other', node('-e', 'process.exit(7)'))], [{ path: 'tools/a.txt', sha256: sha256('two') }, recorded('tools/b.txt')]));
  git(fresh.repo, 'add', '-A');
  git(fresh.repo, 'commit', '-qm', 'manifest changed and file refreshed');
  const refreshed = verify(fresh.repo, '--base', fresh.head, '--stale');
  assert.deepEqual([refreshed.status, refreshed.out.ok, refreshed.out.stale], [0, true, []]);
  assert.deepEqual(statusOf(verify(fresh.repo, '--base', fresh.head, '--tier', 'job').out), { ok: 'passed' }, 'the checks still come from the base');
  write(fresh.repo, 'tools/a.txt', 'three');
  assert.equal(verify(fresh.repo, '--base', fresh.head, '--stale').out.stale[0].path, 'tools/a.txt');
  write(fresh.repo, 'tools/a.txt', 'two');
  // A nested path with two-character segments is valid; the unreadable and non-canonical spellings are refused.
  const nested = makeRepo('nested', [check('ok', node('-e', ''))], [recorded('docs/en/x.md')], { 'docs/en/x.md': 'one' });
  assert.deepEqual([verify(nested.repo, '--base', nested.head, '--stale').status, verify(nested.repo, '--base', nested.head, '--stale').out.ok], [0, true]);
  const unreadable = makeRepo('unreadable', [check('ok', node('-e', ''))], [recorded('a\0b')]);
  assert.equal(verify(unreadable.repo, '--base', unreadable.head, '--stale').out.code, 'derivedfrom-unreadable');
  for (const path of ['..\\x', 'docs\\..\\..\\x', './tools/a.txt', 'tools\\a.txt']) {
    const odd = makeRepo('odd', [check('ok', node('-e', ''))], [recorded(path)]);
    assert.equal(verify(odd.repo, '--base', odd.head, '--stale').out.code, 'verification-invalid', path);
    rmSync(odd.repo, { recursive: true, force: true });
  }
  // A derivedFrom path must stay inside the project.
  for (const path of ['../outside.txt', '/etc/passwd', 'C:/Windows/win.ini']) {
    const escaping = makeRepo('escape', [check('ok', node('-e', ''))], [recorded(path)]);
    assert.equal(verify(escaping.repo, '--base', escaping.head, '--stale').out.code, 'verification-invalid', path);
    rmSync(escaping.repo, { recursive: true, force: true });
  }

  // Output is bounded to tails.
  const noisy = makeRepo('noisy', [check('noisy', node('-e', 'process.stdout.write("a".repeat(500000) + "END")'))]);
  const tail = verify(noisy.repo, '--base', noisy.head, '--tier', 'job').out.results[0].stdoutTail;
  assert.ok(tail.endsWith('END') && tail.length <= 4096, `tail length ${tail.length}`);

  // A missing or malformed file is refused with a code, never read as an empty check list.
  const bare = join(temp, 'bare');
  mkdirSync(bare);
  initRepository(bare, ['-b', 'main']);
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
  const required = verify(bare, '--base', bareHead).out;
  assert.equal(required.code, 'tier-required');
  assert.match(required.message, /--stale/u, 'the message lists every selector');
  // --table prints the approved checks as a Markdown table keyed by path class, from `covers` and `cost`.
  const table = makeRepo('table', [
    check('unit', node('-e', ''), { covers: ['tools/', 'tests/'] }),
    check('docs-lint', node('-e', ''), { covers: ['docs/', 'README.md'] }),
    check('pack', node('-e', ''), { covers: ['.github/', 'package.json'], cost: 'initiative' }),
    check('e2e-run', node('-e', ''), { covers: ['tests/e2e/'], cost: 'ci' }),
  ]);
  const printed = spawnSync(process.execPath, [runner, '--project', table.repo, '--base', table.head, '--table'], { encoding: 'utf8', timeout: 60000 });
  assert.equal(printed.status, 0, printed.stdout);
  const rows = Object.fromEntries(printed.stdout.split('\n').filter(line => line.startsWith('| ') && !line.startsWith('| Path class') && !line.startsWith('| ---')).map(line => {
    const [pathClass, checks] = line.split('|').slice(1).map(cell => cell.trim());
    return [pathClass, checks];
  }));
  assert.equal(rows.code, 'unit (job)');
  assert.equal(rows.tests, 'unit (job)', 'a cover path counts for its first matching class only');
  assert.equal(rows['E2E harness'], 'e2e-run (ci)');
  assert.equal(rows['packaging or CI'], 'pack (initiative)');
  assert.equal(rows['docs or records only'], 'docs-lint (job)');
  assert.equal(rows['initiative close'], 'unit (job), docs-lint (job), pack (initiative), e2e-run (ci)', 'the close suite includes ci-cost checks such as E2E');
  assert.equal(verify(bare, '--base', git(bare, 'rev-parse', 'HEAD'), '--table').out.code, 'verification-invalid', 'the last bare commit holds a malformed file');

  // --record writes the close record for an initiative: the whole suite, ci-cost checks included, at the verified head.
  const closing = makeRepo('closing', [
    check('job-one', node('-e', '')),
    check('init-one', node('-e', ''), { cost: 'initiative' }),
    check('ci-one', node('-e', ''), { cost: 'ci' }),
    check('elsewhere', node('-e', ''), { platforms: ['plan9'] }),
  ], [], { '.factory/initiatives/I0001/plan.md': '# I0001: x\n' });
  const recordPath = join(closing.repo, '.factory/initiatives/I0001/close-verification.json');
  const closed = verify(closing.repo, '--base', closing.head, '--tier', 'initiative', '--record', 'I0001');
  assert.equal(closed.status, 1, 'a record with a check that did not run exits non-zero');
  assert.match(closed.stderr, /elsewhere/u);
  assert.equal(closed.out.record, '.factory/initiatives/I0001/close-verification.json');
  assert.deepEqual(statusOf(closed.out), { 'job-one': 'passed', 'init-one': 'passed', 'ci-one': 'passed', elsewhere: 'not run' });
  assert.deepEqual(JSON.parse(readFileSync(recordPath, 'utf8')), {
    schema: 'isswf.close-verification',
    schemaVersion: 1,
    source: 'local',
    initiative: 'I0001',
    head: closing.head,
    verificationSha256: sha256(git(closing.repo, 'show', 'HEAD:.factory/verification.json') + '\n'),
    checks: [{ id: 'job-one', status: 'passed' }, { id: 'init-one', status: 'passed' }, { id: 'ci-one', status: 'passed' }, { id: 'elsewhere', status: 'not run' }],
  });
  // The record is an initiatives file, so it does not make the tree dirty for the next run, and a failed check is recorded as failed.
  assert.equal(verify(closing.repo, '--base', closing.head, '--tier', 'initiative', '--record', 'I0001').out.ok, true);
  const failing = makeRepo('closing-failed', [check('bad', node('-e', 'process.exit(1)'), { cost: 'ci' })], [], { '.factory/initiatives/I0001/plan.md': '# I0001: x\n' });
  const failed = verify(failing.repo, '--base', failing.head, '--tier', 'initiative', '--record', 'I0001');
  assert.equal(failed.status, 1);
  assert.deepEqual(JSON.parse(readFileSync(join(failing.repo, '.factory/initiatives/I0001/close-verification.json'), 'utf8')).checks, [{ id: 'bad', status: 'failed' }]);
  // Without --record the run writes nothing and ci-cost checks stay out of the initiative tier.
  const unrecorded = makeRepo('closing-plain', [check('ci-one', node('-e', ''), { cost: 'ci' })], [], { '.factory/initiatives/I0001/plan.md': '# I0001: x\n' });
  assert.deepEqual(statusOf(verify(unrecorded.repo, '--base', unrecorded.head, '--tier', 'initiative').out), { 'ci-one': 'not run' });
  assert.equal(existsSync(join(unrecorded.repo, '.factory/initiatives/I0001/close-verification.json')), false);
  // Refusals write nothing: the wrong tier, a malformed or unknown initiative, a dirty tree outside the initiatives and a stale manifest.
  for (const [label, args, code] of [
    ['job tier', ['--tier', 'job', '--record', 'I0001'], 'record-needs-initiative-tier'],
    ['only', ['--only', 'ci-one', '--record', 'I0001'], 'record-needs-initiative-tier'],
    ['id', ['--tier', 'initiative', '--record', '../I0001'], 'invalid-initiative'],
    ['unknown', ['--tier', 'initiative', '--record', 'I0002'], 'initiative-not-found'],
  ]) {
    const refused = verify(unrecorded.repo, '--base', unrecorded.head, ...args);
    assert.deepEqual([refused.status, refused.out.code], [1, code], label);
  }
  assert.equal(verify(unrecorded.repo, '--base', unrecorded.head, '--tier', 'initiative', '--record', 'I0001', '--allow-stale').out.code, 'record-needs-initiative-tier', '--allow-stale would record a stale manifest');
  // An untracked file belongs to the operator and does not block a record; a tracked change outside the initiatives does.
  const tracked = makeRepo('closing-dirty', [check('ok', node('-e', ''))], [], { 'tools/t.txt': 'one', '.factory/initiatives/I0001/plan.md': '# I0001: x\n' });
  write(tracked.repo, 'tools/untracked.txt', 'x');
  assert.equal(verify(tracked.repo, '--base', tracked.head, '--tier', 'initiative', '--record', 'I0001').status, 0, 'untracked files do not block');
  write(tracked.repo, 'tools/t.txt', 'two');
  const dirtyRun = verify(tracked.repo, '--base', tracked.head, '--tier', 'initiative', '--record', 'I0001');
  assert.deepEqual([dirtyRun.status, dirtyRun.out.code], [1, 'dirty-tree']);
  write(tracked.repo, 'tools/t.txt', 'one');
  rmSync(join(tracked.repo, '.factory/initiatives/I0001/close-verification.json'));
  write(tracked.repo, '.factory/initiatives/I0001/plan.md', '# I0001: y\n');
  assert.equal(verify(tracked.repo, '--base', tracked.head, '--tier', 'initiative', '--record', 'I0001').status, 0, 'a changed record file does not block');
  // A stale manifest is refused before any check runs, so a stale record run costs nothing.
  const staleRecord = makeRepo('closing-stale', [check('ok', node('-e', 'require("fs").writeFileSync("ran.txt", "x")'))], [recorded('tools/a.txt')], { 'tools/a.txt': 'two', '.factory/initiatives/I0001/plan.md': '# I0001: x\n' });
  const staleRun = verify(staleRecord.repo, '--base', staleRecord.head, '--tier', 'initiative', '--record', 'I0001');
  assert.deepEqual([staleRun.status, staleRun.out.code, staleRun.out.results], [2, 'stale', []]);
  assert.equal(existsSync(join(staleRecord.repo, 'ran.txt')), false, 'no check ran');
  assert.equal(existsSync(join(staleRecord.repo, '.factory/initiatives/I0001/close-verification.json')), false);
  assert.equal(existsSync(join(unrecorded.repo, '.factory/initiatives/I0001/close-verification.json')), false);

  // A clean tier run whose checks all passed (or are skipped for the platform) leaves one stamp per head in the store shared by the worktrees; stdout keeps its shape.
  const stampPath = (repo, sha) => {
    const common = git(repo, 'rev-parse', '--git-common-dir');
    return join(resolve(repo, common), 'isswf', 'verification-stamps', `${sha}.json`);
  };
  const stamped = makeRepo('stamp', [check('ok', node('-e', '')), check('elsewhere', node('-e', 'process.exit(1)'), { platforms: ['plan9'] }), check('ci-only', node('-e', 'process.exit(1)'), { cost: 'ci' })]);
  const stampRun = verify(stamped.repo, '--base', stamped.head, '--tier', 'job');
  assert.equal(stampRun.status, 0);
  assert.equal(stampRun.out.stamp, undefined, 'stdout is unchanged');
  assert.deepEqual(JSON.parse(readFileSync(stampPath(stamped.repo, stamped.head), 'utf8')), {
    candidate: stamped.head,
    tree: git(stamped.repo, 'rev-parse', 'HEAD^{tree}'),
    platform: process.platform,
    tier: 'job',
    verificationSha256: sha256(git(stamped.repo, 'show', 'HEAD:.factory/verification.json') + '\n'),
    checks: [{ id: 'ok', status: 'passed' }, { id: 'elsewhere', status: 'not run' }, { id: 'ci-only', status: 'not run' }],
  });
  assert.equal(verify(stamped.repo, '--base', stamped.head, '--tier', 'initiative').status, 0);
  assert.equal(JSON.parse(readFileSync(stampPath(stamped.repo, stamped.head), 'utf8')).tier, 'initiative');

  // No stamp for a failed check, a dirty tree, --only, a stale manifest or a stale record run.
  const unstamped = (label, repo, head, ...args) => {
    verify(repo, '--base', head, ...args);
    assert.equal(existsSync(stampPath(repo, head)), false, label);
  };
  const failing2 = makeRepo('stamp-failed', [check('ok', node('-e', '')), check('bad', node('-e', 'process.exit(1)'))]);
  unstamped('failed check', failing2.repo, failing2.head, '--tier', 'job');
  const dirty2 = makeRepo('stamp-dirty', [check('ok', node('-e', ''))]);
  write(dirty2.repo, 'untracked.txt', 'x');
  unstamped('dirty tree', dirty2.repo, dirty2.head, '--tier', 'job');
  const only = makeRepo('stamp-only', [check('ok', node('-e', '')), check('other', node('-e', ''))]);
  unstamped('--only', only.repo, only.head, '--only', 'ok');
  const stale2 = makeRepo('stamp-stale', [check('ok', node('-e', ''))], [recorded('tools/a.txt')], { 'tools/a.txt': 'two' });
  unstamped('stale manifest', stale2.repo, stale2.head, '--tier', 'job');

  // A linked worktree writes to the store of the main repository, so either checkout finds it.
  const linkedDir = join(temp, 'stamp-linked');
  git(stamped.repo, 'worktree', 'add', '-q', '-b', 'w', linkedDir);
  git(linkedDir, 'config', 'user.email', 't@example.invalid');
  git(linkedDir, 'config', 'user.name', 'T');
  write(linkedDir, 'tools/new.txt', 'n');
  git(linkedDir, 'add', '-A');
  git(linkedDir, 'commit', '-qm', 'w');
  const linkedHead = git(linkedDir, 'rev-parse', 'HEAD');
  assert.equal(verify(linkedDir, '--base', stamped.head, '--tier', 'job').status, 0);
  assert.ok(existsSync(stampPath(stamped.repo, linkedHead)), 'the main checkout sees the stamp of the linked worktree');

  // On win32 the initiative tier says up front which checks cannot run there and how to record the CI route; other platforms and tiers say nothing.
  const { platformNotice } = await import(pathToFileURL(runner));
  const gated = [check('quality', node('-e', '0'), { platforms: ['linux'], cost: 'initiative' }), check('dead', node('-e', '0'), { platforms: ['linux'], cost: 'initiative' }), check('unit', node('-e', '0'), { platforms: ['linux', 'win32'] })];
  const notice = platformNotice({ selected: gated, costs: ['job', 'initiative'], platform: 'win32' });
  assert.match(notice ?? '', /quality, dead/u);
  assert.match(notice, /not run/u);
  assert.match(notice, /source.*ci/u);
  assert.match(notice, /runUrl/u);
  assert.match(notice, /close-verification.json/u);
  assert.match(notice, /schemaVersion 1/u);
  assert.match(notice, /source "ci"/u);
  assert.doesNotMatch(notice, /docs\//u,'the notice names no repo-relative path');
  assert.doesNotMatch(notice, /check-quality|dead-code/u, 'the notice names only the manifest checks');
  assert.equal(platformNotice({ selected: gated, costs: ['job', 'initiative'], platform: 'linux' }), undefined);
  assert.equal(platformNotice({ selected: gated, costs: ['job'], platform: 'win32' }), undefined);

  // Through the CLI: a platform-limited initiative check puts the notice on stderr on win32 only, and stdout stays one JSON document.
  const limited = makeRepo('platform-limited', [check('only-elsewhere', node('-e', '0'), { platforms: ['plan9'], cost: 'initiative' })]);
  const cli = verify(limited.repo, '--base', limited.head, '--tier', 'initiative');
  if (process.platform === 'win32') {
    assert.match(cli.stderr, /not run.*only-elsewhere|only-elsewhere.*not run/su);
    assert.match(cli.stderr, /schemaVersion 1/u);
    assert.match(cli.stderr, /source "ci"/u);
    assert.doesNotMatch(cli.stderr, /docs\//u);
  } else assert.equal(cli.stderr, '');
  assert.equal(cli.out.results[0].status, 'not run');

  console.log('PASS isswf-verify statuses, tiers, base-read file, bounded output and refusals');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
