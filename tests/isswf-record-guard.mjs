import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const load = name => import(pathToFileURL(join(source, name)));
const { guardRecord } = await load('tools/isswf-record-guard-core.mjs');
const { default: registerGuard } = await load('tools/isswf-record-guard-pi-extension.mjs');

const job = (id, status) => `## ${id}\n\n- Status: ${status}\n- Objective: Synthetic\n- Depends on: None\n- Brief: [brief-r1.md](jobs/${id}/brief-r1.md)\n- Blocker: None.\n- Next step: None.\n\n### Acceptance\n\n- Observable outcome\n\n### Evidence\n\n- None.\n`;
const plan = (...jobs) => `# I0001: Synthetic\n\nType: bug\n\n${jobs.join('\n')}`;
const attemptFields = ['Deviations from required procedure and consequence:', 'Process deviations observed:'];
const reviewFields = ['Unreviewed areas and evidence limits:', 'Convergence advice:', 'Process deviations observed:'];
const record = (runs = [], labels = attemptFields) => `# Report\n\n${runs.map(run => `- Run: ${run}\n`).join('')}\n${labels.map(label => `- ${label} None.\n`).join('')}`;
const lineOf = (text, needle) => text.split('\n').findIndex(line => line.includes(needle)) + 1;

// The in-memory file system behaves like Claude's `$.fs`: it rejects a missing path and lists `{ name, kind }`.
const memoryFs = files => {
  const norm = path => path.replaceAll('\\', '/');
  const calls = { read: [], list: [] };
  return {
    calls,
    read: async path => {
      calls.read.push(path);
      if (!(norm(path) in files)) throw Error('ENOENT');
      return files[norm(path)];
    },
    list: async dir => {
      calls.list.push(dir);
      const prefix = `${norm(dir)}/`;
      const below = Object.keys(files).filter(name => name.startsWith(prefix)).map(name => name.slice(prefix.length));
      if (!below.length) throw Error('ENOENT');
      return [...new Set(below.map(name => name.split('/')[0]))].map(name => ({ name, kind: below.includes(name) ? 'file' : 'dir' }));
    },
  };
};
// Both state roots, each spelled with the separator its platform uses; the tool call names the path as the host does.
const roots = [
  ['/work/project/.factory', '/work/project/.factory'],
  ['/work/project/.isswf', '/work/project/.isswf'],
  ['C:\\work\\project\\.factory', 'C:/work/project/.factory'],
  ['C:\\work\\project\\.isswf', 'C:/work/project/.isswf'],
];
const spelled = (root, path) => (root.includes('\\') ? `${root}\\initiatives\\${path.replaceAll('/', '\\')}` : `${root}/initiatives/${path}`);
const guard = async (root, normalized, path, text, extra = {}) => {
  const fs = memoryFs({ [`${normalized}/initiatives/${path}`]: text, ...extra });
  return guardRecord({ path: spelled(root, path), read: fs.read, list: fs.list });
};

// A plan with a violation is reported with its code, job, field and line; a clean one adds nothing.
const invented = plan(job('J001', 'invented'));
for (const [root, normalized] of roots) {
  const text = await guard(root, normalized, 'I0001/plan.md', invented);
  assert.equal(typeof text, 'string', root);
  for (const part of ['invalid-job', 'J001', 'Status', `line ${lineOf(invented, '- Status:')}`]) assert.ok(text.includes(part), `${root}: ${part}\n${text}`);
  assert.equal(await guard(root, normalized, 'I0001/plan.md', plan(job('J001', 'in-progress'))), undefined, `${root}: clean plan`);
}

// Attempt and review records are checked for the labels and the Run: line.
for (const [root, normalized] of roots) {
  const missing = await guard(root, normalized, 'I0001/jobs/J001/A001.md', record([], ['Process deviations observed:']));
  assert.ok(missing?.includes('missing-field') && missing.includes('Deviations from required procedure and consequence:'), `${root}\n${missing}`);
  const run = await guard(root, normalized, 'I0001/jobs/J001/V001.md', record(['claude agent=a1 (resumed)'], reviewFields));
  assert.ok(run?.includes('run-line-unparsed') && run.includes('line 3'), `${root}\n${run}`);
  assert.equal(await guard(root, normalized, 'I0001/jobs/J001/A001.md', record(['claude agent=a1'])), undefined);
}

// A plan is checked against the files in each job directory, listed through the same injected file system.
for (const [root, normalized] of roots) {
  const text = await guard(root, normalized, 'I0001/plan.md', plan(job('J001', 'pending')), { [`${normalized}/initiatives/I0001/jobs/J001/A001.md`]: record() });
  assert.ok(text?.includes('records-for-unstarted-job') && text.includes('A001.md'), `${root}\n${text}`);
}

// Only the plan and the attempt and review records are read; a brief, other names and other places are not.
for (const path of [
  '/work/project/src/plan.md',
  '/work/project/.factory/initiatives/plan.md',
  '/work/project/.factory/initiatives/I0001/notes.md',
  '/work/project/.factory/initiatives/I0001/jobs/J001/brief-r1.md',
  'C:\\work\\project\\.factory\\initiatives\\I0001\\jobs\\J001\\A1.md',
  '/work/project/.factory/other/I0001/plan.md',
  '/work/project/.factory/initiatives/I0001/jobs/J001/sub/A001.md',
]) {
  const fs = memoryFs({});
  assert.equal(await guardRecord({ path, read: fs.read, list: fs.list }), undefined, path);
  assert.deepEqual(fs.calls, { read: [], list: [] }, `${path} is not read`);
}

