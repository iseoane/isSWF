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
import { checkRecordsPush } from './isswf-records-push-guard-core.mjs';
import { editPlanFile } from './isswf-plan-edit.mjs';
import { appendEvidence, isIdentifier, setField } from './isswf-plan-edit-core.mjs';
import { parsePlan } from './isswf-plan-core.mjs';
import { stateDirectory } from './project-state.mjs';
import { locateGit } from './trusted-git.mjs';

const execFileAsync = promisify(execFile);
const SHA = /^[0-9a-f]{40}$/u;
const refuse = (code, detail = {}) => ({ ok: false, code, ...detail });

/** The real `gh`: resolves `{ exitCode, stdout }`, as the CI state tool reads it. */
export async function realGh(argv) {
  try {
    return { exitCode: 0, stdout: (await execFileAsync('gh', argv, { timeout: 60_000, windowsHide: true, maxBuffer: 16 * 1024 * 1024 })).stdout };
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

function checkRequest({ project, initiative, job, branch, head, pr, repo }) {
  const good = typeof project === 'string' && isAbsolute(project) && /^I\d+$/u.test(initiative ?? '') && isIdentifier(job ?? '')
    && /^[\w][\w./-]*$/u.test(branch ?? '') && SHA.test(head ?? '') && /^[1-9]\d*$/u.test(pr ?? '') && (repo === undefined || /^[\w.-]+\/[\w.-]+$/u.test(repo));
  return good ? undefined : refuse('usage');
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
  const entry = planText.status === 0 ? parsePlan(planText.stdout).find(item => item.id === job) : undefined;
  if (!entry) return { error: refuse('job-not-found') };
  const facts = { closed: entry.reportedStatus === 'completed' };
  const found = { root, base, upstream, git, stateDir };
  if (facts.closed) return { ...found, facts: { ...facts, brief: true, attempt: true, review: true, covered: true, ciGreen: true, merged: true }, state: 'closed' };

  const tip = git(root, ['rev-parse', '--verify', '-q', `refs/heads/${branch}^{commit}`], { check: false });
  if (tip.status !== 0) return { error: refuse('branch-not-found') };
  if (tip.stdout !== head) return { error: refuse('head-mismatch', { branch: tip.stdout }) };
  facts.merged = git(root, ['merge-base', '--is-ancestor', head, upstream], { check: false }).status === 0;
  const names = git(root, ['ls-tree', '--name-only', head, `${stateDir}/initiatives/${initiative}/jobs/${job}/`]).stdout.split(/\r?\n/u).map(path => path.split('/').pop());
  facts.brief = names.some(name => /^brief-r\d+\.md$/u.test(name));
  facts.attempt = names.some(name => /^A\d{3}\.md$/u.test(name));
  facts.review = names.some(name => /^V\d{3}\.md$/u.test(name));
  const detail = {};
  if (facts.brief && facts.attempt && facts.review) {
    try {
      const report = (await coverage({ project: root, initiative, job, head })).jobs.find(item => item.job === job);
      facts.covered = report !== undefined && report.uncovered.length === 0;
      if (!facts.covered) detail.uncovered = report?.uncovered.map(item => item.commit);
    } catch (error) { facts.covered = false; detail.coverage = error.code ?? error.message; }
  }
  if (facts.covered && pr !== undefined) {
    try {
      const ci = await readCiState({ pr, repo, gh });
      facts.ciGreen = ci.state === 'success' && ci.head === head;
      if (!facts.ciGreen) detail.ci = ci.head === head ? ci.state : `head ${ci.head}`;
    } catch (error) { facts.ciGreen = false; detail.ci = error.message; }
  }
  return { ...found, facts, detail, state: deriveState(facts) };
}

/** Merges a covered, CI-green job with its head pinned, closes it in the plan, pushes the records-only commit and removes its worktree and branch. */
export async function integrate(request) {
  const { project, initiative, job, branch, head, pr, repo, remote = 'origin', evidence, gh = realGh } = request;
  const bad = checkRequest(request);
  if (bad) return bad;
  if (typeof evidence !== 'string' || !evidence.trim() || /[\p{Cc}\u2028\u2029]/u.test(evidence)) return refuse('evidence-required');
  let found;
  try {
    const root = resolve(project), git = gitRunner(await locateGit());
    const configured = git(root, ['config', '--get', 'isswf.baseBranch'], { check: false });
    const base = configured.status === 0 && configured.stdout ? configured.stdout : 'main';
    if (git(root, ['symbolic-ref', '--short', '-q', 'HEAD'], { check: false }).stdout !== base) return refuse('primary-not-on-base', { base });
    if (git(root, ['status', '--porcelain', '--untracked-files=no']).stdout) return refuse('primary-dirty');
    found = await jobState({ project, initiative, job, branch, head, pr, repo, remote, gh });
    if (found.error) return found.error;
    const reason = refusalFor(found.state, 'merged');
    if (reason) return refuse(reason, { state: found.state, ...found.detail });
    const { upstream } = found;
    if (git(root, ['merge-base', '--is-ancestor', 'HEAD', upstream], { check: false }).status !== 0) return refuse('primary-diverged');
    // The push below bypasses the shell guard, so the same records-only grant is checked here, before anything is merged.
    const denied = await checkRecordsPush({ command: `git push ${remote} ${base}`, cwd: root, git: async (argv, cwd) => { const result = git(cwd, argv, { check: false }); return { exitCode: result.status, stdout: result.stdout }; } });
    if (denied.deny) return refuse('records-push-not-granted');
    const worktree = worktreeOf(git, root, branch);
    if (worktree && resolve(worktree) !== root && git(worktree, ['status', '--porcelain']).stdout) return refuse('worktree-dirty');

    // From here the merge is out of this command's hands: a later failure leaves the merge done and names the step to finish by hand.
    let merge;
    try { merge = await gh(['pr', 'merge', pr, '--squash', '--match-head-commit', head, ...(repo ? ['--repo', repo] : [])]); } catch { merge = { exitCode: 1 }; }
    if (merge.exitCode !== 0) return refuse('merge-refused', { state: found.state });
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
      step = 'delete-branch'; git(root, ['branch', '-D', branch]);
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
