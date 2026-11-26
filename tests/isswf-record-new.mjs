import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, mkdir, mkdtemp, readdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gitFixtureArgs, initRepository } from './support/git-fixture.mjs';

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
    initRepository(project);
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
    assert.deepEqual(checkReferences(prompt), { initiative: 'I0057', job: 'J007', revision: '2', path: '.factory/initiatives/I0057/jobs/J007/brief-r2.md', checkpoint, base });
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
    initRepository(project, ['-b', 'main']);
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
    initRepository(project, ['-b', 'main']);
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

    // A review fills its candidate, REVIEW.md at the base (absent here although the candidate has it), the round and the earlier reviews of the job.
    const review1 = cli('create', { ...reviewArgs, '--run': 'claude session=s-9', '--round': '1' });
    assert.equal(review1.status, 0, JSON.stringify(review1));
    assert.equal(await read('V001.md'), await expected('review.md', {
      'Job ID and review ID:': ' I0001/J001, V001',
      'Run:': ' claude session=s-9',
      'Review round in this job, and prior review IDs:': ' 1; prior reviews: none',
      'Project `REVIEW.md` consumed (path and revision), or absent:': ' absent',
      'Brief path and exact revision:': ` ${brief}, r1, ${checkpoint}`,
      'Base commit SHA:': ` ${base}`,
      'Candidate commit SHA, or reproducible snapshot identity:': ` ${candidate}`,
      'Reviewer profile, model, and effort:': ` .agents/roles/reviewer.md, blob ${blob(checkpoint, '.agents/roles/reviewer.md')}, requested \`haiku\`/\`high\``,
      'Review timestamp:': ' <now>',
    }));
    const review2 = cli('create', { ...reviewArgs, '--id': 'V002', '--round': '2', '--base': candidate, '--candidate': candidate });
    assert.equal(review2.status, 0, JSON.stringify(review2));
    const second = await read('V002.md');
    assert.ok(second.includes('- Review round in this job, and prior review IDs: 2; prior reviews: V001\n'));
    assert.ok(second.includes(`consumed (path and revision), or absent: REVIEW.md, blob ${blob(candidate, 'REVIEW.md')}\n`), 'REVIEW.md is read at the base');
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
    refuse({ ...next, '--job': 'J002', '--brief': brief.replace('J001', 'J002') }, 'job-not-in-progress');
    refuse({ ...next, '--job': 'J003', '--brief': brief.replace('J001', 'J003') }, 'job-not-found');
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
    refuse({ ...next, '--brief': brief.replace('brief-r1', 'brief-r9') }, 'brief-not-found');
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
  // A worker's checkout need not carry the brief or the in-progress plan: `create` reads them at the checkpoint, and refuses when neither the tree nor the checkpoint has them.
  {
    const project = join(root, 'checkpoint-fallback');
    const jobRel = '.factory/initiatives/I0001/jobs/J001';
    const planPath = join(project, '.factory/initiatives/I0001/plan.md');
    const briefPath = join(project, jobRel, 'brief-r1.md');
    await mkdir(join(project, jobRel), { recursive: true });
    initRepository(project, ['-b', 'main']);
    await writeFile(join(project, 'base.txt'), 'base\n');
    git(project, 'add', '-A');
    git(project, 'commit', '-q', '-m', 'bare');
    const bare = git(project, 'rev-parse', 'HEAD');
    // main: the checkpoint marks the job in progress, then a later commit marks it pending again. Each side branch leaves `bare` and is not an ancestor of main.
    const commitPlan = async (text, message) => {
      await mkdir(join(project, jobRel), { recursive: true });
      await writeFile(planPath, text);
      await writeFile(briefPath, '# Brief\n');
      git(project, 'add', '-A');
      git(project, 'commit', '-q', '-m', message);
      return git(project, 'rev-parse', 'HEAD');
    };
    const checkpoint = await commitPlan(planText(), 'checkpoint');
    await commitPlan(planText('pending'), 'later');
    const sideCommit = async (name, text) => {
      git(project, 'checkout', '-q', '-b', name, bare);
      const sha = await commitPlan(text, name);
      git(project, 'checkout', '-q', 'main');
      return sha;
    };
    const sideInProgress = await sideCommit('side-in-progress', planText());
    const sidePending = await sideCommit('side-pending', planText('pending'));
    const sideUnparsable = await sideCommit('side-unparsable', 'not a plan\n');
    const args = (id, at = checkpoint) => ['create', '--project', project, '--initiative', 'I0001', '--job', 'J001', '--kind', 'attempt', '--id', id, '--role', 'worker', '--brief', `${jobRel}/brief-r1.md`, '--checkpoint', at, '--base', bare, '--model', 'sonnet', '--effort', 'medium'];
    const cli = argv => {
      const result = spawnSync(process.execPath, [join(source, 'tools/isswf-record-new.mjs'), ...argv], { encoding: 'utf8', timeout: 30000 });
      return { status: result.status, out: JSON.parse(result.stdout || 'null') };
    };
    const created = (id, at, label) => {
      const done = cli(args(id, at));
      assert.deepEqual([done.status, done.out.ok, done.out.id], [0, true, id], `${label}: ${JSON.stringify(done)}`);
    };
    const refuses = (at, code, label) => {
      const done = cli(args('A003', at));
      assert.deepEqual([done.status, done.out.ok, done.out.code], [1, false, code], `${label}: ${JSON.stringify(done)}`);
    };
    const attempts = async () => (await readdir(join(project, jobRel))).filter(name => /^A\d{3}\.md$/u.test(name)).sort();

    // The brief is only at the checkpoint, and the skeleton is written in the project tree.
    await writeFile(planPath, planText());
    await rm(briefPath);
    created('A001', checkpoint, 'brief only at the checkpoint');
    assert.ok((await readFile(join(project, jobRel, 'A001.md'), 'utf8')).includes(`- Brief path, revision, and input checkpoint (full Git SHA): ${jobRel}/brief-r1.md, r1, ${checkpoint}\n`));
    // The tree's plan lists the job as pending (the branch was cut before the coordinator started it): a checkpoint that is not in the tree's history may start it.
    await writeFile(briefPath, '# Brief\n');
    await writeFile(planPath, planText('pending'));
    created('A002', sideInProgress, 'plan in progress only at a checkpoint outside the tree history');
    // A checkpoint already in the tree's history is older than the tree's plan, so its in-progress plan does not override it.
    refuses(checkpoint, 'job-not-in-progress', 'stale checkpoint');
    // A checkpoint plan that lists the job as pending, or cannot be parsed, grants nothing.
    refuses(sidePending, 'job-not-in-progress', 'checkpoint lists the job pending');
    refuses(sideUnparsable, 'job-not-in-progress', 'checkpoint plan unparsable');
    // A checkpoint that is not a commit is refused as such, before the plan or the brief is looked up.
    refuses('f'.repeat(40), 'commit-not-found', 'checkpoint not a commit');
    // Neither the tree nor the checkpoint has the brief.
    await writeFile(planPath, planText());
    await rm(briefPath);
    refuses(bare, 'brief-not-found', 'neither has the brief');
    assert.deepEqual(await attempts(), ['A001.md', 'A002.md'], 'a refusal creates nothing');
  }
  // `complete` fills the candidate, the changed paths and the commits from Git, and refuses to overwrite what the author wrote.
  {
    const { checkRecord } = await load('isswf-record-check-core.mjs');
    const project = join(root, 'complete');
    const jobRel = '.factory/initiatives/I0001/jobs/J001';
    const jobDir = join(project, jobRel);
    await mkdir(join(project, 'src'), { recursive: true });
    initRepository(project, ['-b', 'main']);
    await writeFile(join(project, 'src/old-ü.txt'), 'old\n');
    await writeFile(join(project, 'README.md'), 'readme\n');
    git(project, 'add', '-A');
    git(project, 'commit', '-q', '-m', 'base');
    const base = git(project, 'rev-parse', 'HEAD');
    git(project, 'switch', '-q', '-c', 'cand');
    git(project, 'mv', 'src/old-ü.txt', 'src/nuevo-ñ.txt');
    await writeFile(join(project, 'README.md'), 'readme changed\n');
    git(project, 'add', '-A');
    git(project, 'commit', '-q', '-m', 'rename');
    const first = git(project, 'rev-parse', 'HEAD');
    await mkdir(join(project, 'tools'));
    await mkdir(join(project, '.isswf/initiatives/I0009'), { recursive: true });
    await mkdir(jobDir, { recursive: true });
    await writeFile(join(project, 'tools/x.mjs'), 'x\n');
    await writeFile(join(project, '.isswf/initiatives/I0009/plan.md'), 'plan\n');
    await writeFile(join(jobDir, 'brief-r1.md'), 'brief\n');
    git(project, 'add', '-A');
    git(project, 'commit', '-q', '-m', 'tool and records');
    const candidate = git(project, 'rev-parse', 'HEAD');
    git(project, 'switch', '-q', 'main');
    await rm(join(project, '.isswf'), { recursive: true, force: true });
    await mkdir(jobDir, { recursive: true });
    await writeFile(join(project, '.factory/initiatives/I0001/plan.md'), planText());
    await writeFile(join(jobDir, 'brief-r1.md'), 'brief\n');

    const cli = (command, args) => {
      const result = spawnSync(process.execPath, [join(source, 'tools/isswf-record-new.mjs'), command, ...Object.entries(args).flat()], { encoding: 'utf8', timeout: 30000 });
      return { status: result.status, out: JSON.parse(result.stdout || 'null'), stderr: result.stderr };
    };
    const target = { '--project': project, '--initiative': 'I0001', '--job': 'J001' };
    const attempt = (id, extra = {}) => {
      const done = cli('create', { ...target, '--kind': 'attempt', '--id': id, '--role': 'worker', '--brief': `${jobRel}/brief-r1.md`, '--checkpoint': base, '--base': base, '--model': 'sonnet', '--effort': 'medium', ...extra });
      assert.equal(done.status, 0, JSON.stringify(done));
    };
    const completeArgs = (record, extra = {}) => ({ ...target, '--record': record, '--candidate': candidate, ...extra });
    const file = name => join(jobDir, name);
    const withNested = (text, label, items) => text.replace(`- ${label}\n`, `- ${label}\n${items.map(item => `  ${item}\n`).join('')}`);
    const changed = ['  - `README.md`', '  - `src/nuevo-ñ.txt`', '  - `src/old-ü.txt`', '  - `tools/x.mjs`', '  - Record paths:', '    - `.factory/initiatives/I0001/jobs/J001/brief-r1.md`', '    - `.isswf/initiatives/I0009/plan.md`'].map(line => line.slice(2));

    // An attempt: the candidate inline, the paths with the record paths apart, and the commits oldest first.
    attempt('A001');
    const created = await readFile(file('A001.md'), 'utf8');
    const done = cli('complete', completeArgs('A001'));
    assert.equal(done.status, 0, JSON.stringify(done));
    assert.deepEqual(done.out, { ok: true, initiative: 'I0001', job: 'J001', record: 'A001', path: file('A001.md'), filled: ['Candidate commit SHA:', 'Changed paths:', 'Resulting artifact paths and checkpoint or commit references:'] });
    let expectedText = created.replace('- Candidate commit SHA:\n', `- Candidate commit SHA: ${candidate}\n`);
    expectedText = withNested(expectedText, 'Changed paths:', changed);
    expectedText = withNested(expectedText, 'Resulting artifact paths and checkpoint or commit references:', ['- Commits (oldest first):', `  - \`${first}\``, `  - \`${candidate}\``]);
    assert.equal(await readFile(file('A001.md'), 'utf8'), expectedText);
    assert.deepEqual(checkRecord({ path: file('A001.md'), text: expectedText }), { ok: true, violations: [] });
    // A second run with the same candidate finds every field filled with that very text and changes nothing.
    assert.equal(cli('complete', completeArgs('A001')).status, 0);
    assert.equal(await readFile(file('A001.md'), 'utf8'), expectedText);

    // A review records its candidate and the paths it reviews, and has no commit list.
    const review = cli('create', { ...target, '--kind': 'review', '--id': 'V001', '--role': 'reviewer', '--brief': `${jobRel}/brief-r1.md`, '--checkpoint': base, '--base': base, '--model': 'haiku', '--effort': 'high' });
    assert.equal(review.status, 0, JSON.stringify(review));
    const reviewCreated = await readFile(file('V001.md'), 'utf8');
    assert.equal(cli('complete', completeArgs('V001')).status, 0);
    assert.equal(await readFile(file('V001.md'), 'utf8'), withNested(reviewCreated.replace('- Candidate commit SHA, or reproducible snapshot identity:\n', `- Candidate commit SHA, or reproducible snapshot identity: ${candidate}\n`), 'Candidate paths reviewed:', changed));

    // A Run line is added after the identity lines, or after the last Run line, once.
    attempt('A002', { '--run': 'claude agent=first', '--round': '2' });
    assert.equal(cli('complete', completeArgs('A002', { '--run': 'claude session=second' })).status, 0);
    assert.equal(cli('complete', completeArgs('A002', { '--run': 'claude session=second' })).status, 0);
    const runs = (await readFile(file('A002.md'), 'utf8')).split('\n').filter(line => line.startsWith('- Run:'));
    assert.deepEqual(runs, ['- Run: claude agent=first', '- Run: claude session=second']);
    attempt('A003');
    assert.equal(cli('complete', completeArgs('A003', { '--run': 'pi child=c-1' })).status, 0);
    assert.ok((await readFile(file('A003.md'), 'utf8')).startsWith('# Attempt report'));
    const lines003 = (await readFile(file('A003.md'), 'utf8')).split('\n');
    assert.equal(lines003[lines003.findIndex(line => line.startsWith('- Job ID and attempt ID:')) + 1], '- Run: pi child=c-1');

    // CRLF records keep their line endings.
    attempt('A004');
    const crlf = (await readFile(file('A004.md'), 'utf8')).replaceAll('\n', '\r\n');
    await writeFile(file('A004.md'), crlf);
    assert.equal(cli('complete', completeArgs('A004')).status, 0);
    const afterCrlf = await readFile(file('A004.md'), 'utf8');
    assert.ok(!/(?<!\r)\n/u.test(afterCrlf), 'every line still ends with CRLF');
    assert.ok(afterCrlf.includes(`- Candidate commit SHA: ${candidate}\r\n`));

    // A field that is no longer the template's text is refused, the whole file stays as it was, and nothing is partly filled.
    const refuseComplete = async (name, change, code, field, extra = {}) => {
      const text = change(await readFile(file(name), 'utf8'));
      await writeFile(file(name), text);
      const refused = cli('complete', completeArgs(name.slice(0, 4), extra));
      assert.deepEqual([refused.status, refused.out.ok, refused.out.code, refused.out.field], [1, false, code, field], `${name} ${code}`);
      assert.equal(await readFile(file(name), 'utf8'), text, `${name} is unchanged`);
    };
    attempt('A005');
    await refuseComplete('A005.md', text => text.replace('- Changed paths:\n', '- Changed paths: by hand\n'), 'field-not-template', 'Changed paths:');
    attempt('A006');
    await refuseComplete('A006.md', text => text.replace('- Candidate commit SHA:\n', `- Candidate commit SHA: ${base}\n`), 'field-not-template', 'Candidate commit SHA:');
    attempt('A007');
    await refuseComplete('A007.md', text => withNested(text, 'Resulting artifact paths and checkpoint or commit references:', ['- by hand']), 'field-not-template', 'Resulting artifact paths and checkpoint or commit references:');
    attempt('A008');
    await refuseComplete('A008.md', text => text.replace('- Changed paths:\n', ''), 'field-missing', 'Changed paths:');
    attempt('A009');
    await refuseComplete('A009.md', text => text.replace(/^- Target codebase base.*$/mu, '- Target codebase base (full Git SHA): unknown'), 'base-not-recorded', undefined);
    attempt('A010');
    await refuseComplete('A010.md', text => text, 'invalid-candidate', undefined, { '--candidate': 'abc' });
    await refuseComplete('A010.md', text => text, 'commit-not-found', 'candidate', { '--candidate': 'f'.repeat(40) });
    await refuseComplete('A010.md', text => text, 'invalid-run', undefined, { '--run': 'claude agent=<id> note' });
    for (const [record, code] of [['B001', 'invalid-record'], ['A1', 'invalid-record'], ['A099', 'record-not-found']]) {
      const refused = cli('complete', completeArgs(record));
      assert.deepEqual([refused.status, refused.out.ok, refused.out.code], [1, false, code], record);
    }

    // A changed path that Markdown code cannot hold faithfully is refused, not written wrongly.
    // The switch brings the committed brief; the untracked copy would be overwritten.
    await rm(join(jobDir, 'brief-r1.md'));
    git(project, 'switch', '-q', '-c', 'odd', candidate);
    await writeFile(join(project, 'we`ird.txt'), 'x\n');
    git(project, 'add', '--', 'we`ird.txt');
    git(project, 'commit', '-q', '-m', 'odd name');
    const odd = git(project, 'rev-parse', 'HEAD');
    git(project, 'switch', '-q', 'main');
    await writeFile(join(jobDir, 'brief-r1.md'), 'brief\n');
    attempt('A011');
    await refuseComplete('A011.md', text => text, 'unsafe-path', 'we`ird.txt', { '--candidate': odd });

    // A record that changes between the read and the replacement is not overwritten.
    const { completeRecord } = await load('isswf-record-new.mjs');
    attempt('A012');
    const racedPath = file('A012.md');
    await assert.rejects(completeRecord({ project, initiative: 'I0001', job: 'J001', record: 'A012', candidate, beforeRename: () => writeFile(racedPath, 'theirs\n') }), { code: 'record-changed' });
    assert.equal(await readFile(racedPath, 'utf8'), 'theirs\n');
    assert.deepEqual((await readdir(jobDir)).filter(name => name.endsWith('.tmp')), [], 'no temporary file is left behind');

    // An accepted launch that returned a run identity (as the coordinator session's note keeps it) must reach the record: `complete` refuses a record without the line and `--run` or an existing line satisfies it. `create` stays open.
    {
      const configDir = join(root, 'claude-config');
      await mkdir(join(configDir, 'isswf/compaction'), { recursive: true });
      const launch = (agent, run) => ({ agent, initiative: 'I0001', job: 'J001', path: `${jobRel}/brief-r1.md`, checkpoint: base, base, ...(run && { run }) });
      const writeNote = launches => writeFile(join(configDir, 'isswf/compaction/s1.json'), JSON.stringify({ version: 1, assignments: launches }));
      const withNote = (command, args) => {
        const result = spawnSync(process.execPath, [join(source, 'tools/isswf-record-new.mjs'), command, ...Object.entries(args).flat()], { encoding: 'utf8', timeout: 30000, env: { ...process.env, CLAUDE_CONFIG_DIR: configDir } });
        return { status: result.status, out: JSON.parse(result.stdout || 'null') };
      };
      await writeNote([launch('isswf:isswf-worker', 'w-run')]);
      attempt('A013');
      assert.equal(withNote('create', { ...target, '--kind': 'attempt', '--id': 'A014', '--role': 'worker', '--brief': `${jobRel}/brief-r1.md`, '--checkpoint': base, '--base': base, '--model': 'sonnet', '--effort': 'medium' }).status, 0, 'create needs no Run line');
      const before = await readFile(file('A013.md'), 'utf8');
      const refused = withNote('complete', completeArgs('A013'));
      assert.equal(refused.status, 1);
      assert.equal(refused.out.code, 'run-line-missing');
      assert.match(JSON.stringify(refused.out), /claude agent=w-run/u);
      assert.match(JSON.stringify(refused.out), /earlier record of this job/u);
      assert.match(JSON.stringify(refused.out), /--run/u);
      assert.equal(await readFile(file('A013.md'), 'utf8'), before, 'a refusal changes nothing');
      assert.equal(withNote('complete', completeArgs('A013', { '--run': 'claude agent=w-run' })).status, 0);
      assert.equal(withNote('complete', completeArgs('A013')).status, 0, 'the existing line satisfies it');
      // Exceptions: a coordinator acting as writer, and a launch with no returned identity.
      // Its own unclaimed launch is open, so only the coordinator exception lets the record through; the whole Profile value names the coordinator skill.
      await writeNote([launch('isswf:isswf-worker', 'c-run')]);
      attempt('A015');
      const profile = '- Profile path and revision, if available:';
      await writeFile(file('A015.md'), (await readFile(file('A015.md'), 'utf8')).split('\n').map(line => (line.startsWith(profile) ? `${profile} .agents/skills/isswf-coordinator/SKILL.md` : line)).join('\n'));
      assert.equal(withNote('complete', completeArgs('A015')).status, 0);
      await writeNote([launch('isswf:isswf-worker')]);
      attempt('A016');
      assert.equal(withNote('complete', completeArgs('A016')).status, 0);
    }
  }
  console.log('isswf-record-new test ok');
} finally {
  await rm(root, { recursive: true, force: true });
}
