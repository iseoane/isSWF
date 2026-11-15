import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gitFixtureArgs } from './support/git-fixture.mjs';

const source = resolve(process.argv[2] || '.');
const load = name => import(pathToFileURL(join(source, 'tools', name)));
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-record-new-')));

const git = (cwd, ...args) => {
  const result = spawnSync('git', gitFixtureArgs(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', ...args]), { cwd, encoding: 'utf8', timeout: 20000 });
  assert.equal(result.status, 0, `git ${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
};

// One job in the plan format the coordinator writes.
const planText = (status = 'in-progress') => ['# I0001: Records', '', 'Type: bug', '', '## J001', '', `- Status: ${status}`, '- Size: S (synthetic)', '- Objective: Records', '- Depends on: None', '- Brief: [brief-r1.md](jobs/J001/brief-r1.md)', '- Blocker: None.', '- Next step: None.', '', '### Acceptance', '', '- Observable outcome', '', '### Evidence', '', '- None.', ''].join('\n');

try {
  // One record-name pattern serves the checker, the guard, the snapshot and the status command: each takes a
  // three-digit A or V name and ignores a name that is too short, too long or in lower case.
  {
    const { checkRecord } = await load('isswf-record-check-core.mjs');
    const { guardRecord } = await load('isswf-record-guard-core.mjs');
    const { readSnapshot, RECORD_NAME } = await load('isswf-snapshot-core.mjs');
    const { status } = await load('isswf-status.mjs');
    const accepted = ['A001.md', 'V999.md'];
    const ignored = ['A1.md', 'A01.md', 'A1000.md', 'a001.md', 'B001.md', 'A001.txt'];

    const project = join(root, 'names');
    const jobDir = join(project, '.factory/initiatives/I0001/jobs/J001');
    await mkdir(jobDir, { recursive: true });
    git(project, 'init', '-q');
    await writeFile(join(project, '.factory/initiatives/I0001/plan.md'), planText());
    await writeFile(join(jobDir, 'brief-r1.md'), '# Brief\n');
    for (const name of [...accepted, ...ignored]) await writeFile(join(jobDir, name), '- Run: claude agent=a1\n');

    for (const name of [...accepted, ...ignored]) {
      // checkRecord reports the missing template fields only for a name it treats as a record.
      const { violations } = checkRecord({ path: `/p/.factory/initiatives/I0001/jobs/J001/${name}`, text: '# empty\n' });
      assert.equal(violations.length > 0, accepted.includes(name), `checkRecord ${name}`);
      // guardRecord reads the file only for a name it treats as a record.
      const report = await guardRecord({ path: `/p/.factory/initiatives/I0001/jobs/J001/${name}`, read: async () => '# empty\n', list: async () => [] });
      assert.equal(report !== undefined, accepted.includes(name), `guardRecord ${name}`);
    }

    // The snapshot and the status command list the same files of the job.
    const fs = {
      list: async dir => (await readdir(dir, { withFileTypes: true })).map(entry => ({ name: entry.name, kind: entry.isDirectory() ? 'dir' : 'file' })),
      stat: path => stat(path),
      read: path => readFile(path, 'utf8'),
      exists: path => access(path).then(() => true, () => false),
    };
    const snapshot = await readSnapshot(project, fs);
    const snapshotNames = snapshot.initiatives[0].jobs[0].rounds.flatMap(round => round.entries.map(entry => `${entry.id}.md`)).sort();
    assert.deepEqual(snapshotNames, accepted, 'snapshot record names');
    const observed = await status({ project, initiative: 'I0001' });
    const statusNames = observed.jobs[0].artifacts.reports.map(report => report.path.split(/[\\/]/u).pop()).sort();
    assert.deepEqual(statusNames, accepted, 'status record names');

    // The pattern is one export that the four users share.
    for (const name of accepted) assert.ok(RECORD_NAME.test(name), `RECORD_NAME ${name}`);
    for (const name of ignored) assert.ok(!RECORD_NAME.test(name), `RECORD_NAME ${name}`);
  }
  // The dispatch guard's reference parser also returns the target base, so the launch data has one parser.
  {
    const { checkReferences } = await load('isswf-dispatch-guard-core.mjs');
    const checkpoint = 'a'.repeat(40);
    const base = 'b'.repeat(40);
    const prompt = `Brief .factory/initiatives/I0057/jobs/J007/brief-r2.md at checkpoint ${checkpoint}, target base ${base}.`;
    assert.equal(typeof checkReferences, 'function', 'the dispatch guard exports its reference parser');
    assert.deepEqual(checkReferences(prompt), { initiative: 'I0057', job: 'J007', revision: '2', checkpoint, base });
  }
  // The exclusive create of the plan editor serves any file: a file that exists, or appears while the temporary file is written, is never replaced.
  {
    const { createExclusive } = await load('isswf-plan-edit.mjs');
    assert.equal(typeof createExclusive, 'function', 'the plan editor exports its exclusive create');
    const dir = join(root, 'exclusive');
    await mkdir(dir);
    const path = join(dir, 'A001.md');
    await createExclusive({ path, text: 'first\n', existsCode: 'record-exists' });
    assert.equal(await readFile(path, 'utf8'), 'first\n');
    await assert.rejects(createExclusive({ path, text: 'second\n', existsCode: 'record-exists' }), { code: 'record-exists' });
    assert.equal(await readFile(path, 'utf8'), 'first\n');
    const raced = join(dir, 'A002.md');
    await assert.rejects(createExclusive({ path: raced, text: 'mine\n', existsCode: 'record-exists', beforeLink: () => writeFile(raced, 'theirs\n') }), { code: 'record-exists' });
    assert.equal(await readFile(raced, 'utf8'), 'theirs\n');
    assert.deepEqual((await readdir(dir)).sort(), ['A001.md', 'A002.md'], 'no temporary file is left behind');
  }
  // A filled template line parses: the Run line has no trailing guidance, and the attempt template has the lines the tool fills.
  {
    const { parseRunLine } = await load('isswf-snapshot-core.mjs');
    for (const name of ['attempt.md', 'review.md']) {
      const text = await readFile(join(source, '.factory/templates', name), 'utf8');
      const runLine = text.split('\n').find(line => line.startsWith('- Run:'));
      assert.deepEqual(parseRunLine(runLine), { host: 'claude', kind: 'agent', id: '<id>' }, `${name} Run line`);
    }
    const attempt = await readFile(join(source, '.factory/templates/attempt.md'), 'utf8');
    for (const label of ['- Branch:', '- Candidate commit SHA:']) assert.ok(attempt.split('\n').includes(label), `attempt template has ${label}`);
  }
  // `next` takes the job's highest number per kind over the working tree, the index, HEAD and every local and remote-tracking branch.
  {
    const project = join(root, 'next');
    const jobRel = '.factory/initiatives/I0001/jobs/J001';
    const jobDir = join(project, jobRel);
    await mkdir(jobDir, { recursive: true });
    git(project, 'init', '-q', '-b', 'main');
    await writeFile(join(project, '.factory/initiatives/I0001/plan.md'), planText());
    await writeFile(join(jobDir, 'brief-r1.md'), '# Brief\n');
    git(project, 'add', '-A');
    git(project, 'commit', '-q', '-m', 'plan');
    const next = (kind, ...extra) => {
      const result = spawnSync(process.execPath, [join(source, 'tools/isswf-record-new.mjs'), 'next', '--project', project, '--initiative', 'I0001', '--job', 'J001', '--kind', kind, ...extra], { encoding: 'utf8', timeout: 30000 });
      assert.equal(result.status, 0, `next ${kind}: ${result.stderr}`);
      return JSON.parse(result.stdout);
    };
    const expectNext = (attempt, review, label) => assert.deepEqual([next('attempt').id, next('review').id], [attempt, review], label);
    const commitFile = (name, message) => { git(project, 'add', '-f', join(jobRel, name)); git(project, 'commit', '-q', '-m', message); };

    expectNext('A001', 'V001', 'a job without records');
    await writeFile(join(jobDir, 'A001.md'), 'x\n');
    expectNext('A002', 'V001', 'the working tree, per kind');
    await writeFile(join(jobDir, 'A002.md'), 'x\n');
    git(project, 'add', join(jobRel, 'A002.md'));
    await rm(join(jobDir, 'A001.md'));
    await rm(join(jobDir, 'A002.md'));
    expectNext('A003', 'V001', 'the index');
    git(project, 'reset', '-q');
    await writeFile(join(jobDir, 'A003.md'), 'x\n');
    commitFile('A003.md', 'a003');
    git(project, 'rm', '-q', '--cached', join(jobRel, 'A003.md'));
    await rm(join(jobDir, 'A003.md'));
    expectNext('A004', 'V001', 'HEAD');
    git(project, 'reset', '-q', '--hard');
    git(project, 'switch', '-q', '-c', 'other');
    await writeFile(join(jobDir, 'A005.md'), 'x\n');
    commitFile('A005.md', 'a005');
    git(project, 'switch', '-q', 'main');
    git(project, 'reset', '-q', '--hard');
    expectNext('A006', 'V001', 'another local branch');
    git(project, 'switch', '-q', '-c', 'work');
    await writeFile(join(jobDir, 'V010.md'), 'x\n');
    commitFile('V010.md', 'v010');
    git(project, 'update-ref', 'refs/remotes/origin/feature', git(project, 'rev-parse', 'work'));
    git(project, 'switch', '-q', 'main');
    git(project, 'branch', '-q', '-D', 'work');
    expectNext('A006', 'V011', 'a remote-tracking branch');
    // A name that is not a record never counts.
    await writeFile(join(jobDir, 'A900-continuation.md'), 'x\n');
    await writeFile(join(jobDir, 'A1000.md'), 'x\n');
    expectNext('A006', 'V011', 'names outside the record pattern');
    // The last number cannot be exceeded.
    await writeFile(join(jobDir, 'A999.md'), 'x\n');
    const full = spawnSync(process.execPath, [join(source, 'tools/isswf-record-new.mjs'), 'next', '--project', project, '--initiative', 'I0001', '--job', 'J001', '--kind', 'attempt'], { encoding: 'utf8', timeout: 30000 });
    assert.equal(full.status, 1);
    assert.deepEqual(JSON.parse(full.stdout), { ok: false, code: 'ids-exhausted' });
    // Bad input is a usage refusal with exit 1.
    for (const [args, code] of [[['--project', 'relative'], 'invalid-project'], [['--kind', 'plan'], 'invalid-kind'], [['--job', 'j 1'], 'invalid-job'], [['--initiative', 'X1'], 'invalid-initiative']]) {
      const base = { '--project': project, '--initiative': 'I0001', '--job': 'J001', '--kind': 'attempt' };
      const merged = Object.entries({ ...base, [args[0]]: args[1] }).flat();
      const refused = spawnSync(process.execPath, [join(source, 'tools/isswf-record-new.mjs'), 'next', ...merged], { encoding: 'utf8', timeout: 30000 });
      assert.equal(refused.status, 1, code);
      assert.deepEqual(JSON.parse(refused.stdout), { ok: false, code }, code);
    }
  }
  // `create` writes the next record from the template with the launch data and Git facts filled, and leaves every other line as the template has it.
  {
    const { checkRecord } = await load('isswf-record-check-core.mjs');
    const { parseRunLine, readSnapshot } = await load('isswf-snapshot-core.mjs');
    const project = join(root, 'create');
    const jobRel = '.factory/initiatives/I0001/jobs/J001';
    const jobDir = join(project, jobRel);
    await mkdir(jobDir, { recursive: true });
    git(project, 'init', '-q', '-b', 'main');
    await writeFile(join(project, 'base.txt'), 'base\n');
    git(project, 'add', '-A');
    git(project, 'commit', '-q', '-m', 'base');
    const base = git(project, 'rev-parse', 'HEAD');
    const twoJobs = `${planText()}\n${planText('pending').split('\n').slice(4).join('\n').replace('## J001', '## J002').replaceAll('jobs/J001', 'jobs/J002')}`;
    await writeFile(join(project, '.factory/initiatives/I0001/plan.md'), twoJobs);
    await writeFile(join(jobDir, 'brief-r1.md'), '# Brief\n');
    await mkdir(join(project, '.agents/roles'), { recursive: true });
    await writeFile(join(project, '.agents/roles/worker.md'), '# Worker\n');
    await writeFile(join(project, '.agents/roles/reviewer.md'), '# Reviewer\n');
    await writeFile(join(project, '.factory/dispatch-selection.json'), '{}\n');
    git(project, 'add', '-A');
    git(project, 'commit', '-q', '-m', 'checkpoint');
    const checkpoint = git(project, 'rev-parse', 'HEAD');
    await writeFile(join(project, 'REVIEW.md'), '# Review guide\n');
    git(project, 'add', '-A');
    git(project, 'commit', '-q', '-m', 'candidate');
    const candidate = git(project, 'rev-parse', 'HEAD');
    const blob = (rev, path) => git(project, 'rev-parse', `${rev}:${path}`);

    const cli = (command, args) => {
      const result = spawnSync(process.execPath, [join(source, 'tools/isswf-record-new.mjs'), command, ...Object.entries(args).flat()], { encoding: 'utf8', timeout: 30000 });
      return { status: result.status, out: JSON.parse(result.stdout || 'null'), stderr: result.stderr };
    };
    const target = { '--project': project, '--initiative': 'I0001', '--job': 'J001' };
    const attemptArgs = { ...target, '--kind': 'attempt', '--id': 'A001', '--role': 'worker', '--brief': `${jobRel}/brief-r1.md`, '--checkpoint': checkpoint, '--base': base, '--model': 'sonnet', '--effort': 'medium' };
    const reviewArgs = { ...target, '--kind': 'review', '--id': 'V001', '--role': 'reviewer', '--brief': `${jobRel}/brief-r1.md`, '--checkpoint': checkpoint, '--base': base, '--model': 'haiku', '--effort': 'high', '--candidate': candidate };

    // The expected record is the template with exactly these lines replaced or removed.
    const expected = async (name, changes) => {
      const used = new Set();
      const lines = (await readFile(join(source, '.factory/templates', name), 'utf8')).split('\n').flatMap(line => {
        const label = Object.keys(changes).find(key => line.startsWith(`- ${key}`));
        if (label === undefined) return [line];
        used.add(label);
        return changes[label] === null ? [] : [`- ${label}${changes[label]}`];
      });
      assert.deepEqual([...used].sort(), Object.keys(changes).sort(), `${name} fields`);
      return lines.join('\n');
    };
    const stamp = text => text.replace(/^(- (?:Report|Review) timestamp(?: and timezone)?: )\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ \(UTC\)$/mu, '$1<now>');
    const read = async name => stamp(await readFile(join(jobDir, name), 'utf8'));

    // An attempt with every optional input.
    const full = cli('create', { ...attemptArgs, '--run': 'claude agent=a1b2c3', '--round': '2', '--checkout': project, '--branch': 'feat/x', '--candidate': candidate });
    assert.equal(full.status, 0, JSON.stringify(full));
    assert.deepEqual(full.out, { ok: true, initiative: 'I0001', job: 'J001', kind: 'attempt', id: 'A001', path: join(jobDir, 'A001.md'), violations: [] });
    const brief = `${jobRel}/brief-r1.md`;
    assert.equal(await read('A001.md'), await expected('attempt.md', {
      'Job ID and attempt ID:': ' I0001/J001, A001',
      'Review round:': ' 2',
      'Run:': ' claude agent=a1b2c3',
      'Report timestamp and timezone:': ' <now>',
      'Brief path, revision, and input checkpoint (full Git SHA):': ` ${brief}, r1, ${checkpoint}`,
      'Plan path and revision, if used:': ` .factory/initiatives/I0001/plan.md, ${checkpoint}`,
      'Profile path and revision, if available:': ` .agents/roles/worker.md, blob ${blob(checkpoint, '.agents/roles/worker.md')}`,
      'Target codebase base (full Git SHA):': ` ${base}`,
      'Exclusive checkout or worktree:': ` ${project}`,
      'Branch:': ' feat/x',
      'Candidate commit SHA:': ` ${candidate}`,
      'Model configuration path and input Git SHA (full SHA):': ` .factory/dispatch-selection.json, blob ${blob(checkpoint, '.factory/dispatch-selection.json')}`,
      'Requested model and effort:': ' `sonnet`/`medium`',
    }));

    // Without the optional inputs the round and Run lines go, the checkout and branch come from the project, and an untracked file is said so.
    // The brief may be given as an absolute path in the platform's own form.
    const minimal = cli('create', { ...attemptArgs, '--id': 'A002', '--role': 'researcher', '--checkpoint': base, '--brief': join(jobDir, 'brief-r1.md') });
    assert.equal(minimal.status, 0, JSON.stringify(minimal));
    assert.equal(await read('A002.md'), await expected('attempt.md', {
      'Job ID and attempt ID:': ' I0001/J001, A002',
      'Review round:': null,
      'Run:': null,
      'Report timestamp and timezone:': ' <now>',
      'Brief path, revision, and input checkpoint (full Git SHA):': ` ${brief}, r1, ${base}`,
      'Plan path and revision, if used:': ` .factory/initiatives/I0001/plan.md, ${base}`,
      'Profile path and revision, if available:': ' .agents/roles/researcher.md, not tracked at the checkpoint',
      'Target codebase base (full Git SHA):': ` ${base}`,
      'Exclusive checkout or worktree:': ` ${project}`,
      'Branch:': ' main',
      'Model configuration path and input Git SHA (full SHA):': ' .factory/dispatch-selection.json, not tracked at the checkpoint',
      'Requested model and effort:': ' `sonnet`/`medium`',
    }));

    // A review fills its candidate, REVIEW.md at the candidate, the round and the earlier reviews of the job.
    const review1 = cli('create', { ...reviewArgs, '--run': 'claude session=s-9', '--round': '1' });
    assert.equal(review1.status, 0, JSON.stringify(review1));
    assert.equal(await read('V001.md'), await expected('review.md', {
      'Job ID and review ID:': ' I0001/J001, V001',
      'Run:': ' claude session=s-9',
      'Review round in this job, and prior review IDs:': ' 1; prior reviews: none',
      'Project `REVIEW.md` consumed (path and revision), or absent:': ` REVIEW.md, blob ${blob(candidate, 'REVIEW.md')}`,
      'Brief path and exact revision:': ` ${brief}, r1, ${checkpoint}`,
      'Base commit SHA:': ` ${base}`,
      'Candidate commit SHA, or reproducible snapshot identity:': ` ${candidate}`,
      'Reviewer profile, model, and effort:': ` .agents/roles/reviewer.md, blob ${blob(checkpoint, '.agents/roles/reviewer.md')}, requested \`haiku\`/\`high\``,
      'Review timestamp:': ' <now>',
    }));
    const review2 = cli('create', { ...reviewArgs, '--id': 'V002', '--round': '2', '--candidate': base });
    assert.equal(review2.status, 0, JSON.stringify(review2));
    const second = await read('V002.md');
    assert.ok(second.includes('- Review round in this job, and prior review IDs: 2; prior reviews: V001\n'));
    assert.ok(second.includes('consumed (path and revision), or absent: absent\n'), 'REVIEW.md is absent at that candidate');
    assert.ok(!second.includes('- Run: claude agent=<id>'), 'an unknown run leaves no Run line');

    // Every created record is clean for the checker, has a Run line the pane accepts and a model and effort the pane reads.
    for (const name of ['A001.md', 'A002.md', 'V001.md', 'V002.md']) {
      const text = await readFile(join(jobDir, name), 'utf8');
      assert.deepEqual(checkRecord({ path: join(jobDir, name), text }), { ok: true, violations: [] }, name);
    }
    assert.deepEqual(parseRunLine('- Run: claude agent=a1b2c3'), { host: 'claude', kind: 'agent', id: 'a1b2c3' });
    const api = {
      list: async dir => (await readdir(dir, { withFileTypes: true })).map(entry => ({ name: entry.name, kind: entry.isDirectory() ? 'dir' : 'file' })),
      stat: path => stat(path),
      read: path => readFile(path, 'utf8'),
      exists: path => access(path).then(() => true, () => false),
    };
    const entries = (await readSnapshot(project, api)).initiatives[0].jobs[0].rounds.flatMap(round => round.entries);
    const a001 = entries.find(entry => entry.id === 'A001');
    assert.deepEqual([a001.model, a001.modelSource, a001.effort, a001.runs], ['sonnet', 'requested', 'medium', [{ host: 'claude', kind: 'agent', id: 'a1b2c3' }]]);
    assert.equal(a001.role, 'worker');

    // Refusals leave no file behind.
    const before = (await readdir(jobDir)).sort();
    const refuse = (args, code, field) => {
      const done = cli('create', args);
      assert.deepEqual([done.status, done.out.ok, done.out.code, done.out.field], [1, false, code, field], JSON.stringify(args));
    };
    const next = { ...attemptArgs, '--id': 'A003' };
    refuse({ ...next, '--id': 'A009' }, 'id-not-next');
    refuse({ ...next, '--id': 'A001' }, 'id-not-next');
    refuse({ ...next, '--id': 'V003' }, 'invalid-id');
    refuse({ ...next, '--kind': 'review', '--id': 'A003' }, 'invalid-id');
    refuse({ ...next, '--role': 'reviewer' }, 'invalid-role');
    refuse({ ...reviewArgs, '--id': 'V003', '--role': 'worker' }, 'invalid-role');
    refuse({ ...next, '--job': 'J002' }, 'job-not-in-progress');
    refuse({ ...next, '--job': 'J003' }, 'job-not-found');
    for (const flag of ['checkpoint', 'base', 'candidate']) {
      for (const bad of ['abc123', 'A'.repeat(40), 'a'.repeat(39), `${'a'.repeat(40)}0`]) refuse({ ...next, [`--${flag}`]: bad }, `invalid-${flag}`);
      refuse({ ...next, [`--${flag}`]: 'f'.repeat(40) }, 'commit-not-found', flag);
    }
    refuse({ ...next, '--model': 'two words' }, 'invalid-model');
    refuse({ ...next, '--effort': '' }, 'invalid-effort');
    refuse({ ...next, '--run': 'claude agent=<id> note' }, 'invalid-run');
    refuse({ ...next, '--round': '0' }, 'invalid-round');
    refuse({ ...next, '--brief': '.factory/initiatives/I0001/jobs/J002/brief-r1.md' }, 'invalid-brief');
    refuse({ ...next, '--brief': '../outside/brief-r1.md' }, 'invalid-brief');
    refuse({ ...next, '--checkout': 'relative' }, 'invalid-checkout');
    refuse({ ...next, '--branch': 'two words' }, 'invalid-branch');
    assert.deepEqual((await readdir(jobDir)).sort(), before, 'a refusal creates nothing');

    // A record that appears between the check and the publication is not replaced.
    const { createRecord } = await load('isswf-record-new.mjs');
    const racer = join(jobDir, 'A003.md');
    await assert.rejects(createRecord({ project, initiative: 'I0001', job: 'J001', kind: 'attempt', id: 'A003', role: 'worker', brief, checkpoint, base, model: 'sonnet', effort: 'medium', beforeLink: () => writeFile(racer, 'theirs\n') }), { code: 'record-exists' });
    assert.equal(await readFile(racer, 'utf8'), 'theirs\n');
    assert.deepEqual((await readdir(jobDir)).filter(name => name.endsWith('.tmp')), [], 'no temporary file is left behind');
  }
  console.log('isswf-record-new test ok');
} finally {
  await rm(root, { recursive: true, force: true });
}
