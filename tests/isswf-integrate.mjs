import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { initRepository } from './support/git-fixture.mjs';

const source = resolve(process.argv[2] || '.');
const load = name => import(pathToFileURL(join(source, 'tools', name)).href);
const { STATES, deriveState, refusalFor } = await load('isswf-delivery-core.mjs');
const { integrate } = await load('isswf-integrate.mjs');

// The lifecycle: the state is the furthest step whose earlier steps all hold; a later step alone does not count.
assert.deepEqual(STATES, ['brief', 'attempt', 'review', 'covered', 'ci-green', 'merged', 'closed']);
const all = { brief: true, attempt: true, review: true, covered: true, ciGreen: true, merged: false, closed: false };
assert.equal(deriveState({}), 'none');
assert.equal(deriveState({ brief: true }), 'brief');
assert.equal(deriveState({ brief: true, attempt: true, review: true }), 'review');
assert.equal(deriveState({ brief: true, review: true, covered: true, ciGreen: true }), 'brief', 'a gap stops the walk');
assert.equal(deriveState(all), 'ci-green');
assert.equal(deriveState({ ...all, merged: true }), 'merged');
assert.equal(deriveState({ ...all, merged: true, closed: true }), 'closed');
// Merging is legal only from ci-green; each earlier state names the next missing step, each later state names what already happened.
assert.equal(refusalFor('ci-green', 'merged'), undefined);
assert.equal(refusalFor('none', 'merged'), 'no-brief');
assert.equal(refusalFor('brief', 'merged'), 'no-attempt');
assert.equal(refusalFor('attempt', 'merged'), 'no-review');
assert.equal(refusalFor('review', 'merged'), 'not-covered');
assert.equal(refusalFor('covered', 'merged'), 'ci-not-green');
assert.equal(refusalFor('merged', 'merged'), 'already-merged');
assert.equal(refusalFor('closed', 'merged'), 'already-closed');
assert.equal(refusalFor('merged', 'closed'), undefined);

