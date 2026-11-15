import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { diffArguments, diffEnvironment, runGit } from './git-evidence.mjs';
import { buildEnvelope, MAX_DIFF_BYTES, overrideCommitsOf, reviewBaseOf, reviewCandidateOf, uncoveredCommits } from './isswf-handoff-core.mjs';
import { planErrorDetail } from './isswf-plan-core.mjs';
import { isRecordPath, recordError } from './isswf-record-new-core.mjs';
import { assertCommit, blobAt, briefOf, checkSha, gitIn, jobTarget, locateGit, recordNames, requireBrief, reviewIds, requireInProgress } from './isswf-record-new.mjs';

const FACTORY_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const GIT_TIMEOUT_MS = 30000;
const REVIEW_RESOURCES = ['.agents/roles/reviewer.md', '.agents/skills/isswf-review/SKILL.md', '.agents/roles/references/review.md', '.agents/roles/references/review-convergence.md'];
const HOST_GUIDES = { claude: '.agents/hosts/claude-code.md', pi: '.agents/hosts/pi.md' };
// The agent names a selection file may key the reviewer by, in the order the dispatch guard's two spellings are tried.
const REVIEWER_AGENTS = { claude: ['isswf:isswf-reviewer', 'isswf-reviewer'], pi: ['isswf-reviewer'] };

const isInside = (parent, child) => {
  const path = relative(parent, child);
  return path === '' || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path));
};

// The real location of a path that may not exist yet: the nearest existing ancestor, resolved, with the missing names appended.
async function realLocation(path) {
  const missing = [];
  for (let current = path; ; current = dirname(current)) {
    try {
      return join(await realpath(current), ...missing.reverse());
    } catch (error) {
      if (error.code !== 'ENOENT' || dirname(current) === current) throw error;
      missing.push(basename(current));
    }
  }
}

async function reviewerSelection({ root, state }, host) {
  const selection = await readFile(join(root, state, 'dispatch-selection.json'), 'utf8').then(JSON.parse, () => undefined);
  const agents = selection?.agents?.[host];
  for (const agent of REVIEWER_AGENTS[host]) {
    const { model, effort } = agents?.[agent] ?? {};
    if (typeof model === 'string' && model && typeof effort === 'string' && effort) return { host, agent, model, effort };
  }
  throw recordError('reviewer-selection-missing', { field: host });
}

// Both files are write-once: a second handoff for the same candidate and base finds the same bytes, and anything else under that name is refused.
async function writeOnce(path, bytes) {
  try {
    await writeFile(path, bytes, { flag: 'wx' });
  } catch (error) {
    if (error.code !== 'EEXIST' || !(await readFile(path)).equals(bytes)) throw recordError('handoff-exists', { field: path });
  }
}

