// No Node imports and no `process` access, like tools/isswf-plan-edit-core.mjs: a runtime without Node built-ins
// can call these on text. tools/isswf-record-new.mjs is the Node wrapper that reads the files and runs Git.
import { isInitiativePath, RECORD_NAME } from './isswf-snapshot-core.mjs';

const KIND_PREFIX = { attempt: 'A', review: 'V' };
const LAST_NUMBER = 999;

export const recordError = (code, where = {}) => Object.assign(Error(code), { code }, where);

export function recordPrefix(kind) {
  if (!Object.hasOwn(KIND_PREFIX, kind)) throw recordError('invalid-kind');
  return KIND_PREFIX[kind];
}

/** The next unused ID of `kind`: one more than the highest number among the record names the job holds, whatever their source. */
export function nextRecordId(kind, names) {
  const prefix = recordPrefix(kind);
  let highest = 0;
  for (const name of names) if (RECORD_NAME.test(name) && name[0] === prefix) highest = Math.max(highest, Number(name.slice(1, 4)));
  if (highest >= LAST_NUMBER) throw recordError('ids-exhausted');
  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
}

// A tracked file is named with its blob; a file the checkpoint does not hold is said not to be tracked there.
const tracked = ({ path, blob }) => `${path}, ${blob ? `blob ${blob}` : 'not tracked at the checkpoint'}`;

// Each entry is a template label and its value: a string fills the line, `null` deletes it and `undefined` leaves the template's line.
function attemptFields(d) {
  return [
    ['Job ID and attempt ID:', `${d.initiative}/${d.job}, ${d.id}`],
    ['Review round:', d.round === undefined ? null : String(d.round)],
    ['Run:', d.run ?? null],
    ['Report timestamp and timezone:', d.timestamp],
    ['Brief path, revision, and input checkpoint (full Git SHA):', `${d.brief}, r${d.revision}, ${d.checkpoint}`],
    ['Plan path and revision, if used:', `${d.plan}, ${d.checkpoint}`],
    ['Profile path and revision, if available:', tracked(d.profile)],
    ['Target codebase base (full Git SHA):', d.base],
    ['Exclusive checkout or worktree:', d.checkout],
    ['Branch:', d.branch],
    ['Candidate commit SHA:', d.candidate],
    ['Model configuration path and input Git SHA (full SHA):', tracked(d.selection)],
    ['Requested model and effort:', `\`${d.model}\`/\`${d.effort}\``],
  ];
}

function reviewFields(d) {
  const reviewGuide = d.candidate === undefined ? undefined : d.reviewGuide ? `REVIEW.md, blob ${d.reviewGuide}` : 'absent';
  return [
    ['Job ID and review ID:', `${d.initiative}/${d.job}, ${d.id}`],
    ['Run:', d.run ?? null],
    ['Review round in this job, and prior review IDs:', d.round === undefined ? undefined : `${d.round}; prior reviews: ${d.priorReviews.join(', ') || 'none'}`],
    ['Project `REVIEW.md` consumed (path and revision), or absent:', reviewGuide],
    ['Brief path and exact revision:', `${d.brief}, r${d.revision}, ${d.checkpoint}`],
    ['Base commit SHA:', d.base],
    ['Candidate commit SHA, or reproducible snapshot identity:', d.candidate],
    ['Reviewer profile, model, and effort:', `${tracked(d.profile)}, requested \`${d.model}\`/\`${d.effort}\``],
    ['Review timestamp:', d.timestamp],
  ];
}

/** The record text for `kind`: the template with the mechanical fields in `data` filled and every other line unchanged. */
export function renderRecord({ template, kind, data }) {
  const lines = template.split('\n');
  for (const [label, value] of (kind === 'attempt' ? attemptFields : reviewFields)(data)) {
    const at = lines.flatMap((line, index) => (line.startsWith(`- ${label}`) ? [index] : []));
    if (at.length !== 1) throw recordError('template-field-missing', { field: label });
    if (value === null) lines.splice(at[0], 1);
    else if (value !== undefined) lines[at[0]] = `- ${label} ${value}`;
  }
  return lines.join('\n');
}

