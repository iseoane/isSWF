import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { initRepository } from './support/git-fixture.mjs';

const source = resolve(process.argv[2] || '.');
const load = name => import(pathToFileURL(join(source, 'tools', name)).href);
const { deriveState, refusalFor } = await load('isswf-delivery-core.mjs');
const { integrate } = await load('isswf-integrate.mjs');

// The lifecycle: the state is the furthest step whose earlier steps all hold; a later step alone does not count.
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
const PLAN = (second = 'pending') => `# I0001: Synthetic\n\nType: bug\n\n${[['J001', 'in-progress'], ['J002', second]].map(([id, status]) => `## ${id}\n\n- Status: ${status}\n- Objective: Synthetic\n- Depends on: None\n- Brief: [brief-r1.md](jobs/${id}/brief-r1.md)\n- Blocker: None.\n- Next step: Review.\n\n### Acceptance\n\n- Observable outcome\n\n### Evidence\n\n- ${status === 'completed' ? 'Done.' : 'None.'}\n`).join('\n')}`;
const SETUP = '# setup\n\n- Records-only direct push: granted\n';
const JOB = '.factory/initiatives/I0001/jobs/J001';
const PLAN_PATH = '.factory/initiatives/I0001/plan.md';
const put = async (root, path, text) => { await mkdir(join(root, path, '..'), { recursive: true }); await writeFile(join(root, path), text); };
let counter = 0;

// A job branch in its own worktree off `f.base`; `options` leave records out or add commits after the review.
async function addBranch(f, name, { brief = true, attempt = true, review = true, extra = false } = {}) {
  const worktree = join(f.dir, `wt-${name}`), branch = `feat/${name}`;
  git(f.project, 'worktree', 'add', '-q', '-b', branch, worktree, f.base);
  if (!brief) { git(worktree, 'rm', '-q', `${JOB}/brief-r1.md`); git(worktree, 'commit', '-qm', 'drop brief'); }
  await put(worktree, `src/${name}.mjs`, 'export const x = 1;\n');
  git(worktree, 'add', '-A'); git(worktree, 'commit', '-qm', 'feat: x');
  const candidate = git(worktree, 'rev-parse', 'HEAD');
  if (attempt) await put(worktree, `${JOB}/A001.md`, '# attempt\n');
  if (review) await put(worktree, `${JOB}/V001.md`, `# review\n\n- Base commit SHA: ${f.base}\n- Candidate commit SHA, or reproducible snapshot identity: ${candidate}\n`);
  git(worktree, 'add', '-A'); git(worktree, 'commit', '--allow-empty', '-qm', 'docs: records');
  if (extra) { await put(worktree, 'src/y.mjs', 'export const y = 1;\n'); git(worktree, 'add', '-A'); git(worktree, 'commit', '-qm', 'feat: y after review'); }
  git(worktree, 'push', '-q', 'origin', branch);
  return { ...f, worktree, branch, head: git(worktree, 'rev-parse', 'HEAD') };
}

// A bare origin, the primary checkout on main, a forge clone and one complete job branch.
async function fixture() {
  counter += 1;
  const dir = join(temp, `case${counter}`);
  const origin = join(dir, 'origin.git'), project = join(dir, 'project'), forge = join(dir, 'forge');
  await mkdir(dir);
  initRepository(origin, ['--bare', '-b', 'main']);
  initRepository(project, ['-b', 'main']);
  await put(project, PLAN_PATH, PLAN());
  await put(project, '.factory/project-setup.md', SETUP);
  await put(project, `${JOB}/brief-r1.md`, '# brief\n');
  git(project, 'add', '-A'); git(project, 'commit', '-qm', 'start');
  git(project, 'remote', 'add', 'origin', origin);
  git(project, 'push', '-q', 'origin', 'main');
  initRepository(forge, []);
  git(forge, 'remote', 'add', 'origin', origin);
  return addBranch({ dir, origin, project, forge, base: git(project, 'rev-parse', 'HEAD') }, 'i0001-j001');
}

// A change the forge pushes to origin/main, as another contributor would.
function forgeCommit(f, files, message) {
  git(f.forge, 'fetch', '-q', 'origin', 'main');
  git(f.forge, 'checkout', '-q', '-B', 'main', 'origin/main');
  for (const [path, text] of Object.entries(files)) { mkdirSync(join(f.forge, path, '..'), { recursive: true }); writeFileSync(join(f.forge, path), text); }
  git(f.forge, 'add', '-A'); git(f.forge, 'commit', '-qm', message);
  git(f.forge, 'push', '-q', 'origin', 'main');
}

