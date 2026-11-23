import { initRepository } from './support/git-fixture.mjs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { checkRecordsPush } = await import(pathToFileURL(join(source, 'tools/isswf-records-push-guard-core.mjs')));

const temp = realpathSync(mkdtempSync(join(tmpdir(), 'isswf-records-push-')));
const run = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });
const git = async (argv, cwd) => {
  try { return { exitCode: 0, stdout: execFileSync('git', argv, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) }; }
  catch (error) { return { exitCode: error.status ?? 1, stdout: String(error.stdout ?? '') }; }
};
const write = (repo, path, text) => {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), text);
};
const commit = (repo, message) => {
  run(repo, 'add', '-A');
  run(repo, 'commit', '-qm', message);
};
const GRANT = '- Records-only direct push: granted\n';
const record = '.factory/initiatives/I0001/plan.md';

function makeRepo(name, setup) {
  const remote = join(temp, `${name}-remote.git`);
  const repo = join(temp, name);
  mkdirSync(repo, { recursive: true });
  initRepository(remote, ['--bare', '-b', 'main']);
  initRepository(repo, ['-b', 'main']);
  run(repo, 'config', 'user.email', 't@example.invalid');
  run(repo, 'config', 'user.name', 'T');
  run(repo, 'remote', 'add', 'origin', remote);
  write(repo, 'README.md', 'x\n');
  write(repo, record, 'a\n');
  if (setup !== undefined) write(repo, '.factory/project-setup.md', setup);
  commit(repo, 'start');
  run(repo, 'push', '-q', '-u', 'origin', 'main');
  return repo;
}
const checker = repo => command => checkRecordsPush({ command, cwd: repo, git, read: async path => readFileSync(path, 'utf8') });

