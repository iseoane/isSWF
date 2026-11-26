#!/usr/bin/env node
// Integrates a reviewed job: checks review coverage and exact-head CI, merges with the head pinned, records the close in the plan, pushes that
// records-only commit and removes the job worktree and branch (docs/en/operations.md, "Job integration"). It never judges risk or acceptance.
import { execFile, spawnSync } from 'node:child_process';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { deriveState, refusalFor } from './isswf-delivery-core.mjs';
import { coverage } from './isswf-handoff.mjs';
import { readCiState } from './isswf-ci-state-core.mjs';
import { editPlanFile } from './isswf-plan-edit.mjs';
import { appendEvidence, isIdentifier, setField } from './isswf-plan-edit-core.mjs';
import { parsePlan } from './isswf-plan-core.mjs';
import { stateDirectory } from './project-state.mjs';
import { locateGit } from './trusted-git.mjs';

const execFileAsync = promisify(execFile);
const SHA = /^[0-9a-f]{40}$/u;
const GRANT = /^- Records-only direct push: granted\s*$/mu;
const REMOTE = /^[\w][\w.-]*$/u;
const CI_ONLY_BLOCK = /^- Kind: ci-only\s*$/mu;
const refuse = (code, detail = {}) => ({ ok: false, code, ...detail });

/** The real `gh`: resolves `{ exitCode, stdout }`, as the CI state tool reads it. */
export async function realGh(argv, { cwd } = {}) {
  try {
    return { exitCode: 0, stdout: (await execFileAsync('gh', argv, { cwd, timeout: 60_000, windowsHide: true, maxBuffer: 16 * 1024 * 1024 })).stdout };
  } catch (error) {
    if (typeof error.code === 'number') return { exitCode: error.code, stdout: '' };
    throw error;
  }
}

// Runs Git in `cwd`; `check` false returns the exit status instead of throwing, for questions whose answer is a status.
function gitRunner(gitExecutable) {
  return (cwd, args, { check = true } = {}) => {
    const result = spawnSync(gitExecutable, ['-C', cwd, ...args], { encoding: 'utf8', timeout: 120_000, maxBuffer: 16 * 1024 * 1024, windowsHide: true, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_LITERAL_PATHSPECS: '1' } });
    if (result.error) throw result.error;
    if (check && result.status !== 0) throw Object.assign(Error(`git ${args[0]} failed: ${result.stderr.trim()}`), { git: true });
    return { status: result.status, stdout: result.stdout.trim() };
  };
}

// The path of the worktree that has `branch` checked out, from `git worktree list --porcelain`.
function worktreeOf(git, root, branch) {
  for (const block of git(root, ['worktree', 'list', '--porcelain']).stdout.split(/\r?\n\r?\n/u)) {
    const lines = block.split(/\r?\n/u);
    if (lines.includes(`branch refs/heads/${branch}`)) return lines.find(line => line.startsWith('worktree '))?.slice('worktree '.length);
  }
  return undefined;
}

function checkRequest({ project, initiative, job, branch, head, pr, repo, remote }) {
  const good = typeof project === 'string' && isAbsolute(project) && /^I\d+$/u.test(initiative ?? '') && isIdentifier(job ?? '')
    && /^[\w][\w./-]*$/u.test(branch ?? '') && SHA.test(head ?? '') && /^[1-9]\d*$/u.test(pr ?? '') && (remote === undefined || REMOTE.test(remote)) && (repo === undefined || /^[\w.-]+\/[\w.-]+$/u.test(repo));
  return good ? undefined : refuse('usage');
}

// The pull request's state and head, or undefined when gh cannot read it. A squash merge never puts the head in the base branch's history, so this is how a merge is seen.
async function readPr({ pr, repo, gh }) {
  try {
    const result = await gh(['pr', 'view', pr, '--json', 'state,headRefOid', ...(repo ? ['--repo', repo] : [])]);
    return result.exitCode === 0 ? JSON.parse(result.stdout) : undefined;
  } catch { return undefined; }
}
const mergedAt = (view, head) => view?.state === 'MERGED' && view.headRefOid === head;

