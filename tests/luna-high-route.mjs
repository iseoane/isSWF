import assert from 'node:assert/strict';
import { lunaHighRoute } from '../tools/luna-high-route.mjs';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
for (const provider of ['openai-codex', 'openai']) {
  const tuple = Object.freeze({ model: provider + '/gpt-6-luna', effort: 'high' });
  assert.deepEqual(lunaHighRoute(Object.freeze([tuple])), { provider, model: 'gpt-6-luna', effort: 'high' });
}
for (const route of [undefined, null, [], {}, ['openai/gpt-6-luna'], [null], [{ model: 'openai/gpt-6-luna', effort: 'low' }], [{ model: 'openai/other', effort: 'high' }], [{ model: 'other/gpt-6-luna', effort: 'high' }], [{ model: 'openai/gpt-6-luna', effort: 'high', fallback: false }], [{ model: 'openai/gpt-6-luna', effort: 'high' }, { model: 'openai-codex/gpt-6-luna', effort: 'high' }]]) assert.equal(lunaHighRoute(route), null);
const root = await mkdtemp(join(tmpdir(), 'isswf-exact-route-'));
try {
  const config = join(root, 'config.json'), output = join(root, 'task.mjs');
  for (const route of [null, { model: 'other/gpt-6-luna', effort: 'high' }]) {
    await writeFile(config, JSON.stringify({ version: 1, mode: 'offline', route }));
    const result = spawnSync(process.execPath, [fileURLToPath(new URL('../tools/pi-worker-task.mjs', import.meta.url)), 'prepare', '--config', config, '--output', output], { encoding: 'utf8', timeout: 10000 });
    assert.ifError(result.error); assert.notEqual(result.status, 0); assert.match(result.stderr, /only exact configured LunaHigh worker route supported; no fallback/u);
    await assert.rejects(readFile(output), error => error.code === 'ENOENT');
  }
} finally { await rm(root, { recursive: true, force: true }); }
console.log('PASS explicit Luna-high destinations: exact legacy/new providers, no aliases, alternates, field merging or caller grants');
