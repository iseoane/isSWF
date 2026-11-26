import { spawnSync } from 'node:child_process';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { diffArguments, diffEnvironment, gitEnvironment, runGit } from './git-evidence.mjs';
import { buildEnvelope, MAX_DIFF_BYTES, overrideCommitsOf, reviewBaseOf, reviewCandidateOf, uncoveredCommits } from './isswf-handoff-core.mjs';
import { REVIEWER_AGENTS, selectionEntry } from './isswf-dispatch-guard-core.mjs';
import { planErrorDetail } from './isswf-plan-core.mjs';
import { recordError } from './isswf-record-new-core.mjs';
import { isInitiativePath } from './isswf-snapshot-core.mjs';
import { assertCommit, blobAt, briefOf, checkSha, gitIn, jobTarget, recordNames, requireBrief, reviewIds, requireInProgress } from './isswf-record-new.mjs';
import { locateGit } from './trusted-git.mjs';

const FACTORY_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const GIT_TIMEOUT_MS = 30000;
const REVIEW_RESOURCES = ['.agents/roles/reviewer.md', '.agents/skills/isswf-review/SKILL.md', '.agents/roles/references/review.md', '.agents/roles/references/review-convergence.md'];
const HOST_GUIDES = { claude: '.agents/hosts/claude-code.md', pi: '.agents/hosts/pi.md' };

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
  try {
    const { agent, model, effort } = selectionEntry(selection, host, REVIEWER_AGENTS[host], 'dispatch-selection.json');
    return { host, agent, model, effort };
  } catch { throw recordError('reviewer-selection-missing', { field: host }); }
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
  const git = await gitIn(target.root);
  assertCommit(git, checkpoint, 'checkpoint');
  await requireInProgress(target, initiative, job, git, checkpoint);
  await requireBrief(target, brief, git, checkpoint);
  const names = await recordNames(target, git);
  const priorReviews = prior ?? reviewIds(names);
  return writeHandoff({
    target, git, base, candidate, out, host, stem: `${job}-${candidate.slice(0, 12)}`, resourceRevision: checkpoint,
    fields: { initiative, job, brief: { path: brief.path, revision: brief.revision, checkpoint, blob: blobAt(git, checkpoint, brief.path) }, round: priorReviews.length + 1, priorReviews },
  });
}

const MAX_REQUEST_CHARS = 8192;

/**
 * Writes a code-only review handoff: the exact `base..candidate` diff and an envelope with mode `code-only`, no initiative, job or brief,
 * and the operator's request as the review criterion. It serves a small change the coordinator made itself, so an independent reviewer
 * can still judge it; the result is reported in the conversation or the pull request, not in a job record.
 */