// The newest commit of the head's first-parent history above `upstream` that changes more than work records. A records-only commit leaves the code CI ran on unchanged,
// so the miss for a failure at the head names this commit, not a record commit that would itself move the head.
function codeTip({ git, root, head, upstream, stateDir }) {
  const commits = git(root, ['rev-list', '--first-parent', head, '--not', upstream], { check: false }).stdout.split(/\r?\n/u).filter(Boolean);
  const changesCode = commit => git(root, ['diff-tree', '-r', '--root', '--name-only', '--no-commit-id', '-m', commit]).stdout.split(/\r?\n/u).some(path => path && !path.startsWith(`${stateDir}/initiatives/`));
  return commits.find(changesCode) ?? head;
}

/** Whether `text` holds a `- Kind: ci-only` miss block whose lines name `sha` (a full SHA or an abbreviation of at least seven characters). A block ends at the next blank line or heading. */
export function hasCiOnlyBlock(text, sha) {
  const lines = text.split(/\r?\n/u);
  return lines.some((line, start) => {
    if (!CI_ONLY_BLOCK.test(line)) return false;
    const end = lines.findIndex((next, index) => index > start && (next.trim() === '' || next.startsWith('#')));
    const block = lines.slice(start, end < 0 ? lines.length : end).join('\n');
    return (block.match(/\b[0-9a-f]{7,40}\b/gu) ?? []).some(token => sha.startsWith(token));
  });
}

/**
 * Reads the job's lifecycle facts from the records and Git and derives its state. Nothing is written; the remote's refs are fetched.
 * Steps after a missing one are not read, so a refusal names the first thing missing.
 */
export async function jobState({ project, initiative, job, branch, head, pr, repo, remote = 'origin', gh = realGh }) {
  const root = resolve(project), stateDir = stateDirectory(root), git = gitRunner(await locateGit());
  const configured = git(root, ['config', '--get', 'isswf.baseBranch'], { check: false });
  const base = configured.status === 0 && configured.stdout ? configured.stdout : 'main';
  const upstream = `${remote}/${base}`;
  git(root, ['fetch', '-q', remote]);
  const planText = git(root, ['show', `${upstream}:${stateDir}/initiatives/${initiative}/plan.md`], { check: false });
  const jobs = planText.status === 0 ? parsePlan(planText.stdout) : [];
  const entry = jobs.find(item => item.id === job);
  if (!entry) return { error: refuse('job-not-found') };
  const facts = { closed: entry.reportedStatus === 'completed' };
  // Closing the last open job completes the initiative, which the plan commit guard gates and this command cannot.
  const found = { root, base, upstream, git, stateDir, closesInitiative: jobs.every(item => item.id === job || item.reportedStatus === 'completed') };
  if (facts.closed) return { ...found, facts: { ...facts, brief: true, attempt: true, review: true, covered: true, ciGreen: true, merged: true }, state: 'closed' };

  const tip = git(root, ['rev-parse', '--verify', '-q', `refs/heads/${branch}^{commit}`], { check: false });
  if (tip.status !== 0) return { error: refuse('branch-not-found') };
  if (tip.stdout !== head) return { error: refuse('head-mismatch', { branch: tip.stdout }) };
  facts.merged = git(root, ['merge-base', '--is-ancestor', head, upstream], { check: false }).status === 0 || (pr !== undefined && mergedAt(await readPr({ pr, repo, gh }), head));
  if (facts.merged) return { ...found, facts: { ...facts, brief: true, attempt: true, review: true, covered: true, ciGreen: true }, detail: {}, state: 'merged' };
  const names = git(root, ['ls-tree', '--name-only', head, `${stateDir}/initiatives/${initiative}/jobs/${job}/`]).stdout.split(/\r?\n/u).map(path => path.split('/').pop());
  facts.brief = names.some(name => /^brief-r\d+\.md$/u.test(name));
  facts.attempt = names.some(name => /^A\d{3}\.md$/u.test(name));
  facts.review = names.some(name => /^V\d{3}\.md$/u.test(name));
  const detail = {};
  if (facts.brief && facts.attempt && facts.review) {
    try {
      const from = git(root, ['merge-base', head, upstream], { check: false });
      const report = (await coverage({ project: root, initiative, job, head, base: from.status === 0 ? from.stdout : undefined })).jobs.find(item => item.job === job);
      facts.covered = report !== undefined && report.uncovered.length === 0;
      if (!facts.covered) detail.uncovered = report?.uncovered.map(item => item.commit);
    } catch (error) { facts.covered = false; detail.coverage = error.code ?? error.message; }
  }
  if (facts.covered && pr !== undefined) {
    try {
      const ci = await readCiState({ pr, repo, gh });
      facts.ciGreen = ci.state === 'success' && ci.head === head;
      if (!facts.ciGreen) detail.ci = ci.head === head ? ci.state : `head ${ci.head}`;
      // A failure on a reviewed head is a miss the retrospective needs; the job records must hold its block before this goes on.
      if (ci.head === head && ci.state === 'failure') {
        const tipOfCode = codeTip({ git, root, head, upstream, stateDir });
        const records = names.filter(name => /^[AV]\d{3}\.md$/u.test(name)).map(name => git(root, ['show', `${head}:${stateDir}/initiatives/${initiative}/jobs/${job}/${name}`]).stdout);
        detail.missUnrecorded = !records.some(text => hasCiOnlyBlock(text, tipOfCode));
      }
    } catch (error) { facts.ciGreen = false; detail.ci = error.message; }
  }
  return { ...found, facts, detail, state: deriveState(facts) };
}

