import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { parseArgs, summarize, readCiState } = await import(pathToFileURL(join(source, 'tools/isswf-ci-state-core.mjs')).href);

const HEAD = 'a'.repeat(40);
const run = (name, conclusion, status = 'COMPLETED') => ({ __typename: 'CheckRun', name, status, conclusion });
const context = (name, state) => ({ __typename: 'StatusContext', context: name, state });
const view = (...rollup) => ({ headRefOid: HEAD, statusCheckRollup: rollup });

// The state is the worst check: a failure outranks a pending check, and a pending check outranks success.
assert.deepEqual(summarize(view(run('lint', 'SUCCESS'), run('test', 'SKIPPED'), run('docs', 'NEUTRAL'))), {
  head: HEAD,
  state: 'success',
  checks: [{ name: 'lint', conclusion: 'success' }, { name: 'test', conclusion: 'skipped' }, { name: 'docs', conclusion: 'neutral' }],
});
assert.equal(summarize(view(run('lint', 'SUCCESS'), run('test', null, 'IN_PROGRESS'))).state, 'pending');
assert.equal(summarize(view(run('lint', null, 'QUEUED'))).checks[0].conclusion, 'pending');
for (const bad of ['FAILURE', 'CANCELLED', 'TIMED_OUT', 'ACTION_REQUIRED', 'STARTUP_FAILURE', 'SOMETHING_NEW']) {
  assert.equal(summarize(view(run('a', 'SUCCESS'), run('b', bad), run('c', null, 'IN_PROGRESS'))).state, 'failure', bad);
}
assert.equal(summarize(view(context('ci/x', 'SUCCESS'))).state, 'success');
assert.equal(summarize(view(context('ci/x', 'PENDING'))).state, 'pending');
assert.equal(summarize(view(context('ci/x', 'ERROR'))).state, 'failure');
assert.deepEqual(summarize(view(context('ci/x', 'FAILURE'))).checks, [{ name: 'ci/x', conclusion: 'failure' }]);
// No registered check yet is not a pass.
assert.equal(summarize(view()).state, 'pending');
// A reply the tool cannot read is refused, never read as pending or success.
for (const bad of [null, [], {}, { headRefOid: HEAD }, { headRefOid: 'abc', statusCheckRollup: [] }, { headRefOid: HEAD, statusCheckRollup: [{ name: 5 }] }]) {
  assert.throws(() => summarize(bad), /unreadable/u, JSON.stringify(bad));
}

// Argument parsing.
assert.deepEqual(parseArgs(['--pr', '12']), { pr: '12', repo: undefined });
assert.deepEqual(parseArgs(['--pr', '12', '--repo', 'o/n']), { pr: '12', repo: 'o/n' });
for (const bad of [[], ['--pr'], ['--pr', 'x'], ['--pr', '0'], ['--pr', '1', '--repo'], ['--pr', '1', '--repo', 'bad'], ['--pr', '1', '--watch'], ['--pr', '1', '--repo', '--pr']]) {
  assert.throws(() => parseArgs(bad), /Usage|needs|unknown/u, bad.join(' '));
}

// One call, with the exact argv, and every gh failure reads as unreadable.
{
  const calls = [];
  const gh = async argv => {
    calls.push(argv);
    return { exitCode: 0, stdout: JSON.stringify(view(run('lint', 'SUCCESS'))) };
  };
  assert.equal((await readCiState({ pr: '7', repo: 'o/n', gh })).state, 'success');
  assert.deepEqual(calls, [['pr', 'view', '7', '--json', 'headRefOid,statusCheckRollup', '--repo', 'o/n']]);
  await readCiState({ pr: '7', gh });
  assert.deepEqual(calls[1], ['pr', 'view', '7', '--json', 'headRefOid,statusCheckRollup']);
}
await assert.rejects(readCiState({ pr: '7', gh: async () => ({ exitCode: 1, stdout: '' }) }), /unreadable/u);
await assert.rejects(readCiState({ pr: '7', gh: async () => ({ exitCode: 0, stdout: 'not json' }) }), /unreadable/u);
await assert.rejects(readCiState({ pr: '7', gh: async () => { throw new Error('spawn gh ENOENT'); } }), /unreadable/u);

// The tool end to end: exit code 3 with no gh, and the three states through a fake gh where a script can stand in for it.
const tool = (path, ...args) => spawnSync(process.execPath, [join(source, 'tools/isswf-ci-state.mjs'), ...args], { encoding: 'utf8', timeout: 60_000, env: { ...process.env, PATH: path } });
const temp = await mkdtemp(join(tmpdir(), 'isswf-ci-state-'));
try {
  const none = tool(temp, '--pr', '1');
  assert.equal(none.status, 3, none.stderr);
  assert.equal(none.stdout, '');
  assert.match(none.stderr, /unreadable/u);
  assert.equal(tool(temp).status, 3, 'a missing --pr is refused before any call');

  if (process.platform !== 'win32') {
    const fake = async reply => {
      await writeFile(join(temp, 'gh'), `#!/bin/sh\nprintf '%s' '${JSON.stringify(reply)}'\n`);
      await chmod(join(temp, 'gh'), 0o755);
    };
    for (const [rollup, state, code] of [[[run('lint', 'SUCCESS')], 'success', 0], [[run('lint', 'FAILURE')], 'failure', 1], [[run('lint', null, 'IN_PROGRESS')], 'pending', 2]]) {
      await fake(view(...rollup));
      const result = tool(`${temp}${delimiter}/usr/bin${delimiter}/bin`, '--pr', '1');
      assert.equal(result.status, code, `${state}: ${result.stderr}`);
      assert.equal(JSON.parse(result.stdout).state, state);
      assert.equal(JSON.parse(result.stdout).head, HEAD);
    }
  }
} finally {
  await rm(temp, { recursive: true, force: true });
}
console.log('isswf-ci-state: ok');
