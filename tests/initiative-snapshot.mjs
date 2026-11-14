import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises';
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
    'I0001/jobs/J002/A001.md': '# Attempt\r\n\r\n- Reported status: running\r\n- Brief path: `.factory\\initiatives\\I0001\\jobs\\J002\\brief-r2.md`\r\n- Requested model/effort: `gpt-6-luna`, high; actual model `claude-opus-5-5`, effort unknown.\r\n- Profile: `.agents\\roles\\worker.md`\r\n- Run: claude agent=a1b2c3\r\n',
    'I0001/jobs/J002/V001.md': '# Review\n\n- Brief: `.factory/initiatives/I0001/jobs/J002/brief-r1.md`\n- Approved model/effort: `openai-codex/gpt-6.1-sol`, medium.\n- Run: claude session=0f9e-77\n- Run: pi child=run_42\n\nStandards PASS / Spec PASS / aggregate PASS.\n',
    'I0001/jobs/J002/V002.md': '# Review\n\nObserver: native `isswf:isswf-reviewer`, model inherited.\n- Run: claude agent=\n- Run: pi agent=x1\n- Run: claude agent=a b\n\nChanges requested on wording.\n',
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
  assert.deepEqual(initiative('I0003'), { id: 'I0003', title: 'unknown', type: 'unknown', status: 'unparsed', planError: { code: 'invalid-plan-type', field: 'Type' }, jobs: [] });

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

  // Run lines: each host form, several per record, CRLF tolerated, malformed lines ignored.
  assert.deepEqual(entry('J002', 'A001').runs, [{ host: 'claude', kind: 'agent', id: 'a1b2c3' }]);
  assert.deepEqual(entry('J002', 'V001').runs, [{ host: 'claude', kind: 'session', id: '0f9e-77' }, { host: 'pi', kind: 'child', id: 'run_42' }]);
  assert.deepEqual(entry('J002', 'V002').runs, []);
  assert.deepEqual(pick(entry('J002', 'V002')), ['review', 'reviewer', 'unknown', 'unknown', 'unknown', 'changes-requested']);

  // A malformed record with no brief degrades to unknown fields; a directory named like a record is ignored.
  assert.equal(jobOf('J003').recordCount, 1);
  assert.deepEqual(jobOf('J003').rounds, [{ round: 'unknown', reviewRound: 1, entries: [{ id: 'V001', kind: 'review', role: 'unknown', model: 'unknown', modelSource: 'unknown', effort: 'unknown', verdict: 'unknown', outcome: 'unknown', runs: [], round: 'unknown', roundSource: 'unknown' }] }]);

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

  // Spanish verdict labels, with markdown emphasis between label and value.
  const verdictOf = async text => (await core.readSnapshot('/es', memoryFs({
    '/es/.isswf/initiatives/I0001/plan.md': plan('I0001', 'Es', job('J001', 'in-progress')),
    '/es/.isswf/initiatives/I0001/jobs/J001/V001.md': text,
  }))).initiatives[0].jobs[0].rounds[0].entries[0].verdict;
  for (const [text, expected] of [
    ['# Revisión\n\nAgregado **FAIL** (Standards PASS).\n', 'changes-requested'],
    ['- AGREGADO: **pass**\n', 'passed'],
    ['**Veredicto:** PASS\n', 'passed'],
    ['Veredicto PASS\nveredicto **FAIL**\n', 'changes-requested'],
    ['Cambios pedidos en la redacción.\n', 'changes-requested'],
    ['Hay cambios solicitados.\n', 'changes-requested'],
  ]) assert.equal(await verdictOf(text), expected, text);

  // Attempt and blocked-review outcomes; an unfilled template line stays unknown.
  const recordOf = async (file, text) => (await core.readSnapshot('/o', memoryFs({
    '/o/.isswf/initiatives/I0001/plan.md': plan('I0001', 'Outcome', job('J001', 'in-progress')),
    '/o/.isswf/initiatives/I0001/jobs/J001/brief-r1.md': 'brief',
    '/o/.isswf/initiatives/I0001/jobs/J001/brief-r2.md': 'brief',
    [`/o/.isswf/initiatives/I0001/jobs/J001/${file}`]: text,
  }))).initiatives[0].jobs[0];
  for (const [file, text, expected] of [
    ['A001.md', '- Reported status: complete (technical; independent review pending)\n', 'passed'],
    ['A001.md', '## Technical result\n\n- Outcome: complete\n', 'passed'],
    ['A001.md', '- **Outcome:** blocked. Missing fixture.\n', 'failed'],
    ['A001.md', '- Outcome: partial\n', 'partial'],
    ['A001.md', '- Reported status: cancelled\n', 'failed'],
    ['A001.md', '- Resultado: fallido\n- Estado: failed\n', 'failed'],
    ['A001.md', '- Outcome: complete, partial, blocked, failed, or cancelled:\n', 'unknown'],
    ['A001.md', '- Reported status: running\n- Outcome: complete\n', 'running'],
    ['V001.md', '- Reported status: blocked\n- Verdict: pass\n', 'failed'],
  ]) assert.equal((await recordOf(file, text)).rounds[0].entries[0].verdict, expected, text);
  assert.equal((await recordOf('A001.md', '- Reported status: cancelled\n')).rounds[0].entries[0].outcome, 'cancelled');
  // Only rounds with records are drawn: r1 has none, the record lands in the latest round.
  assert.deepEqual((await recordOf('A001.md', '- Outcome: complete\n')).rounds.map(r => r.round), [2]);
  // Review rounds within one brief: A00k and V00k share round k; an explicit `Review round:` line wins.
  const roundsOf = async files => (await core.readSnapshot('/o', memoryFs({
    '/o/.isswf/initiatives/I0001/plan.md': plan('I0001', 'Rounds', job('J001', 'in-progress')),
    '/o/.isswf/initiatives/I0001/jobs/J001/brief-r1.md': 'brief',
    ...Object.fromEntries(Object.entries(files).map(([f, t]) => [`/o/.isswf/initiatives/I0001/jobs/J001/${f}`, t])),
  }))).initiatives[0].jobs[0].rounds.map(r => [r.round, r.reviewRound, r.entries.map(e => e.id)]);
  assert.deepEqual(await roundsOf({ 'A001.md': '- Outcome: complete\n', 'V001.md': 'Aggregate: FAIL\n', 'V002.md': 'Aggregate: PASS\n' }), [[1, 1, ['A001', 'V001']], [1, 2, ['V002']]]);
  // A coordinator-owned planner attempt shifts the worker's number; both stay with the first review.
  assert.deepEqual(await roundsOf({ 'A001.md': '- Profile: .agents/roles/planner.md\n', 'A002.md': 'x\n', 'V001.md': 'x\n' }), [[1, 1, ['A001', 'A002', 'V001']]]);
  // A correction attempt states its round; the review template's job-wide field is not read as one.
  assert.deepEqual(await roundsOf({ 'A001.md': 'x\n', 'V001.md': 'x\n', 'A002.md': '- Review round: 2\n', 'V002.md': '- Review round in this job, and prior review IDs: 2 (V001)\n' }), [[1, 1, ['A001', 'V001']], [1, 2, ['A002', 'V002']]]);
  // The attempt template's own line, filled as written, states the round.
  const templateLine = (await readFile(join(process.argv[2] ?? '.', '.factory/templates/attempt.md'), 'utf8')).split('\n').find(l => /review round/i.test(l) && l.startsWith('- '));
  assert.deepEqual(await roundsOf({ 'A001.md': 'x\n', 'V001.md': 'x\n', 'A002.md': `${templateLine} 2\n`, 'V002.md': 'x\n' }), [[1, 1, ['A001', 'V001']], [1, 2, ['A002', 'V002']]]);
  // Two briefs: each brief's first review is its round 1, whatever the job-wide field says.
  const twoBriefs = await core.readSnapshot('/t', memoryFs({
    '/t/.isswf/initiatives/I0001/plan.md': plan('I0001', 'Two', job('J001', 'in-progress')),
    '/t/.isswf/initiatives/I0001/jobs/J001/brief-r1.md': 'b', '/t/.isswf/initiatives/I0001/jobs/J001/brief-r2.md': 'b',
    '/t/.isswf/initiatives/I0001/jobs/J001/A001.md': '- Brief: I0001/jobs/J001/brief-r1.md\n',
    '/t/.isswf/initiatives/I0001/jobs/J001/V001.md': '- Brief: I0001/jobs/J001/brief-r1.md\n- Review round in this job, and prior review IDs: 1\n',
    '/t/.isswf/initiatives/I0001/jobs/J001/A002.md': '- Brief: I0001/jobs/J001/brief-r2.md\n',
    '/t/.isswf/initiatives/I0001/jobs/J001/V002.md': '- Brief: I0001/jobs/J001/brief-r2.md\n- Review round in this job, and prior review IDs: 2 (V001)\n',
  }));
  assert.deepEqual(twoBriefs.initiatives[0].jobs[0].rounds.map(r => [r.round, r.reviewRound, r.entries.map(e => e.id)]), [[1, 1, ['A001', 'V001']], [2, 1, ['A002', 'V002']]]);
  // Roles: the shared role file wins over the host agent that ran it.
  for (const [text, role] of [
    ['- Profile: isswf:isswf-worker; shared role .agents/roles/diagnostician.md\n', 'diagnostician'],
    ['- Profile: `.agents\\roles\\researcher.md`\n', 'researcher'],
    ['- Agent: isswf:isswf-planner\n', 'planner'],
    ['- Profile: .agents/skills/isswf-coordinator/SKILL.md (coordinator acting as writer)\n', 'coordinator'],
    ['- Profile path: coordinator acting as writer\n', 'coordinator'],
    ['- Profile: .agents/roles/worker.md\nNotes: the coordinator skill .agents/skills/isswf-coordinator/SKILL.md dispatched it.\n', 'worker'],
    ['- Profile: isswf:isswf-worker; skills .agents/skills/isswf-coordinator/SKILL.md\n', 'worker'],
    ['- Agent: isswf-worker\n', 'worker'],
    // A review citing another role's file in its body stays a review.
    ['- Observer: isswf:isswf-reviewer\n\nFinding: .agents\\roles\\worker.md:12 drifts.\nSee roles/reviewer.md.\n', 'reviewer'],
    ['Notes: read .agents/roles/worker.md\n', 'worker'],
  ]) assert.equal((await recordOf('A001.md', text)).rounds[0].entries[0].role, role, text);

  // The Node wrapper keeps project-state.mjs's guard and refuses a core selection that disagrees with it.
  if (process.platform !== 'win32') {
    const linked = join(root, 'linked');
    await mkdir(join(root, 'linked-target/initiatives'), { recursive: true });
    await mkdir(linked);
    await symlink(join(root, 'linked-target'), join(linked, '.factory'));
    await assert.rejects(readSnapshot(linked), /Regular directory required/);
  }
  const claimsIsswf = memoryFs({ [join(project, '.isswf/initiatives/I0001/plan.md')]: plan('I0001', 'Claimed', job('J001', 'pending')) });
  await assert.rejects(readSnapshot(project, claimsIsswf), /disagrees/);

  // The cores import only sibling modules and never touch Node globals; the scan covers every static,
  // bare and dynamic import or re-export form with any quote style, since node:vm cannot load ES
  // modules without --experimental-vm-modules.
  for (const name of ['isswf-snapshot-core.mjs', 'isswf-plan-core.mjs', 'isswf-run-usage-core.mjs', 'isswf-prices.mjs', 'token-native-transcript-core.mjs']) {
    const text = readFileSync(join(source, 'tools', name), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
    assert.deepEqual(moduleSpecifiers(text).filter(s => !/^\.\/[\w.-]+\.mjs$/.test(s)), [], name);
    assert.doesNotMatch(text, /\bprocess\b|\bBuffer\b|\brequire\s*\(|\b__(?:dir|file)name\b/, name);
  }
  for (const [label, text] of [['double quotes', 'import { x } from "node:fs";'], ['bare', "import 'node:fs';"], ['re-export', 'export * from `node:path`;'], ['dynamic', 'await import(name);']]) {
    assert.equal(moduleSpecifiers(text).length, 1, label);
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

function moduleSpecifiers(text) {
  return [...text.matchAll(/\b(?:import|export)\b[^;'"`]*?\bfrom\s*(['"`])([^'"`]+)\1|\bimport\s*(['"`])([^'"`]+)\3|\bimport\s*\(\s*(['"`]?)([^'"`)]*)\5/g)].map(m => m[2] ?? m[4] ?? m[6]);
}

function pick(e) {
  return [e.kind, e.role, e.model, e.modelSource, e.effort, e.verdict];
}
