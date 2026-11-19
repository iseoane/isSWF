import { spawnSync } from 'node:child_process';
import { lstat, mkdir, readdir, readFile, realpath } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGit } from './git-evidence.mjs';
import { parsePlan, planErrorDetail } from './isswf-plan-core.mjs';
import { createExclusive, editFile } from './isswf-plan-edit.mjs';
import { isIdentifier } from './isswf-plan-edit-core.mjs';
import { checkRecord } from './isswf-record-check-core.mjs';
import { completeText, nextRecordId, recordBase, recordError, recordPrefix, renderRecord } from './isswf-record-new-core.mjs';
import { parseRunLine } from './isswf-snapshot-core.mjs';
import { stateDirectory } from './project-state.mjs';

const GIT_TIMEOUT_MS = 20000;
const GIT_MAX_BUFFER = 16 * 1024 * 1024;
const FACTORY_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SHA = /^[0-9a-f]{40}$/u;
const ROLES = { attempt: ['worker', 'researcher', 'planner'], review: ['reviewer'] };

export async function locateGit() {
  const locator = process.platform === 'win32' ? 'where.exe' : 'which';
  const found = spawnSync(locator, ['git'], { encoding: 'utf8', windowsHide: true }).stdout?.trim().split(/\r?\n/u)[0];
  if (!found) throw recordError('git-not-found');
  return realpath(found);
}

/** Runs Git in `cwd` through the shared runner with literal pathspecs and returns its stdout as text. */
export async function gitIn(cwd) {
  const binding = { repository: cwd, gitExecutable: await locateGit(), timeoutMs: GIT_TIMEOUT_MS };
  return args => runGit(binding, args, Date.now() + GIT_TIMEOUT_MS, GIT_MAX_BUFFER, { GIT_LITERAL_PATHSPECS: '1' }).toString('utf8');
}

export async function jobTarget({ project, initiative, job }) {
  if (typeof project !== 'string' || !isAbsolute(project)) throw recordError('invalid-project');
  if (!/^I\d+$/u.test(initiative ?? '')) throw recordError('invalid-initiative');
  if (!isIdentifier(job ?? '')) throw recordError('invalid-job');
  const root = resolve(project), state = stateDirectory(root);
  // A mistyped project fails with `state-not-found` instead of passing for a project whose job has no records yet.
  if (!(await lstat(join(root, state)).catch(() => undefined))?.isDirectory()) throw recordError('state-not-found');
  return { root, state, relative: `${state}/initiatives/${initiative}/jobs/${job}` };
}

const childNames = (output, prefix) => output.split('\0').filter(path => path.startsWith(prefix) && !path.slice(prefix.length).includes('/')).map(path => path.slice(prefix.length));

/** Every file name the job directory has in the working tree, the index, HEAD and each local and remote-tracking branch. */
export async function recordNames({ root, relative: jobRelative }, git) {
  const directory = `${jobRelative}/`;
  const names = new Set((await readdir(join(root, jobRelative)).catch(() => [])));
  for (const name of childNames(git(['ls-files', '-z', '--', directory]), directory)) names.add(name);
  const tips = new Set(git(['for-each-ref', '--format=%(objectname)%00', 'refs/heads', 'refs/remotes']).split('\0').map(line => line.trim()).filter(Boolean));
  // HEAD may be unborn, and a detached HEAD is on no branch.
  try { tips.add(git(['rev-parse', '--verify', '-q', 'HEAD^{commit}']).trim()); } catch { /* no commit yet */ }
  for (const tip of tips) for (const name of childNames(git(['ls-tree', '-z', '--name-only', tip, '--', directory]), directory)) names.add(name);
  return names;
}

/** The review IDs (`V001`, ...) among the file names of a job directory, in order: the job's prior reviews. */
export const reviewIds = names => [...names].filter(name => /^V\d{3}\.md$/u.test(name)).map(name => name.slice(0, 4)).sort();

/** The next unused record ID of `kind` for the job. */
export async function nextId({ project, initiative, job, kind }) {
  const target = await jobTarget({ project, initiative, job });
  return nextRecordId(kind, await recordNames(target, await gitIn(target.root)));
}

/** The blob of the file `path` in commit `rev`, or undefined when that commit does not track it. */
export function blobAt(git, rev, path) {
  return /^\d{6} blob ([0-9a-f]{40,64})\t/u.exec(git(['ls-tree', '-z', rev, '--', path]).split('\0')[0])?.[1];
}

export function checkSha(value, flag, { optional = false } = {}) {
  if (value === undefined && optional) return;
  if (typeof value !== 'string' || !SHA.test(value)) throw recordError(`invalid-${flag}`);
}

