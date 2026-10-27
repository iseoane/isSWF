#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { lstat, readFile, realpath, mkdir, open, link, unlink, rename, rmdir } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stateDirectory } from './project-state.mjs';
import { syncDirectory } from './platform-runtime.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const id = value => typeof value === 'string' && /^[A-Z][A-Z0-9-]{0,63}$/u.test(value);
const text = value => typeof value === 'string' && value.trim() && value.length <= 4000 && !/[\x00-\x1f\x7f]/u.test(value);
export const planStates = Object.freeze(['pending', 'in-progress', 'blocked', 'in-review', 'awaiting-human', 'completed']);
async function regular(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 256000) throw Error('bounded regular file required');
  return readFile(path, 'utf8');
}
async function directory(path, create = false) {
  if (create) { try { await mkdir(path, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; } }
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('regular directory required');
}
async function synced(path, bytes) {
  const handle = await open(path, 'wx', 0o600);
  try { await handle.writeFile(bytes); await handle.sync(); } finally { await handle.close(); }
}
async function checkpoint(root, path, old) {
  const result = spawnSync('git', ['-C', root, 'show', 'HEAD:' + relative(root, path).split('\\').join('/')], { timeout: 10000, maxBuffer: 256001, env: { PATH: process.env.PATH, HOME: '/nonexistent', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_NO_REPLACE_OBJECTS: '1' } });
  const bytes = await readFile(path);
  if (result.error || result.status !== 0 || !bytes.equals(Buffer.from(old)) || !result.stdout.equals(bytes)) throw Error('Git checkpoint required: commit the exact current plan before revise');
}
function validateDependencyGraph(jobs) {
  const byId = new Map(jobs.map(job => [job.id, job])), visiting = new Set(), visited = new Set();
  function visit(job) {
    if (visiting.has(job.id)) throw Error('cyclic job dependencies');
    if (visited.has(job.id)) return;
    visiting.add(job.id);
    for (const dep of job.dependencies) visit(byId.get(dep));
    visiting.delete(job.id); visited.add(job.id);
  }
  for (const job of jobs) visit(job);
}
export function parsePlan(markdown) {
  const jobs = [], seen = new Set(); let current, section;
  for (const line of markdown.split('\n')) {
    const header = /^## ([A-Z][A-Z0-9-]{0,63})$/u.exec(line);
    if (header) {
      if (seen.has(header[1])) throw Error('duplicate-job');
      seen.add(header[1]); current = { id: header[1], acceptance: [], evidence: [] }; jobs.push(current); section = null;
    } else if (current) {
      const field = section ? null : /^- (Status|Objective|Depends on|Brief|Blocker|Next step): (.+)$/u.exec(line);
      if (field) {
        if (Object.hasOwn(current, field[1])) throw Error('duplicate-field');
        current[field[1]] = field[2];
      } else if (line === '### Acceptance') section = 'acceptance';
      else if (line === '### Evidence') section = 'evidence';
      else if (section && line.startsWith('- ')) current[section].push(line.slice(2));
    }
  }
  if (!jobs.length || jobs.length > 100) throw Error('invalid-plan');
  const parsed = jobs.map(job => {
    if (!planStates.includes(job.Status) || ['Objective', 'Depends on', 'Brief', 'Blocker', 'Next step'].some(field => !job[field]) || !job.acceptance.length) throw Error('invalid-job');
    const brief = /^\[brief-r([1-9][0-9]*)\.md\]\(jobs\/([A-Z][A-Z0-9-]{0,63})\/brief-r\1\.md\)(?: \(pending until prepared\))?$/u.exec(job.Brief);
    if (!brief || brief[2] !== job.id) throw Error('unsafe-brief-reference');
    const dependencies = job['Depends on'] === 'None' ? [] : job['Depends on'].split(', ');
    if (new Set(dependencies).size !== dependencies.length || dependencies.some(dep => !seen.has(dep) || dep === job.id)) throw Error('invalid-dependency');
    return { id: job.id, reportedStatus: job.Status, objective: job.Objective, dependencies, blocker: job.Blocker, nextStep: job['Next step'], acceptance: job.acceptance, evidence: job.evidence.filter(item => item !== 'None.'), briefName: `brief-r${brief[1]}.md` };
  });
  validateDependencyGraph(parsed);
  return parsed;
}
function render(value, initiative) {
  if (value.version !== 1 || value.initiative !== initiative || !text(value.title) || !['bug', 'enhancement', 'maintenance', 'research'].includes(value.type) || !Array.isArray(value.jobs) || !value.jobs.length || value.jobs.length > 100) throw Error('invalid initiative plan');
  const ids = new Set(value.jobs.map(job => job.id));
  if (ids.size !== value.jobs.length || [...ids].some(job => !id(job))) throw Error('unique job IDs required');
  for (const job of value.jobs) {
    if ((job.briefRevision !== undefined && (!Number.isSafeInteger(job.briefRevision) || job.briefRevision < 1 || job.briefRevision > 10000)) || !text(job.objective) || !planStates.includes(job.status) || !Array.isArray(job.dependsOn) || new Set(job.dependsOn).size !== job.dependsOn.length || job.dependsOn.some(dep => !ids.has(dep) || dep === job.id) || !Array.isArray(job.acceptance) || !job.acceptance.length || job.acceptance.some(item => !text(item)) || !text(job.nextStep) || !Array.isArray(job.evidence) || job.evidence.some(item => !text(item)) || !text(job.blocker)) throw Error('invalid job or dependency');
    if (job.status === 'completed' && !job.evidence.length) throw Error('completed jobs require evidence');
  }
  validateDependencyGraph(value.jobs.map(job => ({ id: job.id, dependencies: job.dependsOn })));
  const list = values => values.length ? values.map(item => `- ${item}`).join('\n') : '- None.';
  return `# ${initiative}: ${value.title}\n\nType: ${value.type}\n\nThis coordinator-owned plan records reported progress, not execution permission or process liveness.\n\n` + value.jobs.map(job => `## ${job.id}\n\n- Status: ${job.status}\n- Objective: ${job.objective}\n- Depends on: ${job.dependsOn.join(', ') || 'None'}\n- Brief: [brief-r${job.briefRevision ?? 1}.md](jobs/${job.id}/brief-r${job.briefRevision ?? 1}.md) (pending until prepared)\n- Blocker: ${job.blocker}\n- Next step: ${job.nextStep}\n\n### Acceptance\n\n${list(job.acceptance)}\n\n### Evidence\n\n${list(job.evidence)}\n`).join('\n');
}
export async function plan({ action, project, initiative, proposalPath, grantPath, expectedSha256 }) {
  if (!['prepare', 'read', 'revise'].includes(action) || !isAbsolute(project ?? '') || !id(initiative)) throw Error('valid action, absolute project and stable initiative ID required');
  const root = await realpath(project);
  const git = spawnSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', timeout: 10000, env: { PATH: process.env.PATH, HOME: '/nonexistent', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' } });
  if (git.status !== 0 || await realpath(git.stdout.trim()) !== root) throw Error('project must be Git root');
  const parents = [join(root, stateDirectory(root)), join(root, stateDirectory(root), 'initiatives'), join(root, stateDirectory(root), 'initiatives', initiative)];
  const path = join(parents[2], 'plan.md');
  if (action === 'read') {
    try { for (const parent of parents) await directory(parent); const markdown = await regular(path); return { status: 'recorded', path, sha256: sha(markdown), markdown, executionAuthorized: false }; }
    catch (error) { if (error.code === 'ENOENT') return { status: 'absent', executionAuthorized: false }; throw error; }
  }
  if (!isAbsolute(grantPath ?? '')) throw Error('external plan-only grant required');
  const external = await realpath(grantPath), rel = relative(root, external);
  if (rel === '' || (!rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel))) throw Error('grant must be external');
  const grant = JSON.parse(await regular(external));
  if (Object.keys(grant).sort().join(',') !== 'initiative,permissions,project,reference,version' || grant.version !== 1 || grant.project !== root || grant.initiative !== initiative || !text(grant.reference) || JSON.stringify(grant.permissions) !== '["plan"]') throw Error('matching trusted plan-only grant required');
  const markdown = render(JSON.parse(await regular(proposalPath)), initiative);
  if (Buffer.byteLength(markdown) > 256000) throw Error('plan too large');
  for (const parent of parents) await directory(parent, true);
  let old;
  try { old = await regular(path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const lock = join(parents[2], '.plan-write');
  try { await lstat(lock); throw Error('Existing plan write claim requires inspection; no automatic recovery'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (old === markdown) return { status: 'reused', path, sha256: sha(old), executionAuthorized: false };
  if (action === 'prepare' && old !== undefined) throw Error('existing plan differs; explicit revise with expected SHA required');
  if (action === 'revise' && (old === undefined || !/^[a-f0-9]{64}$/u.test(expectedSha256 ?? '') || sha(old) !== expectedSha256)) throw Error('plan revision conflict');
  if (old !== undefined) await checkpoint(root, path, old);
  await mkdir(lock, { mode: 0o700 });
  let published = false;
  try {
    if (old !== undefined) {
      if (sha(await regular(path)) !== sha(old)) throw Error('plan revision conflict');
      await checkpoint(root, path, old);
    }
    const pending = join(lock, randomUUID());
    await synced(pending, markdown);
    if (old === undefined) {
      await link(pending, path);
      published = true;
      await unlink(pending);
    } else {
      await rename(pending, path);
      published = true;
    }
    await syncDirectory(parents[2]);
    await rmdir(lock);
  } catch (error) {
    error.message += `; failed ${published ? 'after' : 'before'} publication; retained plan write claim requires inspection, no automatic recovery`;
    throw error;
  }
  return { status: action === 'prepare' ? 'prepared' : 'revised', path, sha256: sha(markdown), executionAuthorized: false };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [action, ...parts] = process.argv.slice(2), args = {};
    for (let i = 0; i < parts.length; i += 2) {
      if (!['--project', '--initiative', '--proposal', '--grant', '--expected-sha256'].includes(parts[i]) || !parts[i + 1] || Object.hasOwn(args, parts[i])) throw Error('invalid option');
      args[parts[i]] = parts[i + 1];
    }
    console.log(JSON.stringify(await plan({ action, project: args['--project'], initiative: args['--initiative'], proposalPath: args['--proposal'], grantPath: args['--grant'], expectedSha256: args['--expected-sha256'] }), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
