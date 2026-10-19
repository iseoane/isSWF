import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git = (...args) => {
  const result = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024, timeout: 20000 });
  if (result.status !== 0) throw Error(result.stderr || 'Git inventory failed');
  return result.stdout;
};
const paths = (...args) => git(...args).split('\0').filter(Boolean);
const tracked = paths('ls-files', '--stage', '-z', '--', '.audit').map(entry => {
  const tab = entry.indexOf('\t'), [mode, blob, stage] = entry.slice(0, tab).split(' ');
  if (stage !== '0') throw Error('Unmerged index blocks inventory');
  return { path: entry.slice(tab + 1), mode, blob, tracking: 'tracked' };
});
const untracked = paths('ls-files', '--others', '--exclude-standard', '-z', '--', '.audit').map(path => ({ path, tracking: 'untracked' }));
const ignored = paths('ls-files', '--others', '--ignored', '--exclude-standard', '-z', '--', '.audit').map(path => ({ path, tracking: 'ignored' }));
const artifacts = new Map([...tracked, ...untracked, ...ignored].map(entry => [entry.path, { ...entry, bytes: fs.lstatSync(entry.path).size, role: 'unknown; preserve', reproductionDependencies: 'unknown; preserve', literalReferences: [] }]));
const consumers = paths('ls-files', '-z').filter(path => !path.startsWith('.audit/') && /\.(?:mjs|js|json|md|yml|yaml)$/u.test(path));
const edges = [], unresolved = [], skippedConsumers = [];
for (const consumer of consumers) {
  const st = fs.lstatSync(consumer);
  if (!st.isFile() || st.isSymbolicLink() || st.size > 512000) { skippedConsumers.push({ path: consumer, reason: 'nonregular, symlink or over 512000 bytes' }); continue; }
  const lines = fs.readFileSync(consumer, 'utf8').split('\n');
  for (const [index, line] of lines.entries()) {
    for (const match of line.matchAll(/\.audit\/[A-Za-z0-9_./-]+/gu)) {
      const path = match[0].replace(/[.]+$/u, '');
      const reference = { consumer, line: index + 1, path, kind: 'literal reference; not proof of execution' };
      if (artifacts.has(path)) { artifacts.get(path).literalReferences.push({ consumer, line: index + 1 }); edges.push(reference); }
      else unresolved.push(reference);
    }
  }
}
const rows = [...artifacts.values()].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
const sourcePins = ['tools/check-quality.mjs', 'tools/factory-package.mjs', 'tooling/quality/eslint.config.mjs', 'tooling/quality/knip.json'].filter(path => fs.existsSync(path)).map(path => ({ path, sha256: createHash('sha256').update(fs.readFileSync(path)).digest('hex') }));
console.log(JSON.stringify({ version: 3, base: git('rev-parse', 'HEAD').trim(), scope: 'Git index, file metadata and bounded tracked consumer text only; no audit payload opened', counts: { tracked: tracked.length, untracked: untracked.length, ignored: ignored.length, literalEdges: edges.length, unresolvedLiteralReferences: unresolved.length, artifactsWithObservedReferences: rows.filter(row => row.literalReferences.length).length }, sourcePins, inventorySha256: createHash('sha256').update(JSON.stringify(rows)).digest('hex'), artifacts: rows, unresolvedLiteralReferences: unresolved, skippedConsumers, limitations: ['Per-path roles and reproduction dependencies remain unknown unless separately inspected; no inferred deletability', 'Literal references are not dynamic read/import/effect proof; nonliteral paths, large or nontext consumers and manual harness dependencies are not resolved', 'All unknown or unresolved artifacts remain preserved; no policy acceptance, move, deletion, archive or history rewrite'] }, null, 2));
