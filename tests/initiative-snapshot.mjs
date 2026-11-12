import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const tool = join(source, 'tools/isswf-snapshot.mjs');
const { readSnapshot, nodeFs } = await import(pathToFileURL(tool).href);
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-snapshot-test-')));

const job = (id, status, extra = {}) => [
  `## ${id}`, '',
  `- Status: ${status}`,
  `- Objective: ${extra.objective ?? `Objective ${id}`}`,
  `- Depends on: ${extra.dependsOn ?? 'None'}`,
  `- Brief: [brief-r1.md](jobs/${id}/brief-r1.md)`,
  '- Blocker: None.',
  `- Next step: ${extra.next ?? 'Continue.'}`, '',
  '### Acceptance', '', '- Works.', '',
  '### Evidence', '', ...(extra.evidence ?? ['- None.']), '',
].join('\n');
const plan = (id, title, ...jobs) => `# ${id}: ${title}\n\nType: enhancement\n\n${jobs.join('\n')}`;

async function files(base, entries) {
  for (const [path, text] of Object.entries(entries)) {
    await mkdir(dirname(join(base, path)), { recursive: true });
    await writeFile(join(base, path), text);
  }
}

try {
  const project = join(root, 'project');
  const state = join(project, '.factory/initiatives');
  await files(state, {
    'I0001/plan.md': plan('I0001', 'Active work',
      job('J001', 'completed', { next: 'None. Closed via PR #12.', evidence: ['- Merged.'] }),
      job('J002', 'in-progress', { dependsOn: 'J001', next: 'Review round for issue #7.', evidence: ['- Mentions closed92 and comment6791096709, not issues.'] }),
      job('J003', 'pending')),
    'I0001/jobs/J002/brief-r1.md': '# r1\n',
    'I0001/jobs/J002/brief-r2.md': '# r2\n',
    'I0001/jobs/J002/brief-r10.md': '# r10\n',
    'I0001/jobs/J002/A001.md': '# Attempt\r\n\r\n- Reported status: running\r\n- Brief path: `.factory\\initiatives\\I0001\\jobs\\J002\\brief-r2.md`\r\n- Requested model/effort: `gpt-6-luna`, high; actual model `claude-opus-5-5`, effort unknown.\r\n- Profile: `.agents\\roles\\worker.md`\r\n',
    'I0001/jobs/J002/V001.md': '# Review\n\n- Brief: `.factory/initiatives/I0001/jobs/J002/brief-r1.md`\n- Approved model/effort: `openai-codex/gpt-6.1-sol`, medium.\n\nStandards PASS / Spec PASS / aggregate PASS.\n',
    'I0001/jobs/J002/V002.md': '# Review\n\nObserver: native `isswf:isswf-reviewer`, model inherited.\n\nChanges requested on wording.\n',
    'I0001/jobs/J003/V001.md': '\u0000\u0001 garbage without structure',
    'I0002/plan.md': plan('I0002', 'Not started', job('J001', 'pending')),
    'I0003/plan.md': 'Not a canonical plan.\n',
    'I0004/plan.md': plan('I0004', 'Done', job('J001', 'completed', { evidence: ['- Done.'] })),
  });
  await mkdir(join(state, 'I0001/jobs/J003/A001.md'), { recursive: true });

  const snapshot = await readSnapshot(project);
  const initiative = id => snapshot.initiatives.find(i => i.id === id);
  const jobOf = id => initiative('I0001').jobs.find(j => j.id === id);
  const entry = (jobId, id) => jobOf(jobId).rounds.flatMap(r => r.entries).find(e => e.id === id);
  const roundOf = (jobId, id) => jobOf(jobId).rounds.find(r => r.entries.some(e => e.id === id)).round;

  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.stateDir, state);
  assert.deepEqual(snapshot.skipped, []);
  assert.equal(initiative('I0004'), undefined, 'completed initiatives are omitted');
  assert.deepEqual(snapshot.unopened, [{ id: 'I0002', title: 'Not started' }]);
  assert.deepEqual(initiative('I0003'), { id: 'I0003', title: 'unknown', type: 'unknown', status: 'unparsed', jobs: [] });

  const active = initiative('I0001');
  assert.equal(active.title, 'Active work');
  assert.equal(active.type, 'enhancement');
  assert.deepEqual(jobOf('J001').prs, [12]);
  assert.deepEqual(jobOf('J002').issues, [7]);
  assert.deepEqual(jobOf('J002').prs, []);
  assert.deepEqual(jobOf('J002').dependsOn, ['J001']);
  assert.deepEqual(jobOf('J002').rounds.map(r => r.round), [1, 2, 10]);

  // Windows-style brief path and CRLF line endings.
  assert.equal(roundOf('J002', 'A001'), 2);
  assert.equal(entry('J002', 'A001').roundSource, 'stated');
  assert.deepEqual(pick(entry('J002', 'A001')), ['attempt', 'worker', 'claude-opus-5-5', 'actual', 'unknown', 'running']);
  assert.equal(roundOf('J002', 'V001'), 1);
  assert.deepEqual(pick(entry('J002', 'V001')), ['review', 'unknown', 'openai-codex/gpt-6.1-sol', 'approved', 'medium', 'passed']);
  assert.equal(roundOf('J002', 'V002'), 10);
  assert.equal(entry('J002', 'V002').roundSource, 'latest');
  assert.deepEqual(pick(entry('J002', 'V002')), ['review', 'reviewer', 'unknown', 'unknown', 'unknown', 'changes-requested']);

  // A malformed record with no brief degrades to unknown fields; a directory named like a record is ignored.
  assert.equal(jobOf('J003').recordCount, 1);
  assert.deepEqual(jobOf('J003').rounds, [{ round: 'unknown', entries: [{ id: 'V001', kind: 'review', role: 'unknown', model: 'unknown', modelSource: 'unknown', effort: 'unknown', verdict: 'unknown', round: 'unknown', roundSource: 'unknown' }] }]);

  // An injected fs that fails one read records it in `skipped` instead of throwing.
  const failing = { ...nodeFs, read: path => path.endsWith('V001.md') && path.includes('J003') ? Promise.reject(Error('denied')) : nodeFs.read(path) };
  const degraded = await readSnapshot(project, failing);
  assert.deepEqual(degraded.skipped, [join(state, 'I0001/jobs/J003/V001.md')]);
  assert.equal(degraded.initiatives.find(i => i.id === 'I0001').jobs.find(j => j.id === 'J003').recordCount, 0);
  const oversizedPath = join(state, 'I0001/jobs/J002/V002.md');
  const oversized = await readSnapshot(project, { ...nodeFs, stat: async path => path === oversizedPath ? { size: 1024 * 1024 + 1 } : nodeFs.stat(path) });
  assert.deepEqual(oversized.skipped, [oversizedPath]);
  assert.equal(oversized.initiatives.find(i => i.id === 'I0001').jobs.find(j => j.id === 'J002').recordCount, 2);

  await assert.rejects(readSnapshot('relative/project'), /absolute/);
  const both = join(root, 'both');
  await mkdir(join(both, '.isswf'), { recursive: true });
  await mkdir(join(both, '.factory'), { recursive: true });
  await assert.rejects(readSnapshot(both), /Both \.isswf and \.factory/);
  const none = join(root, 'none');
  await mkdir(none);
  await assert.rejects(readSnapshot(none), /no \.isswf or \.factory state directory/);
  await mkdir(join(none, '.isswf'));
  await assert.rejects(readSnapshot(none), /no initiatives directory/);

  // The core reads only through the injected fs: an in-memory project absent from disk.
  const core = await import(pathToFileURL(join(source, 'tools/isswf-snapshot-core.mjs')).href);
  const memory = memoryFs({
    '/absent/.isswf/initiatives/I0001/plan.md': plan('I0001', 'In memory', job('J001', 'in-progress')),
    '/absent/.isswf/initiatives/I0001/jobs/J001/brief-r1.md': '# r1\n',
    '/absent/.isswf/initiatives/I0001/jobs/J001/A001.md': '- Brief: `.isswf/initiatives/I0001/jobs/J001/brief-r1.md`\n- Profile: `isswf-worker`\n',
  });
  const fromMemory = await core.readSnapshot('/absent', memory);
  assert.equal(fromMemory.schemaVersion, core.SCHEMA_VERSION);
  assert.equal(fromMemory.stateDir, '/absent/.isswf/initiatives');
  assert.deepEqual(fromMemory.initiatives.map(i => [i.id, i.title, i.jobs[0].recordCount, i.jobs[0].rounds[0].entries[0].role]), [['I0001', 'In memory', 1, 'worker']]);
  const windowsMemory = memoryFs({ 'C:\\absent\\.factory\\initiatives\\I0001\\plan.md': plan('I0001', 'Windows', job('J001', 'in-progress')) });
  assert.equal((await core.readSnapshot('C:\\absent', windowsMemory)).initiatives[0].title, 'Windows');
  await assert.rejects(core.readSnapshot('/absent', memoryFs({ '/absent/.isswf/x': '', '/absent/.factory/x': '' })), /Both \.isswf and \.factory/);

  // Both cores import only sibling modules and never touch Node globals.
  for (const name of ['isswf-snapshot-core.mjs', 'isswf-plan-core.mjs']) {
    const text = readFileSync(join(source, 'tools', name), 'utf8');
    assert.deepEqual([...text.matchAll(/\bfrom\s+'([^']+)'|\bimport\s*\(/g)].map(m => m[1]).filter(s => !s?.startsWith('./')), [], name);
    assert.doesNotMatch(text, /\bprocess\s*\.|\brequire\s*\(/, name);
  }

  const cli = args => spawnSync(process.execPath, [tool, ...args], { encoding: 'utf8', timeout: 15000 });
  const printed = cli(['--project', project]);
  assert.equal(printed.status, 0, printed.stderr);
  assert.deepEqual(JSON.parse(printed.stdout), snapshot);
  assert.equal(cli(['--project', 'relative']).status, 2);
  assert.equal(cli(['--project', 'C:\\project']).status, process.platform === 'win32' ? 1 : 2);
  console.log('initiative snapshot tests passed');
} finally {
  await rm(root, { recursive: true, force: true });
}

function memoryFs(entries) {
  const isDir = path => Object.keys(entries).some(file => file.startsWith(path + (path.includes('\\') ? '\\' : '/')));
  return {
    exists: async path => path in entries || isDir(path),
    list: async path => {
      const sep = path.includes('\\') ? '\\' : '/';
      const names = new Map();
      for (const file of Object.keys(entries).filter(f => f.startsWith(path + sep))) {
        const [name, ...more] = file.slice(path.length + 1).split(sep);
        names.set(name, more.length ? 'dir' : 'file');
      }
      return [...names].map(([name, kind]) => ({ name, kind }));
    },
    stat: async path => ({ size: entries[path].length }),
    read: async path => entries[path],
  };
}

function pick(e) {
  return [e.kind, e.role, e.model, e.modelSource, e.effort, e.verdict];
}