export async function codeReviewHandoff({ project, base, candidate, request, out, host = 'claude' }) {
  if (out !== undefined && !isAbsolute(out)) throw recordError('invalid-out');
  if (!Object.hasOwn(HOST_GUIDES, host)) throw recordError('invalid-host');
  if (typeof project !== 'string' || !isAbsolute(project)) throw recordError('invalid-project');
  if (typeof request !== 'string' || !request.trim() || request.length > MAX_REQUEST_CHARS) throw recordError('invalid-request');
  checkSha(base, 'base');
  checkSha(candidate, 'candidate');
  const root = resolve(project);
  const states = [];
  for (const name of ['.isswf', '.factory']) if ((await lstat(join(root, name)).catch(() => undefined))?.isDirectory()) states.push(name);
  if (states.length !== 1) throw recordError('state-not-found');
  const git = await gitIn(root);
  // A change that touches job records belongs to a job, whose review goes through `review` and its brief.
  for (const [sha, flag] of [[base, 'base'], [candidate, 'candidate']]) assertCommit(git, sha, flag);
  if (git(['diff', '--name-only', '-z', base, candidate]).split('\0').some(path => /^\.(?:isswf|factory)\/initiatives\/[^/]+\/jobs\//u.test(path))) throw recordError('job-records-in-range');
  return writeHandoff({
    target: { root, state: states[0] }, git, base, candidate, out, host, stem: `code-${candidate.slice(0, 12)}`, resourceRevision: base,
    fields: { mode: 'code-only', initiative: null, job: null, brief: null, request: request.trim(), round: 1, priorReviews: [] },
  });
}

async function writeHandoff({ target, git, base, candidate, out, host, stem, resourceRevision, fields }) {
  const directory = resolve(out ?? tmpdir());
  if (isInside(await realpath(target.root), await realLocation(directory))) throw recordError('out-inside-project');

  for (const [sha, flag] of [[base, 'base'], [candidate, 'candidate']]) assertCommit(git, sha, flag);
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

  const diffPath = join(directory, `${stem}.diff`);
  // REVIEW.md is read at the base, so a candidate cannot change the rules that judge it.
  const guideBlob = blobAt(git, base, 'REVIEW.md');
  const guideCopy = guideBlob ? join(directory, `${stem}.REVIEW.md`) : null;
  const guideChanged = guideBlob !== blobAt(git, candidate, 'REVIEW.md');
  const envelope = buildEnvelope({
    ...fields, base, candidate,
    diff: { path: diffPath, argv, bytes: patch.length, sha256: createHash('sha256').update(patch).digest('hex') },
    reviewGuide: { revision: base, blob: guideBlob, copy: guideCopy, changed: guideChanged },
    reviewer,
    resources: resources.map(path => ({ path, absolutePath: join(FACTORY_ROOT, ...path.split('/')), blob: blobAt(git, resourceRevision, path) })),
  });
  const text = Buffer.from(`${JSON.stringify(envelope, null, 2)}\n`, 'utf8');
  await mkdir(directory, { recursive: true });
  await writeOnce(diffPath, patch);
  if (guideCopy) await writeOnce(guideCopy, Buffer.from(git(['cat-file', 'blob', guideBlob]), 'utf8'));
  const handoffPath = join(directory, `${stem}.handoff.json`);
  await writeOnce(handoffPath, text);
  const handoff = { path: handoffPath, sha256: createHash('sha256').update(text).digest('hex'), bytes: text.length };
  return { ok: true, handoff, envelope, promptLines: [`handoff: ${handoff.path}`, `handoff-sha256: ${handoff.sha256}`, `candidate ${candidate}`,
    ...(fields.mode === 'code-only' ? [`base ${base}`, 'review-mode: code-only'] : []),
    guideCopy ? `review-guide: ${guideCopy} (REVIEW.md at base ${base})` : `review-guide: absent at base ${base}`,
    ...(guideChanged ? ["review-guide-changed: the candidate changes REVIEW.md; it needs a person's approval"] : [])] };
}

const INITIATIVE_JOB = /^\.(?:isswf|factory)\/initiatives\/(I\d+)\/jobs\/([^/]+)\//u;

/** Reads, for every job whose records the range changed, the commits outside its review chain's ranges that change more than records. A merge counts by what it adds beyond the automatic merge of its parents, so a clean merge adds nothing and a conflict resolution that adds code is listed. */
export async function coverage({ project, initiative, job, base, head }) {
  if (typeof project !== 'string' || !isAbsolute(project)) throw recordError('invalid-project');
  checkSha(base, 'base', { optional: true });
  checkSha(head, 'head', { optional: true });
  const root = resolve(project);
  const git = await gitIn(root);
  const gitExecutable = await locateGit();
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
  // Each job's review chain: the latest review, then each earlier review whose candidate is the base of the review after it. A delta review carries the
  // earlier round forward, so the chain together reviewed its ranges; the first review that does not chain ends it. A base after the earlier candidate
  // still chains when the commits between them change only records, such as the earlier review's own record. Merges of main are allowed too: a merge whose other
  // parents are on main and whose own changes are records only, and the commits it brings in from main, change nothing the job branch needs reviewed.
  // A merge's own changes are its difference from the automatic merge of its two parents, with the conflicted files counted as changed so that their resolution
  // is reviewed. A merge of more than two parents, or one the automatic merge cannot be computed for, has unknown changes and counts as unreviewed.
  const UNJUDGED_MERGE = '(merge not judged)';
  const ownPaths = (commit, parents) => {
    if (parents.length < 2) return git(['diff-tree', '-r', '--root', '--name-only', '--no-commit-id', '-z', commit]).split('\0').filter(Boolean);
    if (parents.length > 2) return [UNJUDGED_MERGE];
    const auto = spawnSync(gitExecutable, ['-C', root, 'merge-tree', '--write-tree', '--name-only', '--no-messages', '-z', ...parents], { encoding: 'buffer', env: gitEnvironment(gitExecutable, { GIT_LITERAL_PATHSPECS: '1' }), timeout: 20000, maxBuffer: 16 * 1024 * 1024, windowsHide: true });
    if (auto.error || (auto.status !== 0 && auto.status !== 1)) return [UNJUDGED_MERGE];
    const [tree, ...conflicted] = auto.stdout.toString('utf8').split('\0').filter(Boolean);
    try { return [...new Set([...conflicted, ...git(['diff', '--no-renames', '--name-only', '-z', tree, commit]).split('\0').filter(Boolean)])]; } catch { return [UNJUDGED_MERGE]; }
  };
  const mainRef = 'refs/remotes/origin/main';
  const hasMain = (() => { try { git(['rev-parse', '--verify', '--quiet', `${mainRef}^{commit}`]); return true; } catch { return false; } })();
  const onlyRecordsOrMainMerges = (candidate, laterBase) => git(['rev-list', '--parents', `${candidate}..${laterBase}`, ...(hasMain ? ['--not', mainRef] : [])]).split('\n').filter(Boolean).every(line => {
    const [commit, first, ...otherParents] = line.split(' ');
    if (otherParents.length && !otherParents.every(parent => hasMain && isAncestor(parent, mainRef))) return false;
    return ownPaths(commit, first ? [first, ...otherParents] : []).every(isInitiativePath);
  });
  const chainsTo = (candidate, laterBase) => candidate !== undefined && laterBase !== undefined && (candidate === laterBase || (isAncestor(candidate, laterBase)
    && onlyRecordsOrMainMerges(candidate, laterBase)));
  const reviews = [...touched.values()].sort((a, b) => a.directory.localeCompare(b.directory)).map(entry => {
    const ids = reviewIds(git(['ls-tree', '--name-only', '-z', tip, '--', entry.directory]).split('\0').filter(Boolean).map(path => basename(path)));
    const chain = [];
    for (const id of ids.toReversed()) {
      const text = git(['show', `${tip}:${entry.directory}${id}.md`]);
      const link = { text, candidate: reviewCandidateOf(text), base: reviewBaseOf(text) };
      if (chain.length && !chainsTo(link.candidate, chain.at(-1).base)) break;
      chain.push(link);
    }
    return { ...entry, record: ids.at(-1), candidate: chain[0]?.candidate, chain };
  });
  // A commit is covered when it lies in the base..candidate range of a review in some job's chain, so a later job's candidate does not cover an unreviewed
  // commit before its own base. A review whose candidate is outside this history, or whose base cannot be read, reviewed other code and covers nothing here.
  const covered = new Set();
  for (const { candidate, base: reviewBase } of reviews.flatMap(entry => entry.chain)) {
    if (candidate === undefined || reviewBase === undefined || !isAncestor(candidate, tip)) continue;
    try {
      for (const commit of git(['rev-list', candidate, '--not', reviewBase]).split('\n').filter(Boolean)) covered.add(commit);
    } catch { /* a base that is not in this repository covers nothing */ }
  }
  // The override lines of every review in every chain apply to the one list of commits.
  const overrides = reviews.flatMap(entry => entry.chain.flatMap(link => overrideCommitsOf(link.text)));
  const commits = git(['rev-list', '--reverse', '--parents', `${from}..${tip}`]).split('\n').filter(Boolean).map(line => line.split(' ')).filter(([commit]) => !covered.has(commit)).map(([commit, ...parents]) => ({
    commit,
    paths: [...new Set(ownPaths(commit, parents).filter(path => !isInitiativePath(path)))].sort(),
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
  'code-only': { required: ['--project', '--base', '--candidate', '--request'], optional: ['--out', '--host'] },
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
  if (command === 'code-only') return codeReviewHandoff({ project: args['--project'], base: args['--base'], candidate: args['--candidate'], request: args['--request'], out: args['--out'], host: args['--host'] });
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
