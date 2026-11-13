import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gitFixtureArgs } from './support/git-fixture.mjs';

const source = resolve(process.argv[2] ?? '.');
const { runReviewChecks } = await import(pathToFileURL(join(source, 'tools/review-checks.mjs')).href);
const locator = process.platform === 'win32' ? 'where.exe' : 'which';
const gitPath = spawnSync(locator, ['git'], { encoding: 'utf8' }).stdout.trim().split(/\r?\n/u)[0];
assert.ok(gitPath);
const git = await realpath(gitPath);
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-review-checks-')));

function gitRun(args) {
  const result = spawnSync(git, gitFixtureArgs(args), { cwd: root, encoding: 'utf8', timeout: 10000 });
  assert.equal(result.status, 0, `${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
}

const reason = async spec => {
  try { await runReviewChecks(spec); return 'no-error'; } catch (error) { return error.message; }
};

try {
  gitRun(['init', '-q']);
  gitRun(['config', 'user.email', 'fixture@example.invalid']);
  gitRun(['config', 'user.name', 'Fixture']);
  await writeFile(join(root, 'file.txt'), 'one\n');
  gitRun(['add', 'file.txt']);
  gitRun(['commit', '-q', '-m', 'one']);
  const first = gitRun(['rev-parse', 'HEAD']);
  await writeFile(join(root, 'file.txt'), 'two\n');
  gitRun(['commit', '-q', '-am', 'two']);
  const candidate = gitRun(['rev-parse', 'HEAD']);
  const spec = commands => ({ version: 1, repository: root, gitExecutable: git, candidateSha: candidate, commands });

  // Risk: a block produced on another commit must not be presented as the candidate's checks.
  assert.equal(await reason({ ...spec([['node', '-e', '']]), candidateSha: first }), 'checkout-not-at-candidate');

  // Risk: uncommitted or untracked files change what the checks exercised.
  await writeFile(join(root, 'stray.txt'), 'x');
  assert.equal(await reason(spec([['node', '-e', '']])), 'checkout-not-clean');
  await rm(join(root, 'stray.txt'));

  // Risk: a failing, missing or noisy check must be recorded as failed, with a bounded tail.
  const block = await runReviewChecks({
    ...spec([
      ['node', '-e', 'process.stdout.write("ok")'],
      ['node', '-e', 'process.stderr.write("x".repeat(1 << 20)); process.exitCode = 3'],
      ['isswf-command-that-does-not-exist'],
    ]),
    tailBytes: 256,
  });
  assert.equal(block.kind, 'isswf.review-checks');
  assert.equal(block.candidateSha, candidate);
  assert.equal(block.cleanAfterChecks, true);
  assert.equal(block.passed, false);
  const [passing, noisy, missing] = block.checks;
  assert.deepEqual([passing.exitCode, passing.stdout.tail], [0, 'ok']);
  assert.equal(noisy.exitCode, 3);
  assert.deepEqual([noisy.stderr.bytes, noisy.stderr.truncated, noisy.stderr.tail.length], [1 << 20, true, 256]);
  assert.equal(missing.error, 'ENOENT');

  // Risk: a timed-out check whose child keeps the pipes open must not hold the block past its timeout.
  const started = Date.now();
  const slow = await runReviewChecks({ ...spec([['node', '-e', 'require("child_process").spawn(process.execPath, ["-e", "setTimeout(() => {}, 20000)"], { stdio: "inherit" }); setTimeout(() => {}, 20000)']]), timeoutMs: 1000 });
  assert.equal(slow.checks[0].timedOut, true);
  assert.equal(slow.passed, false);
  assert.ok(Date.now() - started < 10000, 'the block returns soon after the timeout');

  const passed = await runReviewChecks(spec([['node', '-e', '']]));
  assert.equal(passed.passed, true);

  console.log('PASS review checks block: candidate binding, clean checkout, failure, missing command and bounded output');
} finally {
  await rm(root, { recursive: true, force: true });
}
