import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdir, mkdtemp, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { isAbsolute, resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { sha256Hex } = await import(pathToFileURL(join(source, 'tools/isswf-handoff-core.mjs')));

// The pure-JavaScript SHA-256 the dispatch guard uses on both hosts: the published test vectors, then node:crypto on every length around the block edges.
{
  const text = value => new TextEncoder().encode(value);
  assert.equal(sha256Hex(text('')), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  assert.equal(sha256Hex(text('abc')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  assert.equal(sha256Hex(text('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  assert.equal(sha256Hex(new Uint8Array(1_000_000).fill(0x61)), 'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0');
  for (let length = 0; length <= 200; length += 1) {
    const bytes = randomBytes(length);
    assert.equal(sha256Hex(bytes), createHash('sha256').update(bytes).digest('hex'), `length ${length}`);
  }
  const bigger = randomBytes(5 * 1024 * 1024 + 3);
  assert.equal(sha256Hex(bigger), createHash('sha256').update(bigger).digest('hex'), 'a diff the size of the hook read limit');
}

const temp = await realpath(await mkdtemp(join(tmpdir(), 'isswf-handoff-')));
const git = (cwd, ...args) => {
  const result = spawnSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=false', ...args], { cwd, encoding: 'utf8', timeout: 30000, maxBuffer: 64 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};
const tool = (args, env = {}) => {
  const result = spawnSync(process.execPath, [join(source, 'tools/isswf-handoff.mjs'), ...args], { encoding: 'utf8', timeout: 60000, maxBuffer: 16 * 1024 * 1024, env: { ...process.env, ...env } });
  assert.ifError(result.error);
  return { ...JSON.parse(result.stdout), exitCode: result.status };
};
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const job = (id, status) => `## ${id}\n\n- Status: ${status}\n- Objective: Synthetic\n- Depends on: None\n- Brief: [brief-r1.md](jobs/${id}/brief-r1.md)\n- Blocker: None.\n- Next step: None.\n\n### Acceptance\n\n- Observable outcome\n\n### Evidence\n\n- None.\n`;
const plan = status => `# I0001: Synthetic\n\nType: bug\n\n${job('J001', status)}`;
const BRIEF = '.factory/initiatives/I0001/jobs/J001/brief-r1.md';
const RESOURCES = ['.agents/roles/reviewer.md', '.agents/skills/isswf-review/SKILL.md', '.agents/roles/references/review.md', '.agents/roles/references/review-convergence.md', '.agents/hosts/claude-code.md'];
const selection = { schemaVersion: 1, agents: { claude: { 'isswf:isswf-reviewer': { model: 'opus', effort: 'medium' }, 'isswf-reviewer': { model: 'opus', effort: 'medium' } }, pi: {} } };

try {
  // A project whose base commit holds the records and the review resources, and whose candidate changes text, binary and non-UTF-8 files.
  const root = join(temp, 'project');
  const write = async (path, content) => {
    await mkdir(join(root, path, '..'), { recursive: true });
    await writeFile(join(root, path), content);
  };
  await mkdir(root);
  git(root, 'init', '-q', '-b', 'main', '.');
  await write('.factory/initiatives/I0001/plan.md', plan('in-progress'));
  await write(BRIEF, '# brief\n');
  await write('.factory/initiatives/I0001/jobs/J001/V001.md', '# earlier review\n');
  await write('.factory/dispatch-selection.json', JSON.stringify(selection));
  await write('REVIEW.md', '# review guide\n');
  for (const path of RESOURCES) await write(path, `# ${path}\n`);
  await write('src/a.txt', 'one\ntwo\n');
  await write('src/gone.txt', 'removed later\n');
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'base');
  const base = git(root, 'rev-parse', 'HEAD');
  await write('src/mid.txt', 'between\n');
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'between');
  const mid = git(root, 'rev-parse', 'HEAD');
  await write('src/a.txt', 'one\ntwo changed\nthree\n');
  await write('src/binary.bin', Buffer.from(Array.from({ length: 512 }, (_, i) => i % 256)));
  await write('src/latin1.txt', Buffer.from([0x63, 0x61, 0x66, 0xe9, 0x0a]));
  await rm(join(root, 'src/gone.txt'));
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'candidate');
  const candidate = git(root, 'rev-parse', 'HEAD');
  const checkpoint = candidate;
  const out = join(temp, 'out');
  const review = (extra = [], overrides = {}) => {
    const flags = { '--project': root, '--initiative': 'I0001', '--job': 'J001', '--brief': BRIEF, '--checkpoint': checkpoint, '--base': base, '--candidate': candidate, '--out': out, ...overrides };
    return tool(['review', ...Object.entries(flags).flatMap(([flag, value]) => (value === undefined ? [] : [flag, value])), ...extra]);
  };

  // The handoff names the diff, its length and digest, and the files hold what the envelope says.
  const made = review();
  assert.equal(made.ok, true, JSON.stringify(made));
  assert.equal(made.exitCode, 0);
  const diffFile = join(out, `J001-${candidate.slice(0, 12)}.diff`);
  const handoffFile = join(out, `J001-${candidate.slice(0, 12)}.handoff.json`);
  assert.equal(resolve(made.handoff.path), resolve(handoffFile));
  const diffBytes = await readFile(diffFile);
  const handoffBytes = await readFile(handoffFile);
  assert.equal(made.handoff.sha256, sha256(handoffBytes));
  assert.equal(made.handoff.bytes, handoffBytes.length);
  const envelope = JSON.parse(handoffBytes.toString('utf8'));
  assert.deepEqual(made.envelope, envelope, 'the command prints the envelope it wrote');
  assert.equal(envelope.schema, 'isswf.handoff/1');
  assert.deepEqual([envelope.initiative, envelope.job, envelope.base, envelope.candidate], ['I0001', 'J001', base, candidate]);
  assert.equal(resolve(envelope.diff.path), resolve(diffFile));
  assert.equal(envelope.diff.bytes, diffBytes.length);
  assert.equal(envelope.diff.sha256, sha256(diffBytes));
  for (const flag of ['--no-color', '--no-ext-diff', '--no-textconv', '--binary', '--full-index', `--attr-source=${candidate}`]) assert.ok(envelope.diff.argv.includes(flag), flag);
  assert.deepEqual(made.promptLines, [`handoff: ${made.handoff.path}`, `handoff-sha256: ${made.handoff.sha256}`, `candidate ${candidate}`]);

  // The diff is the exact base..candidate change: applied to the base tree it reproduces the candidate tree, binary and non-UTF-8 files included.
  {
    const check = join(temp, 'apply');
    git(root, 'worktree', 'add', '-q', '--detach', check, base);
    git(check, 'apply', '--index', '--binary', diffFile);
    assert.equal(git(check, 'write-tree'), git(root, 'rev-parse', `${candidate}^{tree}`));
    git(root, 'worktree', 'remove', '--force', check);
  }

  // The brief, the review guide, the round and the reviewer come from the records, the candidate and the selection file.
  assert.deepEqual(envelope.brief, { path: BRIEF, revision: '1', checkpoint, blob: git(root, 'rev-parse', `${checkpoint}:${BRIEF}`) });
  assert.deepEqual(envelope.reviewGuide, { path: 'REVIEW.md', blob: git(root, 'rev-parse', `${candidate}:REVIEW.md`) });
  assert.equal(envelope.round, 2);
  assert.deepEqual(envelope.priorReviews, ['V001']);
  assert.deepEqual(envelope.reviewer, { host: 'claude', agent: 'isswf:isswf-reviewer', model: 'opus', effort: 'medium' });
  assert.deepEqual(envelope.resources.map(resource => resource.path), RESOURCES);
  for (const resource of envelope.resources) {
    assert.equal(resource.blob, git(root, 'rev-parse', `${checkpoint}:${resource.path}`), resource.path);
    assert.equal(resolve(resource.absolutePath), join(source, ...resource.path.split('/')), 'resolved from the factory root that holds the tool');
  }
  const elsewhere = join(temp, 'out-prior');
  assert.deepEqual(review(['--prior', 'V001', 'V002'], { '--out': elsewhere }).envelope.priorReviews, ['V001', 'V002']);
  assert.equal(review(['--prior', 'V001', 'V002'], { '--out': elsewhere }).envelope.round, 3);

  const refuses = (result, code) => {
    assert.equal(result.ok, false, JSON.stringify(result));
    assert.equal(result.exitCode, 1);
    assert.equal(result.code, code, JSON.stringify(result));
  };
  // Running it again with the same arguments is harmless; a different base for the same candidate never overwrites the first handoff.
  assert.deepEqual(review().handoff, made.handoff);
  refuses(review([], { '--base': mid }), 'handoff-exists');
  // The handoff file is write-once too: other bytes for the same candidate are refused and the first file stays.
  refuses(review(['--prior', 'V001', 'V002']), 'handoff-exists');
  assert.deepEqual(await readFile(handoffFile), handoffBytes, 'the first handoff is unchanged');

  // Refusals leave nothing written and name the cause.
  refuses(review([], { '--candidate': candidate.slice(0, 12) }), 'invalid-candidate');
  refuses(review([], { '--candidate': candidate.toUpperCase() }), 'invalid-candidate');
  refuses(review([], { '--base': `${base}0` }), 'invalid-base');
  refuses(review([], { '--checkpoint': 'HEAD' }), 'invalid-checkpoint');
  refuses(review([], { '--candidate': 'c3'.repeat(20) }), 'commit-not-found');
  refuses(review([], { '--base': candidate, '--candidate': base }), 'candidate-not-descendant');
  refuses(review([], { '--base': candidate, '--candidate': candidate }), 'diff-empty');
  refuses(review([], { '--brief': '.factory/initiatives/I0001/jobs/J001/brief-r2.md' }), 'brief-not-found');
  refuses(review([], { '--job': 'J002', '--brief': '.factory/initiatives/I0001/jobs/J002/brief-r1.md' }), 'job-not-found');
  refuses(review([], { '--out': join(root, 'handoffs') }), 'out-inside-project');
  refuses(review([], { '--out': join(root, 'src', '..', 'src') }), 'out-inside-project');
  refuses(review([], { '--out': 'relative' }), 'invalid-out');
  refuses(review(['--host', 'pi']), 'reviewer-selection-missing');
  refuses(tool(['review', '--project', root]), 'usage');
  refuses(tool(['frobnicate']), 'usage');
  await assert.rejects(stat(join(root, 'handoffs')), 'a refused --out is not created inside the project');
  await write('.factory/initiatives/I0001/plan.md', plan('pending'));
  refuses(review(), 'job-not-in-progress');
  await write('.factory/initiatives/I0001/plan.md', plan('in-progress'));

  // The default directory is the OS temporary directory, and a diff the Claude hook cannot read (4 MiB) is refused at generation.
  {
    const scratch = join(temp, 'tmp');
    await mkdir(scratch);
    const env = { TMPDIR: scratch, TMP: scratch, TEMP: scratch };
    const viaTemp = tool(['review', '--project', root, '--initiative', 'I0001', '--job', 'J001', '--brief', BRIEF, '--checkpoint', checkpoint, '--base', base, '--candidate', candidate], env);
    assert.equal(viaTemp.ok, true, JSON.stringify(viaTemp));
    assert.ok(isAbsolute(viaTemp.handoff.path) && viaTemp.handoff.path.startsWith(scratch), viaTemp.handoff.path);
    await write('src/huge.txt', randomBytes(3 * 1024 * 1024).toString('hex'));
    git(root, 'add', '-A');
    git(root, 'commit', '-qm', 'huge');
    const huge = git(root, 'rev-parse', 'HEAD');
    refuses(review([], { '--candidate': huge, '--checkpoint': huge }), 'diff-too-large');
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}

// The unreviewed-commit check, with real Git: a linear history read at different heads.
const coverTemp = await realpath(await mkdtemp(join(tmpdir(), 'isswf-coverage-')));
try {
  const repo = join(coverTemp, 'repo');
  await mkdir(repo);
  git(repo, 'init', '-q', '-b', 'main', '.');
  const jobDir = job => `.factory/initiatives/I0001/jobs/${job}`;
  const commit = async (files, message) => {
    for (const [path, content] of Object.entries(files)) {
      await mkdir(join(repo, path, '..'), { recursive: true });
      if (content === null) await rm(join(repo, path));
      else await writeFile(join(repo, path), content);
    }
    git(repo, 'add', '-A');
    git(repo, 'commit', '-qm', message);
    return git(repo, 'rev-parse', 'HEAD');
  };
  // A review covers the commits from its base to its candidate; the base defaults to the start of the range.
  let reviewBase;
  const reviewText = (candidate, extra = '', base = reviewBase) => `# review\n\n- Base commit SHA: ${base}\n- Candidate commit SHA, or reproducible snapshot identity: ${candidate}\n${extra}`;
  const override = (...shas) => `- Coordinator override, recorded afterwards by the coordinator and never written into the verdicts above: the coordinator applied ${shas.join(' and ')} itself.\n`;
  // J003 was reviewed before this range began, and the range changes none of its records.
  const start = await commit({ 'README.md': 'start\n', [`${jobDir('J003')}/V001.md`]: reviewText('0'.repeat(40), '', '0'.repeat(40)), '.factory/initiatives/I0001/plan.md': plan('in-progress') }, 'main');
  reviewBase = start;
  git(repo, 'update-ref', 'refs/remotes/origin/main', start);
  const feature = await commit({ 'src/x.mjs': 'export const x = 1;\n' }, 'feature');
  const reviewed = await commit({ [`${jobDir('J001')}/V001.md`]: reviewText(feature) }, 'records: V001');
  const check = (head, extra = []) => tool(['coverage', '--project', repo, '--base', start, '--head', head, ...extra]);
  const jobOf = (result, name = 'J001') => result.jobs.find(entry => entry.job === name);

  // Records after the reviewed candidate need no review, and a job whose records the range does not touch is not read.
  const clean = check(reviewed);
  assert.equal(clean.ok, true, JSON.stringify(clean));
  assert.equal(clean.exitCode, 0);
  assert.deepEqual(clean.jobs.map(entry => [entry.job, entry.record, entry.candidate, entry.uncovered]), [['J001', 'V001', feature, []]]);
  const records = await commit({ [`${jobDir('J001')}/A001.md`]: '# attempt\n', '.factory/initiatives/I0001/plan.md': plan('in-review') }, 'records: attempt and plan');
  assert.equal(check(records).ok, true, 'a records-only commit after the candidate');

  // The PR322 shape: commits that change a test after the reviewed candidate, with no later review.
  const first = await commit({ 'tests/state-interruption.mjs': 'one\n' }, 'test: first');
  const second = await commit({ 'tests/state-interruption.mjs': 'two\n', [`${jobDir('J001')}/A002.md`]: '# attempt\n' }, 'test: second');
  const failed = check(second);
  assert.equal(failed.ok, false, JSON.stringify(failed));
  assert.equal(failed.exitCode, 1);
  assert.equal(failed.code, 'unreviewed-commits');
  assert.deepEqual(jobOf(failed).uncovered, [{ commit: first, paths: ['tests/state-interruption.mjs'] }, { commit: second, paths: ['tests/state-interruption.mjs'] }]);
  // A later review of a later candidate covers them; the first review stays in the record.
  const secondReview = await commit({ [`${jobDir('J001')}/V002.md`]: reviewText(second) }, 'records: V002');
  const covered = check(secondReview);
  assert.equal(covered.ok, true, JSON.stringify(covered));
  assert.equal(jobOf(covered).record, 'V002');

  // The J007 case: a documentation-only commit named in a coordinator override passes, and only then.
  const docs = await commit({ 'docs/en/operations.md': 'a\n', 'docs/es/operations.md': 'b\n', 'GLOSSARY.md': 'g\n' }, 'docs: fix');
  assert.equal(check(docs).ok, false, 'a documentation commit without an override');
  const named = await commit({ [`${jobDir('J001')}/V002.md`]: reviewText(second, override(docs)) }, 'records: override');
  const passed = check(named);
  assert.equal(passed.ok, true, JSON.stringify(passed));
  assert.deepEqual(jobOf(passed).overridden, [{ commit: docs, paths: ['GLOSSARY.md', 'docs/en/operations.md', 'docs/es/operations.md'] }]);
  const short = await commit({ [`${jobDir('J001')}/V002.md`]: reviewText(second, override(docs.slice(0, 9))) }, 'records: abbreviated override');
  assert.equal(check(short).ok, true, 'an abbreviated SHA of at least seven characters names the commit');
  const tooShort = await commit({ [`${jobDir('J001')}/V002.md`]: reviewText(second, override(docs.slice(0, 5))) }, 'records: too short');
  assert.equal(check(tooShort).ok, false, 'a five-character prefix does not name a commit');

  // An override never excuses a commit that changes code, tests or agent instructions, even when it also changes documentation.
  const refused = [];
  for (const [files, label] of [[{ 'tools/x.mjs': 'x\n' }, 'code'], [{ '.agents/skills/x/SKILL.md': 's\n' }, 'agent instructions'], [{ 'docs/en/a.md': 'a\n', 'src/y.mjs': 'y\n' }, 'documentation with code']]) {
    const mixed = await commit(files, `mixed ${label}`);
    refused.push(mixed);
    const excused = await commit({ [`${jobDir('J001')}/V002.md`]: reviewText(second, override(docs, ...refused)) }, `records: override ${label}`);
    const result = check(excused);
    assert.equal(result.ok, false, label);
    assert.deepEqual(jobOf(result).uncovered.map(entry => entry.commit), refused, label);
  }

  // A candidate that is not in the branch's history leaves every commit unreviewed.
  const orphan = await commit({ [`${jobDir('J001')}/V003.md`]: reviewText('1'.repeat(40)) }, 'records: V003 for another history');
  const lost = check(orphan);
  assert.equal(lost.ok, false);
  assert.ok(jobOf(lost).uncovered.some(entry => entry.commit === feature), 'the feature commit counts as unreviewed');

  // A job without any review, an initiative or job filter, and the default base from origin/main.
  const none = await commit({ [`${jobDir('J002')}/brief-r1.md`]: '# brief\n', 'src/z.mjs': 'z\n' }, 'brief and code for a job without reviews');
  const all = check(none);
  assert.deepEqual(all.skipped, [{ initiative: 'I0001', job: 'J002', reason: 'no-review' }]);
  assert.equal(check(none, ['--job', 'J002']).exitCode, 0, 'the filter leaves out the failing job');
  assert.equal(check(none, ['--initiative', 'I0001', '--job', 'J001']).exitCode, 1);
  const byDefault = tool(['coverage', '--project', repo]);
  assert.equal(byDefault.base, start, 'the default base is the merge base with origin/main');
  assert.equal(byDefault.head, none);
  assert.equal(byDefault.ok, all.ok);
  git(repo, 'update-ref', '-d', 'refs/remotes/origin/main');
  assert.equal(tool(['coverage', '--project', repo]).code, 'base-not-found');
  assert.equal(tool(['coverage', '--project', repo, '--base', 'main~0']).code, 'invalid-base');
  assert.equal(tool(['coverage']).code, 'usage');

  // Two jobs in one range: a commit that a later job's review covers is not unreviewed for the earlier job.
  const pair = join(coverTemp, 'pair');
  await mkdir(pair);
  git(pair, 'init', '-q', '-b', 'main', '.');
  const keep = async (files, message) => {
    for (const [path, content] of Object.entries(files)) {
      await mkdir(join(pair, path, '..'), { recursive: true });
      await writeFile(join(pair, path), content);
    }
    git(pair, 'add', '-A');
    git(pair, 'commit', '-qm', message);
    return git(pair, 'rev-parse', 'HEAD');
  };
  const pairBase = await keep({ 'README.md': 'start\n', '.factory/initiatives/I0001/plan.md': plan('in-progress') }, 'main');
  const codeOne = await keep({ 'src/one.mjs': 'one\n' }, 'job one code');
  await keep({ [`${jobDir('J001')}/V001.md`]: reviewText(codeOne, '', pairBase) }, 'records: J001 V001');
  const codeTwo = await keep({ 'src/two.mjs': 'two\n' }, 'job two code');
  const reviewTwo = await keep({ [`${jobDir('J002')}/V001.md`]: reviewText(codeTwo, '', pairBase) }, 'records: J002 V001');
  const both = tool(['coverage', '--project', pair, '--base', pairBase, '--head', reviewTwo]);
  assert.equal(both.ok, true, JSON.stringify(both));
  assert.deepEqual(both.jobs.map(entry => [entry.job, entry.uncovered]), [['J001', []], ['J002', []]]);
  const extra = await keep({ 'src/three.mjs': 'three\n' }, 'code nobody reviewed');
  const unreviewed = tool(['coverage', '--project', pair, '--base', pairBase, '--head', extra]);
  assert.equal(unreviewed.ok, false);
  assert.deepEqual(unreviewed.jobs.map(entry => entry.uncovered.map(item => item.commit)), [[extra], [extra]], 'a commit no job reviewed stays uncovered for each');

  // The PR322 shape across jobs: an unreviewed correction of one job lies before another job's candidate but outside that job's reviewed range.
  const shape = join(coverTemp, 'shape');
  await mkdir(shape);
  git(shape, 'init', '-q', '-b', 'main', '.');
  const stage = async (files, message) => {
    for (const [path, content] of Object.entries(files)) {
      await mkdir(join(shape, path, '..'), { recursive: true });
      await writeFile(join(shape, path), content);
    }
    git(shape, 'add', '-A');
    git(shape, 'commit', '-qm', message);
    return git(shape, 'rev-parse', 'HEAD');
  };
  const shapeBase = await stage({ 'README.md': 'start' + String.fromCharCode(10), '.factory/initiatives/I0001/plan.md': plan('in-progress') }, 'main');
  const c1 = await stage({ 'src/one.mjs': 'one' + String.fromCharCode(10) }, 'job one code');
  const c2 = await stage({ 'src/one.mjs': 'one corrected' + String.fromCharCode(10) }, 'job one correction, never reviewed');
  const c3 = await stage({ 'src/two.mjs': 'two' + String.fromCharCode(10) }, 'job two code');
  const shaped = await stage({ [`${jobDir('J001')}/V001.md`]: reviewText(c1, '', shapeBase), [`${jobDir('J002')}/V001.md`]: reviewText(c3, '', c2) }, 'records: both reviews');
  const gap = tool(['coverage', '--project', shape, '--base', shapeBase, '--head', shaped]);
  assert.equal(gap.ok, false, JSON.stringify(gap));
  assert.deepEqual(gap.jobs.map(entry => entry.uncovered.map(item => item.commit)), [[c2], [c2]], 'c2 is in no reviewed base..candidate range');

  // The override lines of every reviewed job apply to the one commit list: a documentation commit named by one job's record is excused for both.
  const overrideRepo = join(coverTemp, 'override');
  await mkdir(overrideRepo);
  git(overrideRepo, 'init', '-q', '-b', 'main', '.');
  const lay = async (files, message) => {
    for (const [path, content] of Object.entries(files)) {
      await mkdir(join(overrideRepo, path, '..'), { recursive: true });
      await writeFile(join(overrideRepo, path), content);
    }
    git(overrideRepo, 'add', '-A');
    git(overrideRepo, 'commit', '-qm', message);
    return git(overrideRepo, 'rev-parse', 'HEAD');
  };
  const overrideBase = await lay({ 'README.md': 'start' + String.fromCharCode(10), '.factory/initiatives/I0001/plan.md': plan('in-progress') }, 'main');
  const codeA = await lay({ 'src/one.mjs': 'one' + String.fromCharCode(10) }, 'job one code');
  const note = await lay({ 'docs/en/note.md': 'note' + String.fromCharCode(10) }, 'docs by the coordinator');
  const codeB = await lay({ 'src/two.mjs': 'two' + String.fromCharCode(10) }, 'job two code');
  const both2 = await lay({ [`${jobDir('J001')}/V001.md`]: reviewText(codeA, override(note), overrideBase), [`${jobDir('J002')}/V001.md`]: reviewText(codeB, '', note) }, 'records: both reviews');
  const excused = tool(['coverage', '--project', overrideRepo, '--base', overrideBase, '--head', both2]);
  assert.equal(excused.ok, true, JSON.stringify(excused));
  assert.deepEqual(excused.jobs.map(entry => entry.overridden.map(item => item.commit)), [[note], [note]], 'the override applies to both jobs');

  // A pull request's merge commit has no changes of its own: the commits it brings in are what counts, and a reviewed one passes.
  const merged = join(coverTemp, 'merged');
  await mkdir(merged);
  git(merged, 'init', '-q', '-b', 'main', '.');
  const put = async (path, content) => {
    await mkdir(join(merged, path, '..'), { recursive: true });
    await writeFile(join(merged, path), content);
  };
  await put('README.md', 'start\n');
  await put('.factory/initiatives/I0001/plan.md', plan('in-progress'));
  git(merged, 'add', '-A');
  git(merged, 'commit', '-qm', 'main');
  const origin = git(merged, 'rev-parse', 'HEAD');
  git(merged, 'checkout', '-q', '-b', 'feature');
  await put('src/x.mjs', 'export const x = 1;\n');
  git(merged, 'add', '-A');
  git(merged, 'commit', '-qm', 'feature');
  const built = git(merged, 'rev-parse', 'HEAD');
  await put('.factory/initiatives/I0001/jobs/J001/V001.md', reviewText(built, '', origin));
  git(merged, 'add', '-A');
  git(merged, 'commit', '-qm', 'records: V001');
  git(merged, 'checkout', '-q', 'main');
  await put('docs/en/other.md', 'other\n');
  git(merged, 'add', '-A');
  git(merged, 'commit', '-qm', 'docs on main');
  git(merged, 'merge', '--no-ff', '-q', '-m', 'merge feature', 'feature');
  const viaMerge = tool(['coverage', '--project', merged, '--base', origin, '--head', git(merged, 'rev-parse', 'HEAD')]);
  assert.equal(viaMerge.ok, false, 'the docs commit made on main after the base is not reviewed');
  assert.deepEqual(viaMerge.jobs[0].uncovered.map(entry => entry.paths), [['docs/en/other.md']], 'only the docs commit, not the merge commit that brings in the reviewed one');
} finally {
  await rm(coverTemp, { recursive: true, force: true });
}

console.log('PASS handoff');