// A fake `gh`: `pr view` answers with the PR state and CI rollup; `pr merge` squash-merges the branch into origin/main in the forge clone, as GitHub would.
function fakeGh(f, { ci = 'SUCCESS', ciHead, unreadable = false, mergeThenFail = false, mergeNoop = false, afterMerge } = {}) {
  const calls = [];
  const state = { merged: false };
  const forgeMerge = () => {
    git(f.forge, 'fetch', '-q', 'origin', 'main', f.branch);
    git(f.forge, 'checkout', '-q', '-B', 'main', 'origin/main');
    git(f.forge, 'merge', '-q', '--squash', `origin/${f.branch}`);
    git(f.forge, 'commit', '-qm', 'feat: x (#1)');
    git(f.forge, 'push', '-q', 'origin', 'main');
    state.merged = true;
  };
  const gh = async argv => {
    calls.push(argv);
    if (argv[0] === 'pr' && argv[1] === 'view') {
      if (unreadable) return { exitCode: 1, stdout: '' };
      const rollup = ci === 'PENDING' ? [{ name: 'test', status: 'IN_PROGRESS' }] : [{ name: 'test', status: 'COMPLETED', conclusion: ci }];
      return { exitCode: 0, stdout: JSON.stringify({ headRefOid: ciHead ?? f.head, state: state.merged ? 'MERGED' : 'OPEN', statusCheckRollup: rollup }) };
    }
    if (argv[0] === 'pr' && argv[1] === 'merge') {
      const pinned = argv[argv.indexOf('--match-head-commit') + 1];
      if (pinned !== git(f.worktree, 'rev-parse', 'HEAD')) return { exitCode: 1, stdout: '' };
      if (!mergeNoop) forgeMerge();
      afterMerge?.();
      return { exitCode: mergeThenFail ? 1 : 0, stdout: '' };
    }
    return { exitCode: 1, stdout: '' };
  };
  return { gh, calls, forgeMerge };
}

const request = (f, gh, extra = {}) => ({ project: f.project, initiative: 'I0001', job: 'J001', branch: f.branch, head: f.head, pr: '1', evidence: 'PR #1 merged, CI green on the head.', gh, ...extra });
const originMain = f => git(f.origin, 'rev-parse', 'main');
const merged = fake => fake.calls.some(argv => argv[1] === 'merge');

// What a successful close leaves behind, checked in the success, resume and recovered-merge scenarios.
function assertClosed(f, result) {
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.state, 'closed');
  const plan = git(f.origin, 'show', `main:${PLAN_PATH}`);
  assert.match(plan, /^- Status: completed$/mu);
  assert.match(plan, /^- PR #1 merged, CI green on the head\.$/mu);
  assert.equal(git(f.origin, 'log', '-1', '--format=%s', 'main'), 'docs(i0001): close J001');
  assert.deepEqual(git(f.origin, 'diff', '--name-only', 'main~1', 'main').split('\n'), [PLAN_PATH]);
  assert.equal(existsSync(f.worktree), false);
  assert.equal(git(f.project, 'branch', '--list', f.branch), '');
  assert.equal(git(f.project, 'rev-parse', 'HEAD'), originMain(f), 'the primary checkout follows origin/main');
}

