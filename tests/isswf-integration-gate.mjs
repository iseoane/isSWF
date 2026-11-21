import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';

const source = resolve(process.argv[2] || '.');
const { checkIntegrationGate } = await import(pathToFileURL(join(source, 'tools/isswf-integration-gate-core.mjs')));

const temp = realpathSync(mkdtempSync(join(tmpdir(), 'isswf-integration-gate-')));
const run = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
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
  return run(repo, 'rev-parse', 'HEAD');
};
const edit = (repo, path, text, message) => {
  write(repo, path, text);
  return commit(repo, message);
};
const record = '.factory/initiatives/I0001/plan.md';

// The store the verify runner writes under the common git directory, shared by every worktree of a repository.
const storeFile = (repo, sha) => {
  const common = run(repo, 'rev-parse', '--git-common-dir');
  return join(isAbsolute(common) ? common : join(repo, common), 'isswf', 'verification-stamps', `${sha}.json`);
};
function stamp(repo, sha, tier = 'job') {
  const file = storeFile(repo, sha);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify({ candidate: sha, tree: run(repo, 'rev-parse', `${sha}^{tree}`), platform: process.platform, tier, verificationSha256: 'a'.repeat(64), checks: [{ id: 'x', status: 'passed' }] })}\n`);
}

// A repository on main whose setup record holds `line` (when given), with a pushed origin/main, then branch `feat`.
function makeRepo(name, line) {
  const remote = join(temp, `${name}-remote.git`);
  const repo = join(temp, name);
  mkdirSync(repo, { recursive: true });
  run(temp, 'init', '-q', '--bare', '-b', 'main', remote);
  run(repo, 'init', '-q', '-b', 'main', '.');
  run(repo, 'config', 'user.email', 't@example.invalid');
  run(repo, 'config', 'user.name', 'T');
  run(repo, 'remote', 'add', 'origin', remote);
  write(repo, 'README.md', 'x\n');
  write(repo, record, 'a\n');
  write(repo, '.factory/project-setup.md', `# Setup\n\n${line === undefined ? '' : `${line}\n`}`);
  commit(repo, 'start');
  run(repo, 'push', '-q', '-u', 'origin', 'main');
  run(repo, 'switch', '-q', '-c', 'feat');
  return repo;
}
const checker = repo => command => checkIntegrationGate({ command, cwd: repo, git, read: async path => readFileSync(path, 'utf8') });
const ENFORCE = '- Integration gate: enforce';
// Integration commands issued on the feature branch; a merge is issued from main.
const FROM_FEAT = ['git push origin feat', 'git push -u origin feat', 'git push', 'gh pr create --title t --body b'];

