// No Node imports, as in isswf-plan-core.mjs: a runtime without Node built-ins can call these on plan text.
import { parsePlan, planErrorDetail } from './isswf-plan-core.mjs';

// Lines keep their own endings, so an edit never touches the bytes of the lines around it.
const linesOf = text => text.split(/(?<=\n)/u);
const content = line => line.replace(/\r?\n$/u, '');
const ending = line => line.slice(content(line).length);
const identifier = /^[A-Z][A-Z0-9-]{0,63}$/u;
const header = /^## ([A-Z][A-Z0-9-]{0,63})$/u;
const eolOf = text => (text.includes('\r\n') ? '\r\n' : '\n');
const editableFields = ['Status', 'Blocker', 'Next step'];

export const isIdentifier = value => identifier.test(value);
const editError = (code, where = {}) => Object.assign(Error(code), { code }, where);

/** One line of text that the plan parser reads back verbatim: no control characters, newlines or blank value. */
function oneLine(value, field) {
  if (typeof value !== 'string' || !value.trim() || value.length > 4000 || /[\p{Cc}\u2028\u2029]/u.test(value)) throw editError('invalid-value', { field });
  return value;
}

// An edit starts from a plan that parses and returns one that parses: the parser's error says where a request broke it.
function guarded(text, change) {
  try { parsePlan(text); } catch (error) { throw editError('current-plan-invalid', { planError: planErrorDetail(error) }); }
  const next = change();
  parsePlan(next);
  return next;
}

// A job runs from its heading to the next job heading.
function locate(lines, job) {
  const start = lines.findIndex(line => content(line) === `## ${job}`);
  if (start < 0) throw editError('unknown-job', { job });
  const next = lines.findIndex((line, index) => index > start && header.test(content(line)));
  return { start, end: next < 0 ? lines.length : next };
}

function insertAfter(lines, index, added, eol) {
  const open = !lines[index].endsWith('\n');
  if (open) lines[index] += eol;
  lines.splice(index + 1, 0, ...added.map((line, at) => (open && at === added.length - 1 ? line : line + eol)));
}

export function setField(text, { job, field, value }) {
  if (!editableFields.includes(field)) throw editError('unknown-field', { field });
  oneLine(value, field);
  return guarded(text, () => {
    const lines = linesOf(text), { start, end } = locate(lines, job);
    // Past the first section heading a `- Field:` line is a list item, as the plan parser reads it. The plan parsed, so the field is there.
    const section = lines.findIndex((line, index) => index > start && index < end && /^### (Acceptance|Evidence)$/u.test(content(line)));
    const at = lines.findIndex((line, index) => index > start && index < (section < 0 ? end : section) && content(line).startsWith(`- ${field}: `));
    lines[at] = `- ${field}: ${value}${ending(lines[at])}`;
    return lines.join('');
  });
}

export function appendEvidence(text, { job, value }) {
  oneLine(value, 'Evidence');
  return guarded(text, () => {
    const lines = linesOf(text), eol = eolOf(text), { start, end } = locate(lines, job);
    const lastContent = (from, to) => { let at = to - 1; while (at > from && !content(lines[at]).trim()) at -= 1; return at; };
    const heading = lines.findLastIndex((line, index) => index > start && index < end && content(line) === '### Evidence');
    if (heading < 0) insertAfter(lines, lastContent(start, end), ['', '### Evidence', '', `- ${value}`], eol);
    else {
      const next = lines.findIndex((line, index) => index > heading && index < end && content(line).startsWith('### '));
      const sectionEnd = next < 0 ? end : next, last = lastContent(heading, sectionEnd);
      const items = lines.slice(heading + 1, sectionEnd).filter(line => content(line).trim());
      if (last === heading) insertAfter(lines, heading, ['', `- ${value}`], eol);
      // A lone `- None.` placeholder is replaced, not followed by the evidence.
      else if (items.length === 1 && content(items[0]) === '- None.') lines[last] = `- ${value}${ending(lines[last])}`;
      else insertAfter(lines, last, [`- ${value}`], eol);
    }
    return lines.join('');
  });
}

function jobBlock({ job, objective, dependsOn, size, nextStep, acceptance }) {
  if (!isIdentifier(job)) throw editError('invalid-job-id', { job });
  if (dependsOn.some(dep => !isIdentifier(dep))) throw editError('invalid-dependency', { job, field: 'Depends on' });
  if (!acceptance?.length) throw editError('invalid-value', { field: 'Acceptance' });
  return [
    `## ${job}`, '', '- Status: pending', `- Size: ${oneLine(size, 'Size')}`, `- Objective: ${oneLine(objective, 'Objective')}`, `- Depends on: ${dependsOn.length ? dependsOn.join(', ') : 'None'}`,
    `- Brief: [brief-r1.md](jobs/${job}/brief-r1.md) (pending until prepared)`, '- Blocker: None.', `- Next step: ${oneLine(nextStep, 'Next step')}`, '',
    '### Acceptance', '', ...acceptance.map(item => `- ${oneLine(item, 'Acceptance')}`), '', '### Evidence', '', '- None.',
  ];
}

export function addJob(text, spec) {
  const block = jobBlock(spec);
  return guarded(text, () => {
    const eol = eolOf(text), head = text.endsWith('\n') ? text : text + eol;
    return head + (/\n\r?\n$/u.test(head) ? '' : eol) + block.map(line => line + eol).join('');
  });
}

export function newPlan({ initiative, title, type, ...spec }) {
  if (!isIdentifier(initiative)) throw editError('invalid-initiative');
  const text = [`# ${initiative}: ${oneLine(title, 'title')}`, '', `Type: ${oneLine(type, 'Type')}`, '', ...jobBlock(spec)].map(line => `${line}\n`).join('');
  parsePlan(text);
  return text;
}
