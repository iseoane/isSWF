import assert from 'node:assert/strict';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const core = await import(pathToFileURL(join(source, 'tools/isswf-undispatched-core.mjs')));
const { findUndispatched, freshUndispatched, undispatchedWarning } = core;

const job = (id, status, revision = 1) => `## ${id}\n\n- Status: ${status}\n- Objective: Synthetic\n- Depends on: None\n- Brief: [brief-r${revision}.md](jobs/${id}/brief-r${revision}.md)\n- Blocker: None.\n- Next step: None.\n\n### Acceptance\n\n- Observable outcome\n\n### Evidence\n\n- None.\n`;
const plan = (id, ...jobs) => `# ${id}: Synthetic\n\nType: bug\n\n${jobs.join('\n')}`;
const dispatched = (initiative, id, revision = 1) => ({ agent: 'isswf:isswf-worker', initiative, job: id, path: `.factory/initiatives/${initiative}/jobs/${id}/brief-r${revision}.md`, checkpoint: 'a1'.repeat(20), base: 'b2'.repeat(20) });

// The in-memory io answers like the Claude `$.fs` and `$.process.run`: a missing path rejects, `list` returns `{ name, kind }`, and `git` answers by exit code.
// `committed` holds the project-relative paths that exist at HEAD; `gitFails` makes Git itself unavailable.
const memoryIo = ({ project = '/work/project', files = {}, committed = Object.keys(files), gitFails = false } = {}) => {
  const norm = path => path.replaceAll('\\', '/');
  const root = `${norm(project)}/`;
  const all = Object.fromEntries(Object.entries(files).map(([path, text]) => [`${root}${path}`, text]));
  const heads = new Set(committed);
  return {
    project: () => project,
    read: async path => {
      if (!(norm(path) in all)) throw Error('ENOENT');
      return all[norm(path)];
    },
    list: async dir => {
      const prefix = `${norm(dir)}/`;
      const entries = new Map();
      for (const path of Object.keys(all).filter(candidate => candidate.startsWith(prefix))) {
        const [name, ...rest] = path.slice(prefix.length).split('/');
        entries.set(name, rest.length ? 'dir' : 'file');
      }
      if (!entries.size) throw Error('ENOENT');
      return [...entries].map(([name, kind]) => ({ name, kind }));
    },
    git: async argv => {
      if (gitFails) throw Error('git is not installed');
      const [command, ...rest] = argv;
      assert.equal(command, 'cat-file', 'the core asks Git only whether the brief exists at HEAD');
      assert.equal(rest[0], '-e');
      const [rev, path] = [rest[1].slice(0, rest[1].indexOf(':')), rest[1].slice(rest[1].indexOf(':') + 3)];
      assert.equal(rev, 'HEAD');
      return heads.has(path) ? 0 : 128;
    },
  };
};
const BRIEF = '.factory/initiatives/I0001/jobs/J001/brief-r1.md';
const PLAN = '.factory/initiatives/I0001/plan.md';
const base = (extra = {}) => ({ [PLAN]: plan('I0001', job('J001', 'in-progress')), [BRIEF]: 'brief', ...extra });

const expected = [{ initiative: 'I0001', job: 'J001', briefName: 'brief-r1.md', path: BRIEF }];
assert.deepEqual(await findUndispatched({ io: memoryIo({ files: base() }), assignments: [] }), expected, 'a committed brief of an in-progress job with no attempt and no dispatch is reported');
assert.deepEqual(await findUndispatched({ io: memoryIo({ project: 'C:\\work\\project', files: base() }), assignments: [] }), expected, 'a Windows-spelled project root works the same');

// Each condition that makes the job not a gap.
const none = async (options, assignments = []) => assert.deepEqual(await findUndispatched({ io: memoryIo(options), assignments }), []);
await none({ files: base({ '.factory/initiatives/I0001/jobs/J001/A001.md': 'attempt' }) });
await none({ files: base() }, [dispatched('I0001', 'J001')]);
await none({ files: base(), committed: [] });
await none({ files: { ...base(), [PLAN]: plan('I0001', job('J001', 'pending')) } });
await none({ files: { ...base(), [PLAN]: plan('I0001', job('J001', 'completed')) } });
await none({ files: base(), gitFails: true });
await none({ files: { ...base(), [PLAN]: 'not a plan' } });
await none({ files: {} });

// A review record is not a launch of the worker, and a dispatch of another job or revision does not cover this brief.
assert.deepEqual(await findUndispatched({ io: memoryIo({ files: base({ '.factory/initiatives/I0001/jobs/J001/V001.md': 'review' }) }), assignments: [] }), expected);
assert.deepEqual(await findUndispatched({ io: memoryIo({ files: base() }), assignments: [dispatched('I0001', 'J002'), dispatched('I0002', 'J001'), dispatched('I0001', 'J001', 2)] }), expected);

// A new brief revision is a different gap: it warns again after the first was shown.
const r2 = base({ [PLAN]: plan('I0001', job('J001', 'in-progress', 2)), '.factory/initiatives/I0001/jobs/J001/brief-r2.md': 'brief' });
const warned = new Set();
assert.equal(freshUndispatched(expected, warned).length, 1, 'the first sight is fresh');
assert.equal(freshUndispatched(expected, warned).length, 0, 'the same job and revision warns once');
const second = await findUndispatched({ io: memoryIo({ files: r2 }), assignments: [] });
assert.equal(second[0].briefName, 'brief-r2.md');
assert.equal(freshUndispatched(second, warned).length, 1, 'a new revision warns again');

// The line names the job and its brief, on one line.
assert.equal(undispatchedWarning(expected), `isSWF: I0001/J001 is in-progress with a committed brief (${BRIEF}) and no recorded launch or dispatch. Dispatch it, or record why not, before ending the turn.`);
assert.equal(undispatchedWarning([]), undefined);
assert.match(undispatchedWarning([...expected, { initiative: 'I0001', job: 'J002', briefName: 'brief-r1.md', path: '.factory/initiatives/I0001/jobs/J002/brief-r1.md' }]), /^isSWF: I0001\/J001, I0001\/J002 are in-progress/);
console.log('isswf-undispatched: ok');