try {
  // A records-only change to main with the grant recorded is allowed, however the destination is spelled.
  const granted = makeRepo('granted', `# Setup\n\n${GRANT}`);
  const check = checker(granted);
  write(granted, record, 'b\n');
  commit(granted, 'records');
  for (const command of ['git push', 'git push origin main', 'git push -u origin main', 'git push origin HEAD:main', 'git push origin main:refs/heads/main', 'git push origin +main', 'git -C . push origin main']) {
    assert.equal((await check(command)).deny, undefined, command);
  }

  // The same push of a change outside the state directory is refused, naming the first such path and the PR path.
  write(granted, record, 'c\n');
  write(granted, 'tools/x.mjs', 'x\n');
  commit(granted, 'mixed');
  const mixed = await check('git push origin main');
  assert.match(mixed.deny ?? '', /records push guard/u);
  assert.match(mixed.deny, /tools\/x\.mjs/u);
  assert.match(mixed.deny, /pull request/u);
  assert.ok((await check('git push')).deny, 'a bare push from main is a push to main');
  assert.ok((await check('git push origin HEAD:refs/heads/main')).deny);
  assert.ok((await check('git push origin HEAD')).deny, 'a colon-less HEAD pushes the current branch');
  assert.ok((await check('git push -u origin HEAD')).deny);
  assert.ok((await check('git push origin @')).deny);
  assert.ok((await check('git status && git push origin main')).deny, 'a chained push is checked');
  // The setup record itself is not a work record, so changing it keeps the PR path.
  run(granted, 'reset', '-q', '--hard', 'origin/main');
  write(granted, '.factory/project-setup.md', `# Setup\n\n${GRANT}more\n`);
  commit(granted, 'setup');
  assert.match((await check('git push origin main')).deny ?? '', /project-setup\.md/u);
  run(granted, 'reset', '-q', '--hard', 'origin/main');

  // A feature branch can carry records to main with an explicit source, and its code stays on the PR path.
  run(granted, 'switch', '-q', '-c', 'feat');
  write(granted, record, 'd\n');
  commit(granted, 'records on feat');
  assert.equal((await check('git push origin feat:main')).deny, undefined);
  write(granted, 'README.md', 'y\n');
  commit(granted, 'docs on feat');
  assert.match((await check('git push origin feat:main')).deny ?? '', /README\.md/u);

  // Pushes to another branch, deletes, tags and other commands are not checked.
  assert.equal((await check('git push origin feat')).deny, undefined);
  assert.equal((await check('git push -u origin feat')).deny, undefined);
  assert.equal((await check('git push')).deny, undefined, 'a bare push from feat is not a push to main');
  assert.equal((await check('git push origin :main')).deny, undefined);
  assert.equal((await check('git push origin --delete main')).deny, undefined);
  assert.equal((await check('git push origin --tags')).deny, undefined);
  assert.equal((await check('git status')).deny, undefined);
  assert.equal((await check('git commit -m "git push origin main"')).deny, undefined);

  // Without the grant, even a records-only push is refused and the refusal names the missing grant.
  const ungranted = makeRepo('ungranted', '# Setup\n');
  write(ungranted, record, 'b\n');
  commit(ungranted, 'records');
  const noGrant = await checker(ungranted)('git push origin main');
  assert.match(noGrant.deny ?? '', /Records-only direct push: granted/u);
  const noSetup = makeRepo('nosetup');
  write(noSetup, record, 'b\n');
  commit(noSetup, 'records');
  assert.ok((await checker(noSetup)('git push origin main')).deny, 'a missing setup record is no grant');
  // A repository without any isSWF state directory on its base branch is not an isSWF project: the guard does not apply.
  const plain = join(temp, 'plain');
  mkdirSync(plain, { recursive: true });
  initRepository(join(temp, 'plain-remote.git'), ['--bare', '-b', 'main']);
  initRepository(plain, ['-b', 'main']);
  run(plain, 'config', 'user.email', 't@example.invalid');
  run(plain, 'config', 'user.name', 'T');
  run(plain, 'remote', 'add', 'origin', join(temp, 'plain-remote.git'));
  write(plain, 'README.md', 'x\n');
  commit(plain, 'start');
  run(plain, 'push', '-q', '-u', 'origin', 'main');
  write(plain, 'docs/spec.md', 'y\n');
  commit(plain, 'docs');
  assert.equal((await checker(plain)('git push origin main')).deny, undefined, 'a repository without isSWF state is not guarded');
  // The grant is read from the base branch on the remote, so a grant only in the working tree is none.
  write(ungranted, '.factory/project-setup.md', `# Setup\n\n${GRANT}`);
  assert.match((await checker(ungranted)('git push origin main')).deny ?? '', /Records-only direct push: granted/u, 'a working-tree grant is no grant');
  run(ungranted, 'checkout', '--', '.factory/project-setup.md');

  // isswf.baseBranch names the base branch.
  const based = makeRepo('based', GRANT);
  run(based, 'config', 'isswf.baseBranch', 'develop');
  write(based, 'README.md', 'y\n');
  commit(based, 'docs');
  assert.equal((await checker(based)('git push origin main')).deny, undefined, 'main is not the base here');
  run(based, 'push', '-q', 'origin', 'main:develop');
  write(based, 'README.md', 'z\n');
  commit(based, 'more docs');
  assert.ok((await checker(based)('git push origin HEAD:develop')).deny, 'the configured base is protected');

  // The selected state is `.isswf/` once it exists: its setup record holds the grant and its initiatives are the records.
  const modern = makeRepo('modern', GRANT);
  write(modern, '.isswf/project-setup.md', '# Setup\n');
  commit(modern, 'new state');
  run(modern, 'push', '-q', 'origin', 'main');
  write(modern, '.isswf/initiatives/I0001/plan.md', 'z\n');
  commit(modern, 'records');
  assert.match((await checker(modern)('git push origin main')).deny ?? '', /Records-only direct push: granted/u, 'the legacy setup record is ignored once .isswf/ exists');
  write(modern, '.isswf/project-setup.md', `# Setup\n\n${GRANT}`);
  assert.ok((await checker(modern)('git push origin main')).deny, 'a grant that is not on the remote yet is none');
  run(modern, 'checkout', '--', '.isswf/project-setup.md');
  run(modern, 'reset', '-q', '--hard', 'origin/main');
  write(modern, '.isswf/project-setup.md', `# Setup\n\n${GRANT}`);
  commit(modern, 'grant');
  run(modern, 'push', '-q', 'origin', 'main');
  write(modern, '.isswf/initiatives/I0001/plan.md', 'zzz\n');
  commit(modern, 'records after the grant');
  assert.equal((await checker(modern)('git push origin main')).deny, undefined);

  // A git fault allows the command.
  assert.equal((await checkRecordsPush({ command: 'git push origin main', cwd: granted, git: async () => { throw Error('no git'); }, read: async () => '' })).deny, undefined);
  assert.equal((await checkRecordsPush({ command: 'git push origin main', cwd: granted, git: async () => ({ exitCode: 128, stdout: '' }), read: async () => '' })).deny, undefined);
  console.log('PASS records push guard');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