// A guard error never surfaces: unreadable files, failing listings and unexpected input resolve to nothing.
const planPath = '/work/project/.factory/initiatives/I0001/plan.md';
for (const [name, call] of [
  ['unreadable', () => guardRecord({ path: planPath, read: async () => { throw Error('EACCES'); }, list: async () => [] })],
  ['listing fails', () => guardRecord({ path: planPath, read: async () => plan(job('J001', 'pending')), list: async () => { throw Error('EACCES'); } })],
  ['read throws synchronously', () => guardRecord({ path: planPath, read: () => { throw Error('boom'); }, list: async () => [] })],
  ['non-text content', () => guardRecord({ path: planPath, read: async () => ({ base64: 'AA==' }), list: async () => [] })],
  ['no path', () => guardRecord({ read: async () => '', list: async () => [] })],
  ['no input', () => guardRecord(undefined)],
]) assert.equal(await call(), undefined, name);
assert.equal(await guardRecord({ path: planPath, read: async () => `${invented}${'x'.repeat(1024 * 1024)}`, list: async () => [] }), undefined, 'a file over 1 MiB is skipped, like the CLI');

// Pi: the extension patches the result of the edit and write tools only.
const temp = await realpath(await mkdtemp(join(tmpdir(), 'isswf-record-guard-')));
try {
  const handlers = [];
  registerGuard({ on: (name, handler) => handlers.push([name, handler]) });
  assert.deepEqual(handlers.map(([name]) => name), ['tool_result'], 'only the result event is used');
  const [[, handler]] = handlers;
  const state = join(temp, '.factory/initiatives/I0001');
  await mkdir(join(state, 'jobs/J001'), { recursive: true });
  const bad = join(state, 'plan.md');
  const good = join(state, 'jobs/J001/A001.md');
  await writeFile(bad, invented);
  await writeFile(good, record(['claude agent=a1']));
  const content = [{ type: 'text', text: 'Successfully replaced 1 block(s).' }];
  const event = (toolName, path, overrides = {}) => ({ type: 'tool_result', toolName, toolCallId: 't1', input: { path }, content, details: { diff: 'd' }, isError: false, ...overrides });
  const ctx = { cwd: temp };

  for (const toolName of ['edit', 'write']) {
    // The forward-slash spelling is the same file on Windows and POSIX.
    for (const path of [bad, bad.replaceAll('\\', '/')]) {
      const patch = await handler(event(toolName, path, { structuredContent: { ok: true } }), ctx);
      assert.equal(patch?.content.length, 2, `${toolName} ${path}`);
      assert.deepEqual(patch.content[0], content[0], 'the original result stays first and unchanged');
      assert.equal(patch.content[1].type, 'text');
      for (const part of ['invalid-job', 'J001', 'Status']) assert.ok(patch.content[1].text.includes(part), `${part}\n${patch.content[1].text}`);
      assert.deepEqual(patch.structuredContent, { ok: true }, 'structured content survives the replaced content');
      assert.ok(!('isError' in patch) && !('details' in patch), 'only the content (and its structure) is patched');
    }
  }
  assert.ok(!('structuredContent' in (await handler(event('write', bad), ctx))), 'no structured content is invented');
  assert.equal(content.length, 1, 'the original content array is not mutated');
  assert.equal(await readFile(bad, 'utf8'), invented, 'the guard never edits the record');
  assert.equal((await handler(event('edit', '.factory/initiatives/I0001/plan.md'), ctx))?.content.length, 2, 'a relative path resolves against the session cwd');

  for (const [name, input, context] of [
    ['clean record', event('write', good), ctx],
    ['read tool', event('read', bad), ctx],
    ['bash tool', event('bash', bad), ctx],
    ['failed edit', event('edit', bad, { isError: true }), ctx],
    ['missing file', event('write', join(state, 'jobs/J001/A009.md')), ctx],
    ['outside the records', event('write', join(temp, 'notes.md')), ctx],
    ['no input', event('write', undefined, { input: undefined }), ctx],
    ['non-string path', event('write', 7), ctx],
    ['no context', event('write', '.factory/initiatives/I0001/plan.md'), undefined],
    ['no event', undefined, ctx],
  ]) assert.equal(await handler(input, context), undefined, name);
} finally {
  await rm(temp, { recursive: true, force: true });
}

// Packaging: the package extension covers the main session; worker and planner children declare theirs, the researcher stays read-only.
const extension = 'tools/isswf-record-guard-pi-extension.mjs';
const manifest = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
assert.deepEqual(manifest.pi.extensions, [`./${extension}`]);
for (const [role, declared] of [['worker', true], ['planner', true], ['researcher', false], ['reviewer', false]]) {
  const profile = await readFile(join(source, `.agents/hosts/pi/agents/isswf-${role}.md`), 'utf8');
  assert.equal(profile.includes(`subagentOnlyExtensions: ../../../../${extension}\n`), declared, role);
}
assert.match(await readFile(join(source, '.agents/hosts/pi/agents/isswf-reviewer.md'), 'utf8'), /^subagentOnlyExtensions: \.\.\/\.\.\/\.\.\/\.\.\/tools\/git-evidence-pi-extension\.mjs$/mu, 'the reviewer keeps its git-evidence extension');

// Claude: the hooks module registers the guard before the opt-in pane returns, so it runs with the pane off.
const hooks = await readFile(join(source, 'hooks/register.tsx'), 'utf8');
const body = hooks.slice(hooks.indexOf('export const register'));
const beforePane = body.slice(0, body.indexOf('options?.initiativesPane !== true'));
assert.ok(hooks.includes('guardRecord(') && beforePane.includes("on('tool.call'"), 'the guard is registered whatever the pane option is');
for (const tool of ['Edit', 'Write', 'MultiEdit']) assert.ok(hooks.includes(`'${tool}'`), tool);
console.log('PASS record guard: shared core, Pi extension, packaging declarations and Claude registration order');
