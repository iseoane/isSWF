import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Re-pins the source citations of docs/diagrams/workflow.json to a newer revision.
// A citation moves only when its exact cited text occurs exactly once in the new revision; anything else is reported, never guessed.
const args = process.argv.slice(2);
const write = args.includes('--write');
const rootIndex = args.indexOf('--root');
const root = rootIndex === -1 ? fileURLToPath(new URL('../../', import.meta.url)) : resolve(args[rootIndex + 1] ?? '');
const positional = args.filter((arg, index) => !arg.startsWith('--') && args[index - 1] !== '--root');
if (positional.length !== 1) {
  console.error('Usage: node tooling/maintenance/workflow-citations.mjs [--write] [--root <repository>] <new-revision>');
  process.exit(2);
}

function git(...gitArgs) {
  const result = spawnSync('git', ['-C', root, ...gitArgs], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, env: { ...process.env, GIT_LITERAL_PATHSPECS: '1' } });
  return result.error || result.status !== 0 ? null : result.stdout;
}
const newRevision = git('rev-parse', '--verify', `${positional[0]}^{commit}`)?.trim();
if (!newRevision) { console.error(`Unknown revision: ${positional[0]}`); process.exit(2); }

const sourcePath = resolve(root, 'docs/diagrams/workflow.json');
const diagrams = JSON.parse(readFileSync(sourcePath, 'utf8'));
const oldRevision = diagrams.workflow.meta.repository.revision;
const lines = (revision, path) => git('show', `${revision}:${path}`)?.replaceAll('\r\n', '\n').split('\n') ?? null;
const sources = [];
(function collect(value) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value.sources)) sources.push(...value.sources);
  for (const child of Object.values(value)) collect(child);
})(diagrams);

const endOf = source => source.end_line ?? source.line;
const keyOf = source => `${source.path}:${source.line}-${endOf(source)}`;
const resolutions = new Map();
for (const source of sources) {
  const key = keyOf(source);
  if (resolutions.has(key)) continue;
  const oldLines = lines(oldRevision, source.path), newLines = lines(newRevision, source.path);
  const cited = oldLines?.slice(source.line - 1, endOf(source));
  const heading = oldLines?.slice(0, source.line - 1).findLast(line => /^#{1,6} /u.test(line)) ?? '(no heading)';
  if (!cited?.length || cited.length !== endOf(source) - source.line + 1 || !newLines) {
    resolutions.set(key, { status: 'unresolved', reason: !newLines ? 'file missing in the new revision' : 'cited lines missing in the pinned revision', heading });
    continue;
  }
  const starts = [];
  for (let start = 0; start + cited.length <= newLines.length; start++) if (cited.every((line, offset) => newLines[start + offset] === line)) starts.push(start + 1);
  resolutions.set(key, starts.length === 1
    ? { status: 'resolved', line: starts[0], end_line: starts[0] + cited.length - 1 }
    : { status: 'unresolved', reason: starts.length ? `cited text occurs ${starts.length} times` : 'cited text not found', heading });
}

const unresolved = [...resolutions].filter(([, value]) => value.status === 'unresolved');
const moved = [...resolutions].filter(([key, value]) => value.status === 'resolved' && !key.endsWith(`:${value.line}-${value.end_line}`));
for (const [key, value] of moved) console.log(`moved ${key} -> ${value.line}-${value.end_line}`);
for (const [key, value] of unresolved) console.log(`UNRESOLVED ${key} (${value.reason}; under: ${value.heading})`);
console.log(`${resolutions.size} citations: ${resolutions.size - unresolved.length - moved.length} unchanged, ${moved.length} moved, ${unresolved.length} unresolved.`);

if (write) {
  for (const source of sources) {
    const resolution = resolutions.get(keyOf(source));
    if (resolution.status !== 'resolved') continue;
    const single = source.end_line === undefined;
    source.line = resolution.line;
    if (!single) source.end_line = resolution.end_line;
  }
  diagrams.workflow.meta.repository.revision = newRevision;
  if (unresolved.length) console.log('The revision is updated, but the unresolved citations above still point at the old lines: fix them by hand.');
  writeFileSync(sourcePath, JSON.stringify(diagrams, null, 2) + '\n');
  console.log('Regenerate the diagrams afterwards (node tooling/maintenance/workflow-diagrams.mjs <archify>); the source hash changed.');
}
process.exitCode = unresolved.length ? 1 : 0;