const COMPLETION_LABELS = {
  attempt: { candidate: 'Candidate commit SHA:', paths: 'Changed paths:', commits: 'Resulting artifact paths and checkpoint or commit references:', base: 'Target codebase base (full Git SHA):' },
  review: { candidate: 'Candidate commit SHA, or reproducible snapshot identity:', paths: 'Candidate paths reviewed:', base: 'Base commit SHA:' },
};
const TEMPLATE_RUN = '- Run: claude agent=<id>';

/** The base commit the record names, which `complete` diffs from. */
export function recordBase(kind, text) {
  const label = `- ${COMPLETION_LABELS[kind].base}`;
  const value = text.split(/\r?\n/u).find(line => line.startsWith(label))?.slice(label.length).trim();
  if (!/^[0-9a-f]{40}$/u.test(value ?? '')) throw recordError('base-not-recorded');
  return value;
}

// A path is quoted as Markdown code, so one that holds a backtick or a control character cannot be written back faithfully.
function codePath(path) {
  if (/[`\p{Cc}]/u.test(path)) throw recordError('unsafe-path', { field: path });
  return `\`${path}\``;
}

function pathLines(paths) {
  const records = paths.filter(isInitiativePath);
  const lines = paths.filter(path => !isInitiativePath(path)).map(path => `  - ${codePath(path)}`);
  if (records.length) lines.push('  - Record paths:', ...records.map(path => `    - ${codePath(path)}`));
  return lines.length ? lines : ['  - None.'];
}

const commitLines = shas => (shas.length ? ['  - Commits (oldest first):', ...shas.map(sha => `    - \`${sha}\``)] : ['  - No commits between the base and the candidate.']);

// The field's line and the indented lines under it.
const blockAt = (lines, at) => {
  let end = at + 1;
  while (end < lines.length && /^\s+\S/u.test(lines[end])) end += 1;
  return end;
};

// Fills a field that still has the template's empty text. A field that already holds exactly this text is left alone, and any other is the author's.
function fillField(lines, label, inline, nested) {
  const at = lines.flatMap((line, index) => (line.startsWith(`- ${label}`) ? [index] : []));
  if (at.length !== 1) throw recordError('field-missing', { field: label });
  const filled = [`- ${label}${inline ? ` ${inline}` : ''}`, ...nested];
  const existing = lines.slice(at[0], blockAt(lines, at[0]));
  if (existing.length === filled.length && existing.every((line, index) => line === filled[index])) return false;
  if (existing.length !== 1 || existing[0] !== `- ${label}`) throw recordError('field-not-template', { field: label });
  lines.splice(at[0], 1, ...filled);
  return true;
}

// A launch adds its own Run line: after the last one, else right after the Job ID line.
function addRun(lines, run) {
  const line = `- Run: ${run}`;
  if (lines.includes(line)) return false;
  const runs = lines.flatMap((entry, index) => (entry.startsWith('- Run:') ? [index] : []));
  if (runs.length === 1 && lines[runs[0]] === TEMPLATE_RUN) lines[runs[0]] = line;
  else if (runs.length) lines.splice(runs.at(-1) + 1, 0, line);
  else {
    const identity = lines.findIndex(entry => entry.startsWith('- Job ID'));
    if (identity === -1) throw recordError('field-missing', { field: 'Job ID' });
    lines.splice(identity + 1, 0, line);
  }
  return true;
}

/**
 * The record text with the Git-derived fields filled: the candidate, its changed paths and, for an attempt, the commits `base..candidate`.
 * Nothing is returned unless every field can be filled; `filled` lists the labels that changed. Line endings are kept.
 */
export function completeText({ text, kind, candidate, paths, commits, run }) {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/u);
  const labels = COMPLETION_LABELS[kind];
  const filled = [];
  const fill = (label, inline, nested) => { if (fillField(lines, label, inline, nested)) filled.push(label); };
  fill(labels.candidate, candidate, []);
  fill(labels.paths, '', pathLines(paths));
  if (kind === 'attempt') fill(labels.commits, '', commitLines(commits));
  if (run !== undefined && addRun(lines, run)) filled.push('Run:');
  return { text: lines.join(eol), filled };
}