/** Merges a covered, CI-green job with its head pinned, closes it in the plan, pushes the records-only commit and removes its worktree and branch. */
export async function integrate(request) {
  const bad = checkRequest(request);
  if (bad) return bad;
  const { project, initiative, job, branch, head, pr, repo, remote = 'origin', evidence } = request;
  if (typeof evidence !== 'string' || !evidence.trim() || /[\p{Cc}\u2028\u2029]/u.test(evidence)) return refuse('evidence-required');
  let found;
  try {
    const root = resolve(project), git = gitRunner(await locateGit());
    const configured = git(root, ['config', '--get', 'isswf.baseBranch'], { check: false });
    const base = configured.status === 0 && configured.stdout ? configured.stdout : 'main';
    if (git(root, ['symbolic-ref', '--short', '-q', 'HEAD'], { check: false }).stdout !== base) return refuse('primary-not-on-base', { base });
    if (git(root, ['status', '--porcelain', '--untracked-files=no']).stdout) return refuse('primary-dirty');
    const gh = argv => (request.gh ?? realGh)(argv, { cwd: root });
    found = await jobState({ project, initiative, job, branch, head, pr, repo, remote, gh });
    if (found.error) return found.error;
    // A pull request already merged at this head resumes after the merge; any other state needs the merge first.
    const resuming = found.state === 'merged';
    const reason = resuming ? refusalFor('merged', 'closed') : refusalFor(found.state, 'merged');
    if (reason) return refuse(reason === 'ci-not-green' && found.detail.missUnrecorded ? 'ci-miss-unrecorded' : reason, { state: found.state, ...found.detail });
    if (found.closesInitiative) return refuse('initiative-close-required', { state: found.state });
    const { upstream } = found;
    if (git(root, ['merge-base', '--is-ancestor', 'HEAD', upstream], { check: false }).status !== 0) return refuse('primary-diverged');
    // The push below bypasses the shell guard, so the records-only grant the guard reads is checked here on the remote's base, before anything is merged.
    const setup = git(root, ['show', `${upstream}:${found.stateDir}/project-setup.md`], { check: false });
    if (setup.status !== 0 || !GRANT.test(setup.stdout)) return refuse('records-push-not-granted');
    const worktree = worktreeOf(git, root, branch);
    if (worktree && resolve(worktree) !== root && git(worktree, ['status', '--porcelain']).stdout) return refuse('worktree-dirty');

    // From here the merge is out of this command's hands: a later failure leaves the merge done and names the step to finish by hand.
    if (!resuming) {
      let merge;
      try { merge = await gh(['pr', 'merge', pr, '--squash', '--match-head-commit', head, ...(repo ? ['--repo', repo] : [])]); } catch { merge = { exitCode: 1 }; }
      // A merge that failed or timed out may still have happened: the pull request says.
      // An exit 0 is not a merge either: a merge queue or auto-merge accepts the request and merges later.
      if (!mergedAt(await readPr({ pr, repo, gh }), head)) return refuse(merge.exitCode === 0 ? 'merge-unconfirmed' : 'merge-refused', { state: found.state });
    }
    let step = 'fetch';
    try {
      git(root, ['fetch', '-q', remote]);
      step = 'fast-forward'; git(root, ['merge', '--ff-only', '-q', upstream]);
      step = 'plan';
      await editPlanFile({ project: root, initiative, edit: text => setField(setField(setField(appendEvidence(text, { job, value: evidence }), { job, field: 'Status', value: 'completed' }), { job, field: 'Next step', value: 'None.' }), { job, field: 'Blocker', value: 'None.' }) });
      step = 'commit';
      git(root, ['add', '--', `${found.stateDir}/initiatives/${initiative}/plan.md`]);
      git(root, ['commit', '-q', '-m', `docs(${initiative.toLowerCase()}): close ${job}`]);
      step = 'push'; git(root, ['push', '-q', remote, `HEAD:refs/heads/${base}`]);
      step = 'remove-worktree'; if (worktree && resolve(worktree) !== root) git(root, ['worktree', 'remove', worktree]);
      step = 'delete-branch'; git(root, ['update-ref', '-d', `refs/heads/${branch}`, head]);
    } catch (error) {
      return refuse('post-merge-failed', { merged: true, step, message: error.code ?? error.message });
    }
    return { ok: true, state: 'closed', head, close: git(root, ['rev-parse', 'HEAD']).stdout };
  } catch (error) {
    return refuse(error.code ?? 'integration-failed', { message: error.message });
  }
}