// The pane's own parser decides what a Run line is; an unknown ID is left out of the record instead.
function knownRun(run) {
  const parsed = parseRunLine(`- Run: ${run}`);
  return parsed !== null && parsed.id !== 'unknown';
}

export function assertCommit(git, sha, flag) {
  try { git(['rev-parse', '--verify', '-q', `${sha}^{commit}`]); } catch { throw recordError('commit-not-found', { field: flag }); }
}

export function briefOf(brief, { root, relative: jobRelative }) {
  const path = (typeof brief === 'string' && isAbsolute(brief) ? relative(root, brief) : String(brief)).split(sep).join('/').replaceAll('\\', '/');
  const revision = /^brief-r([1-9]\d*)\.md$/u.exec(path.slice(jobRelative.length + 1))?.[1];
  if (!path.startsWith(`${jobRelative}/`) || revision === undefined) throw recordError('invalid-brief');
  return { path, revision };
}

// A brief the coordinator has not written is refused here, whatever Git holds at the checkpoint.
export async function requireBrief({ root }, brief) {
  const info = await lstat(join(root, ...brief.path.split('/'))).catch(() => undefined);
  if (!info?.isFile()) throw recordError('brief-not-found');
}

export async function requireInProgress({ root, state }, initiative, job) {
  const text = await readFile(join(root, state, 'initiatives', initiative, 'plan.md'), 'utf8').catch(error => { throw recordError(error.code === 'ENOENT' ? 'plan-not-found' : 'unreadable-plan'); });
  let jobs;
  try { jobs = parsePlan(text); } catch (error) { throw recordError('current-plan-invalid', { planError: planErrorDetail(error) }); }
  const found = jobs.find(candidate => candidate.id === job);
  if (!found) throw recordError('job-not-found', { job });
  if (found.reportedStatus !== 'in-progress') throw recordError('job-not-in-progress', { job });
}

/**
 * Creates the job's next attempt or review record from the template, with the launch data and Git facts filled.
 * It does not commit the file. `beforeLink` lets a test act between the checks and the publication.
 */
