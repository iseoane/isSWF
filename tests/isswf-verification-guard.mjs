import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { checkVerificationCommit } = await import(pathToFileURL(join(source, 'tools/isswf-verification-guard-core.mjs')));

const temp = realpathSync(mkdtempSync(join(tmpdir(), 'isswf-verification-guard-')));
const run = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });
const git = async (argv, cwd) => {
  try { return { exitCode: 0, stdout: execFileSync('git', argv, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) }; }
  catch (error) { return { exitCode: error.status ?? 1, stdout: String(error.stdout ?? '') }; }
};
const write = (repo, path, text) => {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), text);
};
const manifest = state => `${JSON.stringify({ schemaVersion: 1, derivedFrom: [{ path: 'tools/check.mjs', sha256: createHash('sha256').update('one').digest('hex') }], checks: [], state }, null, 2)}\n`;
const start = (name, state) => {
  const repo = join(temp, name);
  mkdirSync(repo, { recursive: true });
  run(repo, 'init', '-q', '-b', 'main', '.');
  run(repo, 'config', 'user.email', 't@example.invalid');
  run(repo, 'config', 'user.name', 'T');
  write(repo, 'tools/check.mjs', 'one');
  write(repo, 'tools/other.mjs', 'one');
  if (state) write(repo, `${state}/verification.json`, manifest(state));
  run(repo, 'add', '-A');
  run(repo, 'commit', '-qm', 'start');
  return repo;
};
try {
  for (const state of ['.factory', '.isswf']) {
    const repo = start(`repo${state}`, state);
    const check = command => checkVerificationCommit({ command, cwd: repo, git });

    // A staged change to a derivedFrom path without the manifest is refused, naming the manifest and the refresh.
    write(repo, 'tools/check.mjs', 'two');
    run(repo, 'add', '-A');
    const refused = await check('git commit -m change');
    assert.match(refused.deny ?? '', /verification commit guard/u);
    assert.match(refused.deny, new RegExp(`${state}/verification\.json`, 'u'));
    assert.match(refused.deny, /tools\/check\.mjs/u);
    assert.match(refused.deny, /isswf-verify/u);
    // Staging the manifest too lets the commit through.
    write(repo, `${state}/verification.json`, manifest('refreshed'));
    run(repo, 'add', '-A');
    assert.equal((await check('git commit -m refreshed')).deny, undefined);
    run(repo, 'commit', '-qm', 'refreshed');

    // A path outside derivedFrom is allowed, and only the index counts without -a.
    write(repo, 'tools/other.mjs', 'two');
    run(repo, 'add', '-A');
    assert.equal((await check('git commit -m other')).deny, undefined);
    run(repo, 'commit', '-qm', 'other');
    write(repo, 'tools/check.mjs', 'three');
    assert.equal((await check('git commit -m unstaged')).deny, undefined, 'an unstaged change is not committed');
    // With -a, a pathspec or a chained add, the working tree is what the commit records.
    assert.ok((await check('git commit -am all')).deny, '-a commits the working tree');
    assert.ok((await check('git commit -m path tools/check.mjs')).deny, 'a pathspec commits the working tree');
    assert.ok((await check('git add -A && git commit -m chained')).deny, 'a chained add commits the working tree');
    // A deleted derivedFrom path changes what the manifest derives from.
    run(repo, 'checkout', '-q', '--', 'tools/check.mjs');
    run(repo, 'rm', '-q', 'tools/check.mjs');
    assert.ok((await check('git commit -m removed')).deny, 'deleting a derivedFrom file is a change');
    run(repo, 'reset', '-q', '--hard');

    // Not a commit, or a git fault: allowed.
    write(repo, 'tools/check.mjs', 'four');
    run(repo, 'add', '-A');
    assert.equal((await check('git status')).deny, undefined);
    assert.equal((await checkVerificationCommit({ command: 'git commit -m x', cwd: repo, git: async () => { throw Error('no git'); } })).deny, undefined);
  }

  // No verification file at HEAD means allow, and an unreadable one fails open.
  const bare = start('bare', undefined);
  write(bare, 'tools/check.mjs', 'two');
  run(bare, 'add', '-A');
  assert.equal((await checkVerificationCommit({ command: 'git commit -m x', cwd: bare, git })).deny, undefined);
  const broken = start('broken', '.factory');
  write(broken, '.factory/verification.json', '{');
  run(broken, 'add', '-A');
  run(broken, 'commit', '-qm', 'broken manifest');
  write(broken, 'tools/check.mjs', 'two');
  run(broken, 'add', '-A');
  assert.equal((await checkVerificationCommit({ command: 'git commit -m x', cwd: broken, git })).deny, undefined);
  console.log('PASS verification commit guard');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