try {
  // observe is the default: an unstamped code head is allowed with a note naming the head and the command to run.
  const observed = makeRepo('observe');
  const head = edit(observed, 'tools/x.mjs', 'x\n', 'code');
  run(observed, 'switch', '-q', 'main');
  for (const command of ['git merge feat', 'git merge --no-ff -m "msg" feat', 'git -C . merge feat']) {
    const verdict = await checker(observed)(command);
    assert.equal(verdict.deny, undefined, command);
    assert.match(verdict.note ?? '', new RegExp(head.slice(0, 7), 'u'), command);
    assert.match(verdict.note, /isswf-verify.*--tier job/u);
  }
  run(observed, 'switch', '-q', 'feat');
  for (const command of FROM_FEAT) {
    const verdict = await checker(observed)(command);
    assert.equal(verdict.deny, undefined, command);
    assert.match(verdict.note ?? '', /integration gate/u, command);
  }
  const chained = await checker(observed)('git status && git push origin feat');
  assert.match(chained.note ?? '', /integration gate/u, 'a chained command is checked');

  // enforce refuses with the same message; a stamp on the head allows, a stamp on an older commit does not.
  const enforced = makeRepo('enforce', ENFORCE);
  const older = edit(enforced, 'tools/a.mjs', 'a\n', 'a');
  const newer = edit(enforced, 'tools/b.mjs', 'b\n', 'b');
  for (const command of FROM_FEAT) {
    assert.match((await checker(enforced)(command)).deny ?? '', new RegExp(`integration gate.*${newer.slice(0, 7)}`, 'su'), command);
  }
  assert.match((await checker(enforced)('git push origin feat')).deny, /isswf-verify.*--tier job/u);
  stamp(enforced, older);
  assert.ok((await checker(enforced)('git push origin feat')).deny, 'a stamp on an ancestor code commit does not cover the head');
  stamp(enforced, newer);
  for (const command of FROM_FEAT) assert.deepEqual(await checker(enforced)(command), {}, command);
  run(enforced, 'switch', '-q', 'main');
  assert.deepEqual(await checker(enforced)('git merge feat'), {});
  run(enforced, 'switch', '-q', 'feat');

  // An initiative-tier stamp counts as well.
  const tiers = makeRepo('tiers', ENFORCE);
  stamp(tiers, edit(tiers, 'tools/a.mjs', 'a\n', 'a'), 'initiative');
  assert.deepEqual(await checker(tiers)('git push origin feat'), {});

  // A records-only head is covered by a stamp reached through records-only commits only.
  edit(enforced, record, 'b\n', 'records');
  assert.deepEqual(await checker(enforced)('git push origin feat'), {}, 'a records commit on a stamped head');
  const unstamped = edit(enforced, 'tools/c.mjs', 'c\n', 'c');
  edit(enforced, record, 'c\n', 'records over unstamped code');
  assert.match((await checker(enforced)('git push origin feat')).deny ?? '', new RegExp(unstamped.slice(0, 7), 'u'), 'the first non-record commit must carry the stamp');
  const recordsOnly = makeRepo('records-only', ENFORCE);
  edit(recordsOnly, record, 'b\n', 'records');
  assert.deepEqual(await checker(recordsOnly)('git push origin feat'), {}, 'a branch of records alone has nothing to stamp');

  // Pushes to the base branch stay with the records push guard; a head already on origin/main needs no stamp.
  const base = makeRepo('base', ENFORCE);
  edit(base, 'tools/a.mjs', 'a\n', 'a');
  assert.deepEqual(await checker(base)('git push origin feat:main'), {});
  run(base, 'switch', '-q', 'main');
  assert.deepEqual(await checker(base)('git push origin main'), {});
  assert.deepEqual(await checker(base)('git merge origin/main'), {}, 'a head already on the base is integrated');
  run(base, 'switch', '-q', 'feat');

  // Other commands, deletes, tags and merge control flags are not integration.
  for (const command of ['git status', 'git commit -m "git push origin feat"', 'git merge --abort', 'git merge --continue', 'git push origin --delete feat', 'git push origin --tags', 'git push origin :feat', 'gh pr view', 'gh pr list', 'git log']) {
    assert.deepEqual(await checker(base)(command), {}, command);
  }

  // off disables the gate. The mode is read from the setup record on <remote>/<base>, so a line in the working tree or in a commit of the branch under review is no setting.
  const off = makeRepo('off', '- Integration gate: off');
  edit(off, 'tools/a.mjs', 'a\n', 'a');
  assert.deepEqual(await checker(off)('git push origin feat'), {});
  edit(off, '.factory/project-setup.md', `# Setup\n\n${ENFORCE}\n`, 'branch sets enforce');
  assert.deepEqual(await checker(off)('git push origin feat'), {}, 'a branch commit cannot enable the gate');
  const own = makeRepo('own', ENFORCE);
  edit(own, '.factory/project-setup.md', '# Setup\n\n- Integration gate: off\n', 'branch sets off');
  assert.ok((await checker(own)('git push origin feat')).deny, 'a branch commit cannot disable its own gate');
  const noBase = join(temp, 'no-base');
  mkdirSync(noBase);
  run(noBase, 'init', '-q', '-b', 'main', '.');
  run(noBase, 'config', 'user.email', 't@example.invalid');
  run(noBase, 'config', 'user.name', 'T');
  write(noBase, '.factory/project-setup.md', `# Setup\n\n${ENFORCE}\n`);
  commit(noBase, 'start');
  run(noBase, 'switch', '-q', '-c', 'feat');
  edit(noBase, 'tools/a.mjs', 'a\n', 'a');
  run(noBase, 'switch', '-q', 'main');
  assert.ok((await checker(noBase)('git merge feat')).deny, 'without the base ref the mode is read at HEAD');

  // The selected state is .isswf/ once its setup record is on the base: its line sets the mode and only its initiatives/ are records.
  const modern = makeRepo('modern', ENFORCE);
  run(modern, 'switch', '-q', 'main');
  write(modern, '.isswf/project-setup.md', '# Setup\n\n- Integration gate: observe\n');
  commit(modern, 'new state');
  run(modern, 'push', '-q', 'origin', 'main');
  run(modern, 'switch', '-q', '-C', 'feat');
  edit(modern, 'tools/a.mjs', 'a\n', 'a');
  const observing = await checker(modern)('git push origin feat');
  assert.equal(observing.deny, undefined, 'the .isswf/ setup wins over the legacy one');
  assert.ok(observing.note);
  const strict = makeRepo('strict', ENFORCE);
  run(strict, 'switch', '-q', 'main');
  write(strict, '.isswf/project-setup.md', `# Setup\n\n${ENFORCE}\n`);
  commit(strict, 'new state');
  run(strict, 'push', '-q', 'origin', 'main');
  run(strict, 'switch', '-q', '-C', 'feat');
  edit(strict, '.isswf/initiatives/I0001/plan.md', 'x\n', 'records');
  assert.deepEqual(await checker(strict)('git push origin feat'), {}, 'records of the selected state need no stamp');
  const legacyRecords = edit(strict, '.factory/initiatives/I0001/plan.md', 'y\n', 'legacy records');
  assert.match((await checker(strict)('git push origin feat')).deny ?? '', new RegExp(legacyRecords.slice(0, 7), 'u'), 'the other state directory is not a record');

  // gh pr create: --head and -H name the branch to check, and gh global flags may come before pr.
  const gh = makeRepo('gh', ENFORCE);
  const ghHead = edit(gh, 'tools/a.mjs', 'a\n', 'a');
  run(gh, 'switch', '-q', 'main');
  for (const command of ['gh pr create --head feat --title t', 'gh pr create -H feat', 'gh pr create --head=feat', 'gh --repo owner/name pr create --head feat', 'gh -R owner/name pr create -H feat']) {
    assert.match((await checker(gh)(command)).deny ?? '', new RegExp(ghHead.slice(0, 7), 'u'), command);
  }
  assert.deepEqual(await checker(gh)('gh pr create --title t'), {}, 'without --head the current branch, here the base, is checked');
  run(gh, 'switch', '-q', 'feat');
  assert.match((await checker(gh)('gh --repo owner/name pr create --title t')).deny ?? '', /integration gate/u, 'a global flag before pr');
  assert.deepEqual(await checker(gh)('gh --repo owner/name pr view'), {});
  assert.deepEqual(await checker(gh)('gh pr create --head fork-owner:topic'), {}, 'a head that is not a local branch is left alone');
  run(gh, 'switch', '-q', 'main');
  for (const command of ['git merge --cleanup strip feat', 'git merge --cleanup=strip feat']) {
    assert.match((await checker(gh)(command)).deny ?? '', new RegExp(ghHead.slice(0, 7), 'u'), command);
  }

  // A stamp written from a linked worktree is found from the main checkout, and the reverse.
  const shared = makeRepo('shared', ENFORCE);
  run(shared, 'switch', '-q', 'main');
  const linked = join(temp, 'shared-linked');
  run(shared, 'worktree', 'add', '-q', '-b', 'topic', linked);
  run(linked, 'config', 'user.email', 't@example.invalid');
  run(linked, 'config', 'user.name', 'T');
  const topic = edit(linked, 'tools/w.mjs', 'w\n', 'w');
  assert.ok((await checker(linked)('git push origin topic')).deny);
  stamp(linked, topic);
  assert.deepEqual(await checker(linked)('git push origin topic'), {});
  assert.deepEqual(await checker(shared)('git merge topic'), {}, 'the main checkout reads the stamp the linked worktree wrote');
  const topicTwo = edit(linked, 'tools/w2.mjs', 'w\n', 'w2');
  stamp(shared, topicTwo);
  assert.deepEqual(await checker(linked)('git push origin topic'), {});

  // A git fault allows; a stamp naming another commit or unreadable is no stamp.
  assert.deepEqual(await checker(temp)('git push origin feat'), {});
  const bad = makeRepo('bad', ENFORCE);
  const badHead = edit(bad, 'tools/a.mjs', 'a\n', 'a');
  const badFile = storeFile(bad, badHead);
  mkdirSync(dirname(badFile), { recursive: true });
  writeFileSync(badFile, '{"candidate":"0000"}\n');
  assert.ok((await checker(bad)('git push origin feat')).deny, 'a stamp naming another candidate is no stamp');
  writeFileSync(badFile, 'not json');
  assert.ok((await checker(bad)('git push origin feat')).deny, 'an unreadable stamp is no stamp');

  // Pi: the extension refuses on `tool_call` in enforce mode, and appends the observe-mode note to the result of the command it allowed.
  const handlers = {};
  (await import(pathToFileURL(join(source, 'tools/isswf-command-guard-pi-extension.mjs')))).default({ on: (name, handler) => { handlers[name] = handler; } });
  const piCall = (repo, id, command) => handlers.tool_call({ type: 'tool_call', toolName: 'bash', toolCallId: id, input: { command } }, { cwd: repo });
  const piResult = (repo, id, isError = false) => handlers.tool_result({ type: 'tool_result', toolName: 'bash', toolCallId: id, input: {}, isError, content: [{ type: 'text', text: 'pushed' }] }, { cwd: repo });
  assert.match((await piCall(bad, 'p1', 'git push origin feat')).reason, /integration gate: refused/u);
  assert.equal((await piCall(observed, 'p2', 'git push origin feat')), undefined, 'observe allows');
  const appended = await piResult(observed, 'p2');
  assert.deepEqual(appended.content.map(part => part.text).slice(0, 1), ['pushed']);
  assert.match(appended.content.at(-1).text, /integration gate \(observe\)/u);
  assert.equal(await piResult(observed, 'p2'), undefined, 'the note is shown once');
  assert.equal(await piCall(observed, 'p3', 'git push origin feat'), undefined);
  assert.equal(await piResult(observed, 'p3', true), undefined, 'a failed command gets no note');
  assert.equal(await piCall(tiers, 'p4', 'git push origin feat'), undefined, 'a stamped head passes');
  assert.equal(await piResult(tiers, 'p4'), undefined);

  // register.tsx has no runner here, so the Claude hook is a source check: the gate runs after the records push guard, refuses before the call and adds its note after it.
  const hooks = await readFile(join(source, 'hooks/register.tsx'), 'utf8');
  assert.ok(hooks.indexOf('await checkRecordsPush(') < hooks.indexOf('await checkIntegrationGate('), 'the gate runs after the records push guard');
  assert.ok(hooks.indexOf('await checkIntegrationGate(') < hooks.indexOf('await next(e)'), 'the gate decides before the call');
  assert.ok(hooks.includes('if (gate.deny !== undefined) return { deny: gate.deny }'));
  assert.ok(hooks.includes('const notes = [gateNote, workerNote, text]') && hooks.indexOf('await next(e)') < hooks.indexOf('const notes = [gateNote, workerNote, text]'));
} finally {
  rmSync(temp, { recursive: true, force: true });
}
console.log('integration gate ok');