const FLAGS = { '--project': 'project', '--initiative': 'initiative', '--job': 'job', '--branch': 'branch', '--head': 'head', '--pr': 'pr', '--repo': 'repo', '--remote': 'remote', '--evidence': 'evidence' };
const REQUIRED = { integrate: ['project', 'initiative', 'job', 'branch', 'head', 'pr', 'evidence'], state: ['project', 'initiative', 'job', 'branch', 'head'] };

function parseArgs([command, ...parts]) {
  if (!Object.hasOwn(REQUIRED, command)) return undefined;
  const request = {};
  for (let i = 0; i < parts.length; i += 2) {
    const key = FLAGS[parts[i]];
    if (!key || parts[i + 1] === undefined || Object.hasOwn(request, key)) return undefined;
    request[key] = parts[i + 1];
  }
  return REQUIRED[command].every(key => request[key] !== undefined) ? { command, request } : undefined;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const parsed = parseArgs(process.argv.slice(2));
  let result;
  if (!parsed) result = refuse('usage');
  else if (parsed.command === 'integrate') result = await integrate(parsed.request);
  else {
    try {
      const found = await jobState(parsed.request);
      result = found.error ?? { ok: true, state: found.state, ...found.detail };
    } catch (error) { result = refuse(error.code ?? 'state-failed', { message: error.message }); }
  }
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode = 1;
}
