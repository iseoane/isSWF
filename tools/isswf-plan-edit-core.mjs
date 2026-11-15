// No Node imports, as in isswf-plan-core.mjs: a runtime without Node built-ins can call these on plan text.
// Lines keep their own endings, so an edit never touches the bytes of the lines around it.
const linesOf = text => text.split(/(?<=\n)/u);
const content = line => line.replace(/\r?\n$/u, '');
const ending = line => line.slice(content(line).length);
const header = /^## ([A-Z][A-Z0-9-]{0,63})$/u;
const eolOf = text => (text.includes('\r\n') ? '\r\n' : '\n');

// A job runs from its heading to the next job heading.
function locate(lines, job) {
  const start = lines.findIndex(line => content(line) === `## ${job}`);
  const next = lines.findIndex((line, index) => index > start && header.test(content(line)));
  return { start, end: next < 0 ? lines.length : next };
}

function insertAfter(lines, index, added, eol) {
  const open = !lines[index].endsWith('\n');
  if (open) lines[index] += eol;
  lines.splice(index + 1, 0, ...added.map((line, at) => (open && at === added.length - 1 ? line : line + eol)));
}

export function setField(text, { job, field, value }) {
  const lines = linesOf(text), { start, end } = locate(lines, job);
  // Past the first section heading a `- Field:` line is a list item, as the plan parser reads it.
  const section = lines.findIndex((line, index) => index > start && index < end && /^### (Acceptance|Evidence)$/u.test(content(line)));
  const at = lines.findIndex((line, index) => index > start && index < (section < 0 ? end : section) && content(line).startsWith(`- ${field}: `));
  lines[at] = `- ${field}: ${value}${ending(lines[at])}`;
  return lines.join('');
}

export function appendEvidence(text, { job, value }) {
  const lines = linesOf(text), eol = eolOf(text), { start, end } = locate(lines, job);
  const lastContent = (from, to) => { let at = to - 1; while (at > from && !content(lines[at]).trim()) at -= 1; return at; };
  const heading = lines.findLastIndex((line, index) => index > start && index < end && content(line) === '### Evidence');
  if (heading < 0) insertAfter(lines, lastContent(start, end), ['', '### Evidence', '', `- ${value}`], eol);
  else {
    const next = lines.findIndex((line, index) => index > heading && index < end && content(line).startsWith('### '));
    const last = lastContent(heading, next < 0 ? end : next);
    if (last === heading) insertAfter(lines, heading, ['', `- ${value}`], eol);
    else if (last === heading + 2 && content(lines[last]) === '- None.') lines[last] = `- ${value}${ending(lines[last])}`;
    else insertAfter(lines, last, [`- ${value}`], eol);
  }
  return lines.join('');
}

const jobBlock = ({ job, objective, dependsOn, size, nextStep, acceptance }) => [
  `## ${job}`, '', '- Status: pending', `- Size: ${size}`, `- Objective: ${objective}`, `- Depends on: ${dependsOn.length ? dependsOn.join(', ') : 'None'}`,
  `- Brief: [brief-r1.md](jobs/${job}/brief-r1.md) (pending until prepared)`, '- Blocker: None.', `- Next step: ${nextStep}`, '',
  '### Acceptance', '', ...acceptance.map(item => `- ${item}`), '', '### Evidence', '', '- None.',
];

export function addJob(text, spec) {
  const eol = eolOf(text), head = text.endsWith('\n') ? text : text + eol;
  return head + (/\n\r?\n$/u.test(head) ? '' : eol) + jobBlock(spec).map(line => line + eol).join('');
}

export const newPlan = ({ initiative, title, type, ...spec }) => [`# ${initiative}: ${title}`, '', `Type: ${type}`, '', ...jobBlock(spec)].map(line => `${line}\n`).join('');