const temp = await realpath(await mkdtemp(join(tmpdir(), 'isswf-integrate-')));
const identity = { GIT_AUTHOR_NAME: 'Fixture', GIT_AUTHOR_EMAIL: 'fixture@example.invalid', GIT_COMMITTER_NAME: 'Fixture', GIT_COMMITTER_EMAIL: 'fixture@example.invalid' };
Object.assign(process.env, identity, { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'commit.gpgsign', GIT_CONFIG_VALUE_0: 'false' });
const git = (cwd, ...args) => {
  const result = spawnSync('git', ['-c', 'core.autocrlf=false', '-c', 'core.fsmonitor=false', ...args], { cwd, encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, `git ${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
};
const PLAN = status => `# I0001: Synthetic\n\nType: bug\n\n## J001\n\n- Status: ${status}\n- Objective: Synthetic\n- Depends on: None\n- Brief: [brief-r1.md](jobs/J001/brief-r1.md)\n- Blocker: None.\n- Next step: Review.\n\n### Acceptance\n\n- Observable outcome\n\n### Evidence\n\n- None.\n`;
const JOB = '.factory/initiatives/I0001/jobs/J001';
const BRANCH = 'feat/i0001-j001';
let counter = 0;

// A bare origin, the primary checkout on main and a linked job worktree. `options` leave records out or add commits after the review.
async function fixture({ brief = true, attempt = true, review = true, extra = false, dirtyPrimary = false } = {}) {
  counter += 1;
  const dir = join(temp, `case${counter}`);
  const origin = join(dir, 'origin.git'), project = join(dir, 'project'), worktree = join(dir, 'job-worktree'), forge = join(dir, 'forge');
  await mkdir(dir);
  initRepository(origin, ['--bare', '-b', 'main']);
  initRepository(project, ['-b', 'main']);
  const put = async (root, path, text) => { await mkdir(join(root, path, '..'), { recursive: true }); await writeFile(join(root, path), text); };
  await put(project, '.factory/initiatives/I0001/plan.md', PLAN('in-progress'));
  await put(project, '.factory/project-setup.md', '# setup\n');
  await put(project, `${JOB}/brief-r1.md`, '# brief\n');
  git(project, 'add', '-A'); git(project, 'commit', '-qm', 'start');
  git(project, 'remote', 'add', 'origin', origin);
  git(project, 'push', '-q', 'origin', 'main');
  const base = git(project, 'rev-parse', 'HEAD');
  git(project, 'worktree', 'add', '-q', '-b', BRANCH, worktree);
  if (!brief) { git(worktree, 'rm', '-q', `${JOB}/brief-r1.md`); git(worktree, 'commit', '-qm', 'drop brief'); }
  await put(worktree, 'src/x.mjs', 'export const x = 1;\n');
  git(worktree, 'add', '-A'); git(worktree, 'commit', '-qm', 'feat: x');
  const candidate = git(worktree, 'rev-parse', 'HEAD');
  if (attempt) await put(worktree, `${JOB}/A001.md`, '# attempt\n');
  if (review) await put(worktree, `${JOB}/V001.md`, `# review\n\n- Base commit SHA: ${base}\n- Candidate commit SHA, or reproducible snapshot identity: ${candidate}\n`);
  git(worktree, 'add', '-A'); git(worktree, 'commit', '--allow-empty', '-qm', 'docs: records');
  if (extra) { await put(worktree, 'src/y.mjs', 'export const y = 1;\n'); git(worktree, 'add', '-A'); git(worktree, 'commit', '-qm', 'feat: y after review'); }
  git(worktree, 'push', '-q', 'origin', BRANCH);
  const head = git(worktree, 'rev-parse', 'HEAD');
  initRepository(forge, []);
  git(forge, 'remote', 'add', 'origin', origin);
  if (dirtyPrimary) { await put(project, 'dirty.txt', 'x\n'); git(project, 'add', 'dirty.txt'); }
  return { dir, origin, project, worktree, forge, head, base };
}

// A fake `gh`: `pr view` answers with the given CI rollup and `pr merge` squash-merges the branch into origin/main in a separate clone, as the forge would.
function fakeGh(f, { ci = 'SUCCESS', ciHead, unreadable = false } = {}) {
  const calls = [];
  const gh = async argv => {
    calls.push(argv);
    if (argv[0] === 'pr' && argv[1] === 'view') {
      if (unreadable) return { exitCode: 1, stdout: '' };
      const rollup = ci === 'PENDING' ? [{ name: 'test', status: 'IN_PROGRESS' }] : [{ name: 'test', status: 'COMPLETED', conclusion: ci }];
      return { exitCode: 0, stdout: JSON.stringify({ headRefOid: ciHead ?? f.head, statusCheckRollup: rollup }) };
    }
    if (argv[0] === 'pr' && argv[1] === 'merge') {
      const pinned = argv[argv.indexOf('--match-head-commit') + 1];
      if (pinned !== git(f.worktree, 'rev-parse', 'HEAD')) return { exitCode: 1, stdout: '' };
      git(f.forge, 'fetch', '-q', 'origin', 'main', BRANCH);
      git(f.forge, 'checkout', '-q', '-B', 'main', 'origin/main');
      git(f.forge, 'merge', '-q', '--squash', `origin/${BRANCH}`);
      git(f.forge, 'commit', '-qm', 'feat: x (#1)');
      git(f.forge, 'push', '-q', 'origin', 'main');
      return { exitCode: 0, stdout: '' };
    }
    return { exitCode: 1, stdout: '' };
  };
  return { gh, calls };
}

const request = (f, gh, extra = {}) => ({ project: f.project, initiative: 'I0001', job: 'J001', branch: BRANCH, head: f.head, pr: '1', evidence: 'PR #1 merged, CI green on the head.', gh, ...extra });
const originMain = f => git(f.origin, 'rev-parse', 'main');
const merged = fake => fake.calls.some(argv => argv[1] === 'merge');

try {
  // Success: the merge pins the head, the plan records the close, the records-only commit reaches origin, the worktree and branch are gone.
  {
    const f = await fixture(), fake = fakeGh(f);
    const result = await integrate(request(f, fake.gh));
    assert.equal(result.ok, true, JSON.stringify(result));
    assert.equal(result.state, 'closed');
    const mergeCall = fake.calls.find(argv => argv[1] === 'merge');
    assert.deepEqual(mergeCall.slice(0, 3), ['pr', 'merge', '1']);
    assert.equal(mergeCall[mergeCall.indexOf('--match-head-commit') + 1], f.head);
    const plan = git(f.origin, 'show', 'main:.factory/initiatives/I0001/plan.md');
    assert.match(plan, /^- Status: completed$/mu);
    assert.match(plan, /^- PR #1 merged, CI green on the head\.$/mu);
    assert.equal(git(f.origin, 'log', '-1', '--format=%s', 'main'), 'docs(i0001): close J001');
    assert.deepEqual(git(f.origin, 'diff', '--name-only', 'main~1', 'main').split('\n'), ['.factory/initiatives/I0001/plan.md']);
    assert.equal(existsSync(f.worktree), false);
    assert.equal(git(f.project, 'branch', '--list', BRANCH), '');
    assert.equal(git(f.project, 'rev-parse', 'HEAD'), originMain(f), 'the primary checkout follows origin/main');
    // The lifecycle is derived, not stored: a second run finds the job closed and refuses.
    const again = await integrate(request(f, fake.gh, { branch: 'feat/gone' }));
    assert.equal(again.ok, false);
    assert.equal(again.code, 'already-closed');
  }

  // Each refusal names its reason and changes nothing: origin/main is unchanged, no merge is called, the worktree and branch remain.
  const refusals = [
    ['no-brief', { brief: false }, {}, {}],
    ['no-attempt', { attempt: false }, {}, {}],
    ['no-review', { review: false }, {}, {}],
    ['not-covered', { extra: true }, {}, {}],
    ['ci-not-green', {}, { ci: 'PENDING' }, {}],
    ['ci-not-green', {}, { ci: 'FAILURE' }, {}],
    ['ci-not-green', {}, { ciHead: 'b'.repeat(40) }, {}],
    ['ci-not-green', {}, { unreadable: true }, {}],
    ['head-mismatch', {}, {}, { head: 'c'.repeat(40) }],
    ['primary-dirty', { dirtyPrimary: true }, {}, {}],
    ['evidence-required', {}, {}, { evidence: '' }],
  ];
  for (const [code, options, ghOptions, override] of refusals) {
    const f = await fixture(options), fake = fakeGh(f, ghOptions);
    const before = originMain(f);
    const result = await integrate(request(f, fake.gh, override));
    assert.equal(result.ok, false, `${code}: ${JSON.stringify(result)}`);
    assert.equal(result.code, code, JSON.stringify(result));
    assert.equal(merged(fake), false, `${code} must not merge`);
    assert.equal(originMain(f), before, `${code} must not push`);
    assert.equal(existsSync(f.worktree), true, `${code} keeps the worktree`);
    assert.equal(git(f.project, 'branch', '--list', BRANCH).includes(BRANCH), true, `${code} keeps the branch`);
  }

  // The primary checkout must be on the base branch.
  {
    const f = await fixture(), fake = fakeGh(f);
    git(f.project, 'checkout', '-q', '-b', 'other');
    const result = await integrate(request(f, fake.gh));
    assert.equal(result.code, 'primary-not-on-base');
    assert.equal(merged(fake), false);
  }

  // A dirty job worktree would lose work when removed, so it refuses before the merge.
  {
    const f = await fixture(), fake = fakeGh(f);
    await writeFile(join(f.worktree, 'scratch.txt'), 'unsaved\n');
    const result = await integrate(request(f, fake.gh));
    assert.equal(result.code, 'worktree-dirty');
    assert.equal(merged(fake), false);
  }

  // A merge the forge refuses (the head moved) leaves everything as it was.
  {
    const f = await fixture(), fake = fakeGh(f);
    const refusing = async argv => (argv[1] === 'merge' ? { exitCode: 1, stdout: '' } : fake.gh(argv));
    const before = originMain(f);
    const result = await integrate(request(f, refusing));
    assert.equal(result.code, 'merge-refused');
    assert.equal(originMain(f), before);
    assert.equal(existsSync(f.worktree), true);
  }

  // The command line refuses an incomplete request in the same JSON shape.
  const cli = spawnSync(process.execPath, [join(source, 'tools/isswf-integrate.mjs'), 'integrate', '--project', temp], { encoding: 'utf8', timeout: 30000 });
  assert.equal(JSON.parse(cli.stdout).code, 'usage');
  assert.equal(cli.status, 1);
  console.log(JSON.stringify({ status: 'PASS', platform: process.platform }));
} finally {
  await rm(temp, { recursive: true, force: true });
}