export async function createRecord(input) {
  const { initiative, job, kind, id, role, checkpoint, base, model, effort, run, round, checkout, branch, candidate, beforeLink } = input;
  const target = await jobTarget(input);
  const prefix = recordPrefix(kind);
  if (!new RegExp(`^${prefix}\\d{3}$`, 'u').test(id ?? '')) throw recordError('invalid-id');
  if (!ROLES[kind].includes(role)) throw recordError('invalid-role');
  const brief = briefOf(input.brief, target);
  checkSha(checkpoint, 'checkpoint');
  checkSha(base, 'base');
  checkSha(candidate, 'candidate', { optional: true });
  if (typeof model !== 'string' || !/^[\w./:@+-]{1,100}$/u.test(model)) throw recordError('invalid-model');
  if (typeof effort !== 'string' || !/^[A-Za-z][\w-]{0,30}$/u.test(effort)) throw recordError('invalid-effort');
  if (run !== undefined && !knownRun(run)) throw recordError('invalid-run');
  if (round !== undefined && !/^[1-9]\d{0,2}$/u.test(round)) throw recordError('invalid-round');
  if (checkout !== undefined && !isAbsolute(checkout)) throw recordError('invalid-checkout');
  if (branch !== undefined && !/^[^\s\p{Cc}~^:?*[\\]{1,200}$/u.test(branch)) throw recordError('invalid-branch');
  await requireInProgress(target, initiative, job);
  await requireBrief(target, brief);

  const git = await gitIn(target.root);
  const names = await recordNames(target, git);
  const expectedId = nextRecordId(kind, names);
  if (id !== expectedId) throw recordError('id-not-next', { expected: expectedId });
  for (const [sha, flag] of [[checkpoint, 'checkpoint'], [base, 'base'], [candidate, 'candidate']]) if (sha !== undefined) assertCommit(git, sha, flag);

  const profilePath = `.agents/roles/${role}.md`;
  const selectionPath = `${target.state}/dispatch-selection.json`;
  const workDir = checkout ?? target.root;
  let currentBranch = branch;
  if (currentBranch === undefined) {
    try { currentBranch = (await gitIn(workDir))(['symbolic-ref', '-q', '--short', 'HEAD']).trim() || undefined; } catch { /* a detached HEAD has no branch */ }
  }
  const data = {
    initiative, job, id, kind, run, brief: brief.path, revision: brief.revision, checkpoint, base, candidate, model, effort,
    round: round === undefined ? undefined : Number(round),
    plan: `${target.state}/initiatives/${initiative}/plan.md`,
    profile: { path: profilePath, blob: blobAt(git, checkpoint, profilePath) },
    selection: { path: selectionPath, blob: blobAt(git, checkpoint, selectionPath) },
    checkout: workDir,
    branch: currentBranch,
    reviewGuide: candidate === undefined ? undefined : blobAt(git, base, 'REVIEW.md'),
    priorReviews: reviewIds(names),
    timestamp: `${new Date().toISOString().replace(/\.\d+Z$/u, 'Z')} (UTC)`,
  };
  const template = (await readFile(join(FACTORY_ROOT, '.factory/templates', `${kind}.md`), 'utf8')).replaceAll('\r\n', '\n');
  const text = renderRecord({ template, kind, data });
  const path = join(target.root, target.relative, `${id}.md`);
  const { violations } = checkRecord({ path, text });
  if (violations.length) throw recordError('invalid-record', { violations });
  await mkdir(dirname(path), { recursive: true });
  await createExclusive({ path, text, existsCode: 'record-exists', beforeLink });
  return { ok: true, initiative, job, kind, id, path, violations };
}

/**
 * Fills the Git-derived fields of an existing record: the candidate, its changed paths and, for an attempt, the commits from the base
 * the record names to the candidate. A field the author already edited is refused and the record is left as it was.
 */
export async function completeRecord(input) {
  const { initiative, job, record, candidate, run, beforeRename } = input;
  const target = await jobTarget(input);
  if (!/^[AV]\d{3}$/u.test(record ?? '')) throw recordError('invalid-record');
  checkSha(candidate, 'candidate');
  if (run !== undefined && !knownRun(run)) throw recordError('invalid-run');
  const git = await gitIn(target.root);
  assertCommit(git, candidate, 'candidate');
  const kind = record.startsWith('A') ? 'attempt' : 'review';
  const path = join(target.root, target.relative, `${record}.md`);
  let filled;
  await editFile({
    path, what: 'record', beforeRename,
    edit: text => {
      const base = recordBase(kind, text);
      assertCommit(git, base, 'base');
      const paths = git(['-c', 'core.quotePath=false', 'diff', '--name-only', '--no-renames', '-z', base, candidate]).split('\0').filter(Boolean);
      const commits = kind === 'attempt' ? git(['rev-list', '--reverse', `${base}..${candidate}`]).split('\n').filter(Boolean) : undefined;
      const completed = completeText({ text, kind, candidate, paths, commits, run });
      ({ filled } = completed);
      return completed.text;
    },
  });
  return { ok: true, initiative, job, record, path, filled };
}

const LOCATION = ['--project', '--initiative', '--job'];
const commands = {
  next: { required: [...LOCATION, '--kind'], optional: [] },
  create: { required: [...LOCATION, '--kind', '--id', '--role', '--brief', '--checkpoint', '--base', '--model', '--effort'], optional: ['--run', '--round', '--checkout', '--branch', '--candidate'] },
  complete: { required: [...LOCATION, '--record', '--candidate'], optional: ['--run'] },
};

/** Parses `<command> --flag VALUE ...`: every required flag once, each optional flag at most once. */
function parseArgs([command, ...parts]) {
  const flags = commands[command];
  if (!flags) throw recordError('usage');
  const args = {};
  for (let i = 0; i < parts.length; i += 2) {
    const [flag, value] = [parts[i], parts[i + 1]];
    if (![...flags.required, ...flags.optional].includes(flag) || value === undefined || Object.hasOwn(args, flag)) throw recordError('usage');
    args[flag] = value;
  }
  if (flags.required.some(flag => args[flag] === undefined)) throw recordError('usage');
  return { command, args };
}

async function run(argv) {
  const { command, args } = parseArgs(argv);
  const location = { project: args['--project'], initiative: args['--initiative'], job: args['--job'] };
  if (command === 'complete') return completeRecord({ ...location, record: args['--record'], candidate: args['--candidate'], run: args['--run'] });
  const input = { ...location, kind: args['--kind'] };
  if (command === 'next') return { ok: true, ...input, id: await nextId(input) };
  return createRecord({
    ...input, id: args['--id'], role: args['--role'], brief: args['--brief'], checkpoint: args['--checkpoint'], base: args['--base'],
    model: args['--model'], effort: args['--effort'], run: args['--run'], round: args['--round'], checkout: args['--checkout'], branch: args['--branch'], candidate: args['--candidate'],
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await run(process.argv.slice(2)))); }
  catch (error) { console.log(JSON.stringify({ ok: false, ...planErrorDetail(error), ...(error.expected && { expected: error.expected }), ...(error.planError && { planError: error.planError }), ...(error.violations && { violations: error.violations }) })); process.exitCode = 1; }
}
