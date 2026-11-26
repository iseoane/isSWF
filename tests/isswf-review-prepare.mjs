import { initRepository } from './support/git-fixture.mjs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { checkReferences } = await import(pathToFileURL(join(source, 'tools/isswf-dispatch-guard-core.mjs')));

const temp = await realpath(await mkdtemp(join(tmpdir(), 'isswf-review-prepare-')));
const git = (cwd, ...args) => {
  const result = spawnSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=false', ...args], { cwd, encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};
const tool = args => {
  const result = spawnSync(process.execPath, [join(source, 'tools/isswf-review-prepare.mjs'), ...args], { encoding: 'utf8', timeout: 60000, maxBuffer: 16 * 1024 * 1024 });
  assert.ifError(result.error);
  return { ...JSON.parse(result.stdout), exitCode: result.status };
};
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const planText = status => `# I0001: Synthetic\n\nType: bug\n\n## J001\n\n- Status: ${status}\n- Objective: Synthetic\n- Depends on: None\n- Brief: [brief-r1.md](jobs/J001/brief-r1.md)\n- Blocker: None.\n- Next step: None.\n\n### Acceptance\n\n- Observable outcome\n\n### Evidence\n\n- None.\n`;
const JOB = '.factory/initiatives/I0001/jobs/J001';
const BRIEF = `${JOB}/brief-r1.md`;
const RESOURCES = ['.agents/roles/reviewer.md', '.agents/skills/isswf-review/SKILL.md', '.agents/roles/references/review.md', '.agents/roles/references/review-convergence.md', '.agents/hosts/claude-code.md'];
const selection = { schemaVersion: 1, agents: { claude: { 'isswf:isswf-reviewer': { model: 'opus', effort: 'medium' }, 'isswf-reviewer': { model: 'opus', effort: 'medium' } }, pi: {} } };

try {
  const root = join(temp, 'project');
  const write = async (path, content) => {
    await mkdir(join(root, path, '..'), { recursive: true });
    await writeFile(join(root, path), content);
  };
  await mkdir(root);
  initRepository(root, ['-b', 'main']);
  await write('.factory/initiatives/I0001/plan.md', planText('in-progress'));
  await write(BRIEF, '# brief\n');
  await write(`${JOB}/V001.md`, '# earlier review\n');
  await write('.factory/dispatch-selection.json', JSON.stringify(selection));
  await write('REVIEW.md', '# review guide\n');
  for (const path of RESOURCES) await write(path, `# ${path}\n`);
  await write('src/a.txt', 'one\n');
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'base');
  const base = git(root, 'rev-parse', 'HEAD');
  await write('src/a.txt', 'one\ntwo\n');
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', 'candidate');
  const candidate = git(root, 'rev-parse', 'HEAD');
  const checkpoint = candidate;
  const out = join(temp, 'out');
  const prepare = (extra = {}) => {
    const flags = { '--project': root, '--initiative': 'I0001', '--job': 'J001', '--brief': BRIEF, '--checkpoint': checkpoint, '--base': base, '--candidate': candidate, '--out': out, ...extra };
    return tool(['prepare', ...Object.entries(flags).flatMap(([flag, value]) => (value === undefined ? [] : [flag, value]))]);
  };
  const records = async () => (await readdir(join(root, JOB))).filter(name => /^V\d{3}\.md$/u.test(name));
  const refuses = async (result, code, label) => {
    assert.equal(result.ok, false, `${label}: ${JSON.stringify(result)}`);
    assert.equal(result.exitCode, 1, label);
    assert.equal(result.code, code, `${label}: ${JSON.stringify(result)}`);
    assert.deepEqual(await records(), ['V001.md'], `${label}: a refusal creates no record`);
  };

  // Refusals leave no review record: the arguments, the project, the job state, the reviewer selection and the range.
  await refuses(tool(['prepare']), 'usage', 'no flags');
  await refuses(prepare({ '--project': 'relative/project' }), 'invalid-project', 'relative project');
  await refuses(prepare({ '--out': 'relative/out' }), 'invalid-out', 'relative out');
  await refuses(prepare({ '--candidate': 'abc' }), 'invalid-candidate', 'short candidate');
  await refuses(prepare({ '--run': 'claude agent=unknown' }), 'invalid-run', 'unknown run');
  await refuses(prepare({ '--run': 'not a run' }), 'invalid-run', 'malformed run');
  await refuses(prepare({ '--brief': `${JOB}/brief-r9.md` }), 'brief-not-found', 'missing brief');
  await refuses(prepare({ '--base': candidate, '--candidate': base }), 'candidate-not-descendant', 'reversed range');
  await refuses(prepare({ '--host': 'pi' }), 'reviewer-selection-missing', 'no Pi reviewer selection');
  await write('.factory/initiatives/I0001/plan.md', planText('pending'));
  await refuses(prepare({ '--checkpoint': base }), 'job-not-in-progress', 'pending job');
  await write('.factory/initiatives/I0001/plan.md', planText('in-progress'));

  // Success: the handoff, the next review record with the right round, and the prompt lines the dispatch guard reads.
  const made = prepare({ '--run': 'claude agent=a9' });
  assert.equal(made.ok, true, JSON.stringify(made));
  assert.equal(made.exitCode, 0);
  assert.equal(made.id, 'V002');
  assert.equal(made.record, join(root, JOB, 'V002.md'));
  const record = await readFile(made.record, 'utf8');
  assert.ok(record.includes('- Run: claude agent=a9\n'), 'the known run identity is recorded');
  assert.ok(record.includes('- Review round in this job, and prior review IDs: 2; prior reviews: V001\n'), 'round and prior reviews come from the existing V records');
  assert.ok(record.includes('requested `opus`/`medium`'), 'model and effort come from the reviewer selection');
  assert.ok(record.includes(`- Base commit SHA: ${base}\n`));
  assert.ok(record.includes(`- Candidate commit SHA, or reproducible snapshot identity: ${candidate}\n`));
  const handoffBytes = await readFile(made.handoff.path);
  assert.equal(made.handoff.sha256, sha256(handoffBytes));
  const envelope = JSON.parse(handoffBytes.toString('utf8'));
  assert.equal(envelope.round, 2);
  assert.deepEqual(envelope.priorReviews, ['V001']);
  const prompt = made.promptLines.join('\n');
  assert.deepEqual(checkReferences(prompt), { initiative: 'I0001', job: 'J001', revision: '1', path: BRIEF, checkpoint, base }, 'the dispatch guard reads the brief, checkpoint and base from the lines');
  for (const line of [`handoff: ${made.handoff.path}`, `handoff-sha256: ${made.handoff.sha256}`, `candidate ${candidate}`]) assert.ok(made.promptLines.includes(line), line);
  assert.ok(made.promptLines.some(line => line.startsWith('review-guide: ')), 'the review guide line is printed');
  assert.ok(made.promptLines.includes(`review-record: ${made.record}`), 'the reviewer is told which record to write');

  // The run identity is optional: a launch whose identity is unknown leaves no Run line.
  await rm(made.record);
  const unknown = prepare();
  assert.equal(unknown.ok, true, JSON.stringify(unknown));
  assert.equal(unknown.id, 'V002');
  assert.equal(/^- Run:/mu.test(await readFile(unknown.record, 'utf8')), false);

  // A second preparation for the same candidate finds a record the handoff would now count as a prior review, so it is refused and creates nothing.
  const again = prepare();
  assert.equal(again.ok, false);
  assert.equal(again.code, 'handoff-exists');
  assert.deepEqual(await records(), ['V001.md', 'V002.md']);
} finally {
  await rm(temp, { recursive: true, force: true });
}
console.log('isswf-review-prepare: ok');
