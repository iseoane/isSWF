// No Node imports and no `process` access, like tools/isswf-plan-edit-core.mjs: a runtime without Node built-ins
// can call these on text. tools/isswf-record-new.mjs is the Node wrapper that reads the files and runs Git.
import { RECORD_NAME } from './isswf-snapshot-core.mjs';

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
