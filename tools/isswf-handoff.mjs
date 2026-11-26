import { spawnSync } from 'node:child_process';
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { diffArguments, diffEnvironment, gitEnvironment, runGit } from './git-evidence.mjs';
import { buildEnvelope, MAX_DIFF_BYTES } from './isswf-handoff-core.mjs';
import { reviewCoverage, reviewIds } from './isswf-handoff-coverage-core.mjs';
import { REVIEWER_AGENTS, selectionEntry } from './isswf-dispatch-guard-core.mjs';
import { planErrorDetail } from './isswf-plan-core.mjs';
import { recordError } from './isswf-record-new-core.mjs';
import { assertCommit, blobAt, briefOf, checkSha, gitIn, jobTarget, recordNames, requireBrief, requireInProgress } from './isswf-record-new.mjs';
import { locateGit } from './trusted-git.mjs';

const FACTORY_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const GIT_TIMEOUT_MS = 30000;
const GIT_MAX_BUFFER = 16 * 1024 * 1024;
const COVERAGE_GIT_TIMEOUT_MS = 20000;
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

// The injected git of the coverage core: one process per call, with the exit code returned so the core judges the merge-tree conflict status itself.
// A call that cannot run rejects with the code the shared runner (`runGit`) gave it, the same limits and codes as before the core was split.
const coverageGit = (root, gitExecutable) => async argv => {
  const result = spawnSync(gitExecutable, ['-C', root, ...argv], { encoding: 'utf8', env: gitEnvironment(gitExecutable, { GIT_LITERAL_PATHSPECS: '1' }), timeout: COVERAGE_GIT_TIMEOUT_MS, maxBuffer: GIT_MAX_BUFFER, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.error?.code === 'ETIMEDOUT') throw new Error('git-timeout');
  if (result.error?.code === 'ENOBUFS') throw new Error('git-output-limit');
  if (result.error) throw new Error('git-identity-command-failed');
  return { exitCode: result.status ?? 1, stdout: result.stdout };
};

/** Reads, for every job whose records the range changed, the commits outside its review chain's ranges that change more than records; `reviewCoverage` holds the rules. */
export async function coverage({ project, initiative, job, base, head }) {
  if (typeof project !== 'string' || !isAbsolute(project)) throw recordError('invalid-project');
  checkSha(base, 'base', { optional: true });
  checkSha(head, 'head', { optional: true });
  const root = resolve(project);
  const git = await gitIn(root);
  const tip = head ?? git(['rev-parse', '--verify', 'HEAD^{commit}']).trim();
  let from = base;
  if (from === undefined) {
    try { from = git(['merge-base', tip, 'refs/remotes/origin/main']).trim(); } catch { throw recordError('base-not-found'); }
  }
  assertCommit(git, from, 'base');
  assertCommit(git, tip, 'head');
  try {
    return await reviewCoverage({ git: coverageGit(root, await locateGit()), base: from, head: tip, initiative, job });
  } catch (error) {
    throw error.message === 'git-failed' ? new Error('git-identity-command-failed') : error;
  }
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
