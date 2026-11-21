import { initRepository } from './support/git-fixture.mjs';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { checkPlanCommit } = await import(pathToFileURL(join(source, 'tools/isswf-plan-commit-guard-core.mjs')));

const temp = realpathSync(mkdtempSync(join(tmpdir(), 'isswf-plan-commit-')));
const run = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });
const git = async (argv, cwd) => {
  try { return { exitCode: 0, stdout: execFileSync('git', argv, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) }; }
  catch (error) { return { exitCode: error.status ?? 1, stdout: String(error.stdout ?? '') }; }
};
const good = '# I0001: Synthetic\n\nType: bug\n\n## J001\n\n- Status: pending\n- Size: S\n- Objective: Something\n- Depends on: None\n- Brief: [brief-r1.md](jobs/J001/brief-r1.md)\n- Blocker: None.\n- Next step: Prepare.\n\n### Acceptance\n\n- Outcome\n\n### Evidence\n\n- None.\n';
const broken = good.replace('(jobs/J001/brief-r1.md)', '(jobs/J001/brief-r1.md) ');
const untitled = good.replace('# I0001: Synthetic', '# I0001:');
try {
  const repo = join(temp, 'repo');
  mkdirSync(join(repo, '.factory/initiatives/I0001'), { recursive: true });
  initRepository(repo, ['-b', 'main']);
  run(repo, 'config', 'user.email', 't@example.invalid');
  run(repo, 'config', 'user.name', 'T');
  const planPath = join(repo, '.factory/initiatives/I0001/plan.md');
  writeFileSync(planPath, good);
  writeFileSync(join(repo, 'README.md'), 'x\n');
  run(repo, 'add', '-A');
  run(repo, 'commit', '-qm', 'start');
  const check = command => checkPlanCommit({ command, cwd: repo, git, read: async path => readFileSync(path, 'utf8') });

  // A staged plan that parses passes; one the parser refuses is refused with its error and line.
  writeFileSync(planPath, good.replace('Prepare.', 'Dispatch.'));
  run(repo, 'add', '-A');
  assert.equal((await check('git commit -m ok')).deny, undefined);
  writeFileSync(planPath, broken);
  run(repo, 'add', '-A');
  const refused = await check('git commit -m bad');
  assert.match(refused.deny ?? '', /plan commit guard/u);
  assert.match(refused.deny, /\.factory\/initiatives\/I0001\/plan\.md/u);
  assert.match(refused.deny, /unsafe-brief-reference/u);
  // The index is what the commit records: a fixed working tree with the broken plan still staged is refused, and a fixed index passes.
  writeFileSync(planPath, good);
  assert.ok((await check('git commit -m bad')).deny);
  run(repo, 'add', '-A');
  assert.equal((await check('git commit -m ok')).deny, undefined);

  // With -a the working-tree plan is what the commit records.
  writeFileSync(planPath, broken);
  assert.equal((await check('git commit -m unstaged')).deny, undefined, 'an unstaged change is not committed');
  assert.ok((await check('git commit -qam all')).deny, '-am commits the working tree');
  assert.ok((await check('git commit --all -m all')).deny);
  // Before the command runs, a chained `git add` has not staged the plan yet, and a pathspec commits the working-tree file.
  assert.ok((await check('git add -A && git commit -m chained')).deny, 'a chained add commits the working tree');
  assert.ok((await check('git commit -m path .factory/initiatives/I0001/plan.md')).deny, 'a pathspec commits the working tree');
  assert.ok((await check('git commit -m path -- .factory')).deny);
  writeFileSync(planPath, good);

  // The heading must carry a title, as isswf-status reads it.
  writeFileSync(planPath, untitled);
  run(repo, 'add', '-A');
  assert.match((await check('git commit -m t')).deny ?? '', /title/u);
  writeFileSync(planPath, good);
  run(repo, 'add', '-A');

  // Not a commit, another directory spelled out, a deleted plan, or a git fault: allowed.
  assert.equal((await check('git status')).deny, undefined);
  run(repo, 'rm', '-q', '.factory/initiatives/I0001/plan.md');
  assert.equal((await check('git commit -m removed')).deny, undefined);
  assert.equal((await checkPlanCommit({ command: 'git commit -m x', cwd: repo, git: async () => { throw Error('no git'); }, read: async () => '' })).deny, undefined);
  // Close gate: the commit that makes every job completed needs a passing close record at the newest non-records commit.
  const closeRepo = join(temp, 'close');
  mkdirSync(join(closeRepo, '.factory/initiatives/I0001'), { recursive: true });
  initRepository(closeRepo, ['-b', 'main']);
  run(closeRepo, 'config', 'user.email', 't@example.invalid');
  run(closeRepo, 'config', 'user.name', 'T');
  const closePlan = join(closeRepo, '.factory/initiatives/I0001/plan.md');
  const closeRecord = join(closeRepo, '.factory/initiatives/I0001/close-verification.json');
  const completed = good.replace('Status: pending', 'Status: completed').replace('### Evidence\n\n- None.', '### Evidence\n\n- Merged.');
  const commitAll = message => { run(closeRepo, 'add', '-A'); run(closeRepo, 'commit', '-qm', message); return run(closeRepo, 'rev-parse', 'HEAD').trim(); };
  const closeCheck = command => checkPlanCommit({ command, cwd: closeRepo, git, read: async path => readFileSync(path, 'utf8') });
  const recordFor = (head, extra = {}) => `${JSON.stringify({ schema: 'isswf.close-verification', schemaVersion: 1, source: 'local', initiative: 'I0001', head, verificationSha256: 'a'.repeat(64), checks: [{ id: 'unit', status: 'passed' }, { id: 'e2e', status: 'passed' }], ...extra })}\n`;
  writeFileSync(closePlan, good);
  writeFileSync(join(closeRepo, 'code.txt'), 'one\n');
  const first = commitAll('start');
  writeFileSync(join(closeRepo, 'code.txt'), 'two\n');
  const codeHead = commitAll('code');
  const stageClose = () => { writeFileSync(closePlan, completed); run(closeRepo, 'add', '-A'); };
  const unstageClose = () => { run(closeRepo, 'reset', '-q', '--hard'); };

  // No record: refused, naming the record and the command that writes it.
  stageClose();
  const unrecorded = await closeCheck('git commit -m close');
  assert.match(unrecorded.deny ?? '', /close-verification\.json/u);
  assert.match(unrecorded.deny, /isswf-verify/u);
  unstageClose();
  // A job that is still open is not a close.
  const open = `
${good.slice(good.indexOf('## J001')).replaceAll('J001', 'J002')}`;
  writeFileSync(closePlan, completed + open);
  run(closeRepo, 'add', '-A');
  assert.equal((await closeCheck('git commit -m partial')).deny, undefined);
  unstageClose();

  // A passing record at the newest code commit lets the close through.
  writeFileSync(closeRecord, recordFor(codeHead));
  stageClose();
  assert.equal((await closeCheck('git commit -m close')).deny, undefined);
  unstageClose();

  // A record that is invalid, failed, partial or for a stale head refuses the close.
  const refusedWith = async (text, pattern) => {
    writeFileSync(closeRecord, text);
    stageClose();
    assert.match((await closeCheck('git commit -m close')).deny ?? '', pattern, text);
    unstageClose();
  };
  await refusedWith('not json', /invalid/u);
  await refusedWith(recordFor(codeHead, { checks: [{ id: 'unit', status: 'passed' }, { id: 'e2e', status: 'failed' }] }), /e2e/u);
  await refusedWith(recordFor(codeHead, { checks: [{ id: 'unit', status: 'not run' }] }), /unit \(not run\)/u);
  await refusedWith(recordFor(codeHead, { checks: [{ id: 'unit', status: 'passed' }, { id: 'e2e', status: 'not run' }] }), /e2e \(not run\).*ci/u);
  await refusedWith(recordFor(codeHead, { initiative: 'I0002' }), /I0001/u);
  await refusedWith(recordFor(first), /newest/u);
  await refusedWith(recordFor('b'.repeat(40)), /head/u);
  await refusedWith(recordFor(codeHead, { source: 'ci' }), /run URL/u);
  writeFileSync(closeRecord, recordFor(codeHead, { source: 'ci', runUrl: 'https://example.invalid/run/1' }));
  stageClose();
  assert.equal((await closeCheck('git commit -m close')).deny, undefined, 'a CI record names its run');
  unstageClose();

  // Records-only commits after the verified head are fine; a code change in the closing commit, or after the verified head, is not.
  writeFileSync(closeRecord, recordFor(codeHead));
  const recordHead = commitAll('record');
  assert.notEqual(recordHead, codeHead);
  stageClose();
  assert.equal((await closeCheck('git commit -m close')).deny, undefined, 'a records-only commit follows the verified head');
  unstageClose();
  writeFileSync(closePlan, completed);
  assert.equal((await closeCheck('git commit -am close')).deny, undefined, 'with -a the working-tree plan and record are read');
  unstageClose();
  stageClose();
  writeFileSync(join(closeRepo, 'code.txt'), 'three\n');
  run(closeRepo, 'add', '-A');
  assert.match((await closeCheck('git commit -m close')).deny ?? '', /code\.txt/u, 'the closing commit changes code');
  unstageClose();
  writeFileSync(join(closeRepo, 'code.txt'), 'three\n');
  const laterHead = commitAll('more code');
  stageClose();
  assert.match((await closeCheck('git commit -m close')).deny ?? '', /newest/u, 'code changed after the verified head');
  writeFileSync(closeRecord, recordFor(laterHead));
  run(closeRepo, 'add', '-A');
  assert.equal((await closeCheck('git commit -m close')).deny, undefined, 're-verified at the new head');

  // The gate applies to the transition only: a plan that HEAD already had completed is edited freely, and a git fault allows.
  run(closeRepo, 'commit', '-qm', 'closed');
  writeFileSync(closePlan, `${completed}\n- Later note.\n`);
  run(closeRepo, 'add', '-A');
  assert.equal((await closeCheck('git commit -m edit')).deny, undefined);

  // A real close transition: reopen the plan, then close it again. Each lookup the gate makes allows the commit when git itself faults, while a genuine answer still refuses.
  writeFileSync(closePlan, good);
  commitAll('reopen');
  const faultOn = (matches, exitCode = 128) => async (argv, cwd) => (matches(argv) ? { exitCode, stdout: '' } : git(argv, cwd));
  const guarded = (command, runGit) => checkPlanCommit({ command, cwd: closeRepo, git: runGit, read: async path => readFileSync(path, 'utf8') });
  const lookups = {
    log: [recordFor(first), argv => argv[0] === 'log', /newest/u],
    'merge-base': [recordFor(first), argv => argv[0] === 'merge-base', /newest/u],
    'ls-files': [undefined, argv => argv[0] === 'ls-files', /missing/u],
    'rev-parse': [recordFor('b'.repeat(40)), argv => argv[0] === 'rev-parse' && argv.includes('--verify'), /head/u],
  };
  for (const [name, [record, matches, pattern]] of Object.entries(lookups)) {
    if (record === undefined) rmSync(closeRecord, { force: true }); else writeFileSync(closeRecord, record);
    stageClose();
    assert.match((await guarded('git commit -m close', git)).deny ?? '', pattern, `${name}: a genuine answer refuses`);
    assert.equal((await guarded('git commit -m close', faultOn(matches))).deny, undefined, `${name}: a git fault fails open`);
    unstageClose();
  }
  // A staged-only commit counts what it records: an unstaged code change does not refuse, while a chained commit that stages everything does and says why.
  writeFileSync(closeRecord, recordFor(laterHead));
  stageClose();
  writeFileSync(join(closeRepo, 'code.txt'), 'unstaged\n');
  assert.equal((await closeCheck('git commit -m close')).deny, undefined, 'an unstaged change is not in the commit');
  const chained = await closeCheck('git add -A && git commit -m close');
  assert.match(chained.deny ?? '', /code\.txt/u);
  assert.match(chained.deny, /working tree/u, 'the refusal says it counted the working tree');
  console.log('PASS plan commit guard');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