try {
  // Success: the merge pins the head, the plan records the close, the records-only commit reaches origin, the worktree and branch are gone.
  {
    const f = await fixture(), fake = fakeGh(f);
    const result = await integrate(request(f, fake.gh));
    assertClosed(f, result);
    const mergeCall = fake.calls.find(argv => argv[1] === 'merge');
    assert.deepEqual(mergeCall.slice(0, 3), ['pr', 'merge', '1']);
    assert.equal(mergeCall[mergeCall.indexOf('--match-head-commit') + 1], f.head);
    // The lifecycle is derived, not stored: a second run finds the job closed and refuses.
    const again = await integrate(request(f, fake.gh));
    assert.equal(again.ok, false);
    assert.equal(again.code, 'already-closed');
  }

  // Each refusal names its reason and changes nothing: origin/main is unchanged, no merge is called, the worktree and branch remain.
  const expectRefusal = async (f, fake, code, override = {}) => {
    const before = originMain(f);
    const result = await integrate(request(f, fake.gh, override));
    assert.equal(result.ok, false, `${code}: ${JSON.stringify(result)}`);
    assert.equal(result.code, code, JSON.stringify(result));
    assert.equal(merged(fake), false, `${code} must not merge`);
    assert.equal(originMain(f), before, `${code} must not push`);
    assert.equal(existsSync(f.worktree), true, `${code} keeps the worktree`);
    assert.equal(git(f.project, 'branch', '--list', f.branch).includes(f.branch), true, `${code} keeps the branch`);
  };
  {
    const f = await fixture();
    // Records missing, or a commit after the review: each variant is another branch of the same repository.
    for (const [code, options] of [['no-brief', { brief: false }], ['no-attempt', { attempt: false }], ['no-review', { review: false }], ['not-covered', { extra: true }]]) {
      const variant = await addBranch(f, code, options);
      await expectRefusal(variant, fakeGh(variant), code);
    }
    for (const ghOptions of [{ ci: 'PENDING' }, { ciHead: 'b'.repeat(40) }, { unreadable: true }]) await expectRefusal(f, fakeGh(f, ghOptions), 'ci-not-green');
    await expectRefusal(f, fakeGh(f), 'head-mismatch', { head: 'c'.repeat(40) });
    await expectRefusal(f, fakeGh(f), 'evidence-required', { evidence: '' });
    await expectRefusal(f, fakeGh(f), 'job-not-found', { job: 'J009' });
    await expectRefusal(f, fakeGh(f), 'branch-not-found', { branch: 'feat/nope' });
    // The refusing forge: the head moved, so the pinned merge fails and nothing else happens.
    const fake = fakeGh(f);
    await expectRefusal(f, { ...fake, gh: async argv => (argv[1] === 'merge' ? { exitCode: 1, stdout: '' } : fake.gh(argv)) }, 'merge-refused');
    // A dirty job worktree would lose work when removed, so it refuses before the merge.
    await writeFile(join(f.worktree, 'scratch.txt'), 'unsaved\n');
    await expectRefusal(f, fakeGh(f), 'worktree-dirty');
    await rm(join(f.worktree, 'scratch.txt'));
    // The primary checkout must be clean, in step with origin and on the base branch.
    await writeFile(join(f.project, 'dirty.txt'), 'x\n');
    git(f.project, 'add', 'dirty.txt');
    await expectRefusal(f, fakeGh(f), 'primary-dirty');
    git(f.project, 'commit', '-qm', 'local only');
    await expectRefusal(f, fakeGh(f), 'primary-diverged');
    git(f.project, 'reset', '-q', '--hard', 'origin/main');
    git(f.project, 'checkout', '-q', '-b', 'other');
    await expectRefusal(f, fakeGh(f), 'primary-not-on-base');
    git(f.project, 'checkout', '-q', 'main');
    // The push bypasses the shell guard, so the grant is read from origin/main: a setup record without it refuses.
    forgeCommit(f, { '.factory/project-setup.md': '# setup\n' }, 'drop grant');
    await expectRefusal(f, fakeGh(f), 'records-push-not-granted');
    // Closing the last open job would complete the initiative, which needs the initiative close verification and so the plan commit guard.
    forgeCommit(f, { '.factory/project-setup.md': SETUP, [PLAN_PATH]: PLAN('completed') }, 'J002 completed');
    await expectRefusal(f, fakeGh(f), 'initiative-close-required');
  }

  // A squash merge never puts the head in main's history, so the PR says whether it merged. A PR already merged at this head resumes after the merge.
  {
    const f = await fixture(), fake = fakeGh(f);
    fake.forgeMerge();
    assert.equal(git(f.origin, 'branch', '--list', '--contains', f.head, 'main'), '', 'a squash merge leaves the head outside main');
    const result = await integrate(request(f, fake.gh));
    assertClosed(f, result);
    assert.equal(merged(fake), false, 'an already merged PR is not merged again');
  }
  // The merge call reports failure after the forge merged (a timeout): the PR is read again, so the close goes on and a later failure reports its step with the merge done.
  {
    const f = await fixture();
    const hook = join(f.origin, 'hooks', 'pre-receive');
    await mkdir(join(f.origin, 'hooks'), { recursive: true });
    await writeFile(hook, '#!/bin/sh\n[ -f reject ] && exit 1\nexit 0\n', { mode: 0o755 });
    const fake = fakeGh(f, { mergeThenFail: true, afterMerge: () => writeFileSync(join(f.origin, 'reject'), '') });
    const result = await integrate(request(f, fake.gh));
    assert.equal(result.ok, false);
    assert.equal(result.code, 'post-merge-failed');
    assert.equal(result.merged, true);
    assert.equal(result.step, 'push');
    assert.equal(fake.calls.filter(argv => argv[1] === 'merge').length, 1);
    assert.equal(existsSync(f.worktree), true, 'the worktree is removed only after the push');
  }

  // A merge call that exits 0 without merging (a merge queue, auto-merge) is not a merge: the close stops before the plan is edited.
  {
    const f = await fixture(), fake = fakeGh(f, { mergeNoop: true });
    const before = originMain(f), plan = readFileSync(join(f.project, PLAN_PATH), 'utf8');
    const result = await integrate(request(f, fake.gh));
    assert.equal(result.ok, false);
    assert.equal(result.code, 'merge-unconfirmed', JSON.stringify(result));
    assert.equal(originMain(f), before);
    assert.equal(readFileSync(join(f.project, PLAN_PATH), 'utf8'), plan, 'the plan is not edited');
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
