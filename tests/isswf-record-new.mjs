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
  console.log('isswf-record-new test ok');
} finally {
  await rm(root, { recursive: true, force: true });
}
