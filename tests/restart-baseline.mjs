import assert from 'node:assert/strict';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] ?? '.');
const { baselineChanges } = await import(pathToFileURL(join(source, '.factory/initiatives/I0001/jobs/J006/verify-restart.mjs')));
const file = (path, sha256 = 'unchanged', mode = '100644', bytes = 1) => ({ path, sha256, mode, bytes });
const baseline = [file('protected'), file('result.txt')];
assert.deepEqual(baselineChanges(baseline, baseline), []);
assert.deepEqual(baselineChanges(baseline, [file('protected'), file('result.txt', 'partial')]), ['result.txt']);
for (const [workspace, expected] of [
  [[...baseline, file('unexpected')], ['unexpected']],
  [[file('result.txt')], ['protected']],
  [[file('protected', 'changed'), file('result.txt')], ['protected']],
  [[file('protected', 'unchanged', '100755'), file('result.txt')], ['protected']],
  [[file('protected', 'unchanged', '120000'), file('result.txt')], ['protected']],
  [[file('protected', 'unchanged', '100644', 2), file('result.txt')], ['protected']],
  [[file('protected', 'unchanged', '100755'), file('result.txt', 'partial'), file('unexpected')], ['protected', 'result.txt', 'unexpected']],
]) assert.deepEqual(baselineChanges(baseline, workspace), expected);
console.log('PASS complete restart baseline comparison: additions, removals, content, file types, sizes and executable modes; no original fixture or execution touched');