/** Writes the exact `base..candidate` diff and its `isswf.handoff/1` envelope outside the project and returns the envelope and the prompt lines the dispatch guard reads. */
export async function reviewHandoff({ project, initiative, job, brief: briefInput, checkpoint, base, candidate, prior, out, host = 'claude' }) {
  if (out !== undefined && !isAbsolute(out)) throw recordError('invalid-out');
  if (!Object.hasOwn(HOST_GUIDES, host)) throw recordError('invalid-host');
  const target = await jobTarget({ project, initiative, job });
  const brief = briefOf(briefInput, target);
  checkSha(checkpoint, 'checkpoint');
  checkSha(base, 'base');
  checkSha(candidate, 'candidate');
  await requireInProgress(target, initiative, job);
  await requireBrief(target, brief);
  const directory = resolve(out ?? tmpdir());
  if (isInside(await realpath(target.root), await realLocation(directory))) throw recordError('out-inside-project');

  const git = await gitIn(target.root);
  for (const [sha, flag] of [[checkpoint, 'checkpoint'], [base, 'base'], [candidate, 'candidate']]) assertCommit(git, sha, flag);
  try { git(['merge-base', '--is-ancestor', base, candidate]); } catch { throw recordError('candidate-not-descendant'); }
  const reviewer = await reviewerSelection(target, host);
  const resources = [...REVIEW_RESOURCES, HOST_GUIDES[host]];
  for (const path of resources) if (!(await lstat(join(FACTORY_ROOT, ...path.split('/'))).catch(() => undefined))?.isFile()) throw recordError('resource-not-found', { field: path });

  const argv = diffArguments(base, candidate);
  const binding = { repository: target.root, gitExecutable: await locateGit(), timeoutMs: GIT_TIMEOUT_MS };
  let patch;
  try {
    patch = runGit(binding, argv, Date.now() + GIT_TIMEOUT_MS, MAX_DIFF_BYTES + 1, diffEnvironment());
  } catch (error) {
    throw recordError(error.message === 'git-output-limit' ? 'diff-too-large' : 'diff-failed');
  }
  if (patch.length === 0) throw recordError('diff-empty');
  if (patch.length > MAX_DIFF_BYTES) throw recordError('diff-too-large');

  const names = await recordNames(target, git);
  const priorReviews = prior ?? reviewIds(names);
  const stem = `${job}-${candidate.slice(0, 12)}`;
  const diffPath = join(directory, `${stem}.diff`);
  const envelope = buildEnvelope({
    initiative, job, base, candidate,
    diff: { path: diffPath, argv, bytes: patch.length, sha256: createHash('sha256').update(patch).digest('hex') },
    brief: { path: brief.path, revision: brief.revision, checkpoint, blob: blobAt(git, checkpoint, brief.path) },
    reviewGuide: blobAt(git, candidate, 'REVIEW.md'),
    round: priorReviews.length + 1, priorReviews, reviewer,
    resources: resources.map(path => ({ path, absolutePath: join(FACTORY_ROOT, ...path.split('/')), blob: blobAt(git, checkpoint, path) })),
  });
  const text = Buffer.from(`${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
  await mkdir(directory, { recursive: true });
  await writeOnce(diffPath, patch);
  const handoffPath = join(directory, `${stem}.handoff.json`);
  await writeOnce(handoffPath, text);
  const handoff = { path: handoffPath, sha256: createHash('sha256').update(text).digest('hex'), bytes: text.length };
  return { ok: true, handoff, envelope, promptLines: [`handoff: ${handoff.path}`, `handoff-sha256: ${handoff.sha256}`, `candidate ${candidate}`] };
}

const INITIATIVE_JOB = /^\.(?:isswf|factory)\/initiatives\/(I\d+)\/jobs\/([^/]+)\//u;

/** Reads, for every job whose records the range changed, the commits after its latest review's candidate that change more than records. Merge commits are left out: the commits they bring in are the ones that count. */
export async function coverage({ project, initiative, job, base, head }) {
  if (typeof project !== 'string' || !isAbsolute(project)) throw recordError('invalid-project');
  checkSha(base, 'base', { optional: true });
  checkSha(head, 'head', { optional: true });
  const git = await gitIn(resolve(project));
  const isAncestor = (ancestor, descendant) => {
    try { git(['merge-base', '--is-ancestor', ancestor, descendant]); return true; } catch { return false; }
  };
  const tip = head ?? git(['rev-parse', '--verify', 'HEAD^{commit}']).trim();
  let from = base;
  if (from === undefined) {
    try { from = git(['merge-base', tip, 'refs/remotes/origin/main']).trim(); } catch { throw recordError('base-not-found'); }
  }
  assertCommit(git, from, 'base');
  assertCommit(git, tip, 'head');

  // Every job whose records the range changes counts as a reviewer of the commits it names, even when --initiative or --job leaves it out of the report.
  const touched = new Map();
  for (const path of git(['diff', '--name-only', '-z', from, tip]).split('\0')) {
    const match = INITIATIVE_JOB.exec(path);
    if (match) touched.set(match[0], { initiative: match[1], job: match[2], directory: match[0] });
  }
  const reviews = [...touched.values()].sort((a, b) => a.directory.localeCompare(b.directory)).map(entry => {
    const record = reviewIds(git(['ls-tree', '--name-only', '-z', tip, '--', entry.directory]).split('\0').filter(Boolean).map(path => basename(path))).at(-1);
    const text = record && git(['show', `${tip}:${entry.directory}${record}.md`]);
    return { ...entry, record, text, candidate: text && reviewCandidateOf(text) };
  });
  // A commit is covered when it lies in the base..candidate range of some job's latest review, so a later job's candidate does not cover an unreviewed
  // commit before its own base. A review whose candidate is outside this history, or whose base cannot be read, reviewed other code and covers nothing here.
  const covered = new Set();
  for (const entry of reviews) {
    const candidate = entry.candidate, reviewBase = entry.text && reviewBaseOf(entry.text);
    if (candidate === undefined || reviewBase === undefined || !isAncestor(candidate, tip)) continue;
    try {
      for (const commit of git(['rev-list', candidate, '--not', reviewBase]).split('\n').filter(Boolean)) covered.add(commit);
    } catch { /* a base that is not in this repository covers nothing */ }
  }
  // The override lines of every reviewed job apply to the one list of commits.
  const overrides = reviews.flatMap(entry => (entry.text ? overrideCommitsOf(entry.text) : []));
  const commits = git(['rev-list', '--reverse', '--no-merges', `${from}..${tip}`]).split('\n').filter(commit => commit && !covered.has(commit)).map(commit => ({
    commit,
    paths: [...new Set(git(['diff-tree', '-r', '--root', '--name-only', '--no-commit-id', '-z', commit]).split('\0').filter(path => path && !isRecordPath(path)))].sort(),
  })).filter(item => item.paths.length);
  const jobs = [], skipped = [];
  for (const entry of reviews.filter(item => (!initiative || item.initiative === initiative) && (!job || item.job === job))) {
    if (!entry.record) skipped.push({ initiative: entry.initiative, job: entry.job, reason: 'no-review' });
    else jobs.push({ initiative: entry.initiative, job: entry.job, record: entry.record, candidate: entry.candidate, ...uncoveredCommits({ commits, overrides }) });
  }
  const failed = jobs.some(item => item.uncovered.length);
  return { ok: !failed, ...(failed && { code: 'unreviewed-commits' }), base: from, head: tip, jobs, skipped };
}

const LOCATION = ['--project', '--initiative', '--job'];
const commands = {
  review: { required: [...LOCATION, '--brief', '--checkpoint', '--base', '--candidate'], optional: ['--out', '--host'], variadic: '--prior' },
  coverage: { required: ['--project'], optional: ['--initiative', '--job', '--base', '--head'] },
};

/** Parses `<command> --flag VALUE ...`: every required flag once, each optional flag at most once, and `--prior` with the review IDs that follow it. */
function parseArgs([command, ...parts]) {
  const flags = Object.hasOwn(commands, command) ? commands[command] : undefined;
  if (!flags) throw recordError('usage');
  const args = {};
  for (let i = 0; i < parts.length;) {
    const flag = parts[i];
    if (flag === flags.variadic && !Object.hasOwn(args, flag)) {
      const ids = [];
      for (i += 1; i < parts.length && /^V\d{3}$/u.test(parts[i]); i += 1) ids.push(parts[i]);
      if (!ids.length) throw recordError('usage');
      args[flag] = ids;
    } else if (![...flags.required, ...flags.optional].includes(flag) || parts[i + 1] === undefined || Object.hasOwn(args, flag)) {
      throw recordError('usage');
    } else {
      args[flag] = parts[i + 1];
      i += 2;
    }
  }
  if (flags.required.some(flag => args[flag] === undefined)) throw recordError('usage');
  return { command, args };
}

async function run(argv) {
  const { command, args } = parseArgs(argv);
  if (command === 'coverage') return coverage({ project: args['--project'], initiative: args['--initiative'], job: args['--job'], base: args['--base'], head: args['--head'] });
  return reviewHandoff({
    project: args['--project'], initiative: args['--initiative'], job: args['--job'], brief: args['--brief'], checkpoint: args['--checkpoint'],
    base: args['--base'], candidate: args['--candidate'], prior: args['--prior'], out: args['--out'], host: args['--host'],
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await run(process.argv.slice(2));
    console.log(JSON.stringify(result));
    if (result.ok === false) process.exitCode = 1;
  } catch (error) {
    console.log(JSON.stringify({ ok: false, ...planErrorDetail(error), ...(error.field && { field: error.field }), ...(error.planError && { planError: error.planError }) }));
    process.exitCode = 1;
  }
}
