#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plan } from './isswf-plan.mjs';

const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const states = ['pending', 'in-progress', 'blocked', 'in-review', 'awaiting-human', 'completed'];
async function directory(path) {
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('unsafe-directory');
}
async function snapshot(path) {
  const handle = await open(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > 256000) throw Error('invalid-record');
    const bytes = await handle.readFile();
    if (bytes.length > 256000) throw Error('invalid-record');
    return { path, sha256: sha(bytes), modifiedAt: stat.mtime.toISOString(), text: bytes.toString('utf8') };
  } finally { await handle.close(); }
}
function parse(markdown) {
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
  return jobs.map(job => {
    if (!states.includes(job.Status) || ['Objective', 'Depends on', 'Brief', 'Blocker', 'Next step'].some(field => !job[field]) || !job.acceptance.length) throw Error('invalid-job');
    const brief = /^\[brief-r([1-9][0-9]*)\.md\]\(jobs\/([A-Z][A-Z0-9-]{0,63})\/brief-r\1\.md\)(?: \(pending until prepared\))?$/u.exec(job.Brief);
    if (!brief || brief[2] !== job.id) throw Error('unsafe-brief-reference');
    const dependencies = job['Depends on'] === 'None' ? [] : job['Depends on'].split(', ');
    if (dependencies.some(dep => !seen.has(dep) || dep === job.id)) throw Error('invalid-dependency');
    return { id: job.id, reportedStatus: job.Status, objective: job.Objective, dependencies, blocker: job.Blocker, nextStep: job['Next step'], acceptance: job.acceptance, evidence: job.evidence.filter(item => item !== 'None.'), briefName: `brief-r${brief[1]}.md` };
  });
}
async function artifacts(root, job) {
  const path = join(root, 'jobs', job.id);
  try {
    await directory(join(root, 'jobs')); await directory(path);
    const brief = await snapshot(join(path, job.briefName));
    const reports = [];
    for (const entry of (await readdir(path)).sort()) {
      if (!/^[AV][0-9]+\.md$/u.test(entry)) continue;
      if (reports.length >= 100) throw Error('too-many-reports');
      const report = await snapshot(join(path, entry));
      const reportedStatus = /^- Reported status: (.+)$/mu.exec(report.text)?.[1] ?? null;
      reports.push({ path: report.path, sha256: report.sha256, modifiedAt: report.modifiedAt, reportedStatus });
    }
    let intake = { status: 'absent' };
    try {
      const file = await snapshot(join(path, 'intake.json')), value = JSON.parse(file.text);
      const { integritySha256, ...payload } = value;
      if (value.version !== 1 || value.project !== resolve(root, '../../..') || !['needs-info', 'ready-for-agent'].includes(value.preparation) || sha(JSON.stringify(payload)) !== integritySha256 || value.briefSha256 !== brief.sha256 || value.identity?.initiative !== job.initiative || value.identity?.jobId !== job.id) throw Error('invalid-intake');
      intake = { status: 'bound', path: file.path, sha256: file.sha256, modifiedAt: file.modifiedAt, preparation: value.preparation, sourceObservedAt: value.source?.observedAt ?? null };
    } catch (error) { if (error.code !== 'ENOENT') intake = { status: 'unknown', reason: 'invalid-or-unsafe-intake' }; }
    return { status: 'recorded', brief: { path: brief.path, sha256: brief.sha256, modifiedAt: brief.modifiedAt }, intake, reports };
  } catch (error) { return { status: error.code === 'ENOENT' ? 'not-prepared' : 'unknown', reason: error.code === 'ENOENT' ? 'missing-job-or-brief' : 'invalid-or-unsafe-artifact' }; }
}
export async function status({ project, initiative }) {
  const observedAt = new Date().toISOString();
  const limits = 'Reported plan progress and artifact snapshots only. File modification times are not process heartbeats or proof of freshness. No runtime process, GitHub, acceptance or dependency satisfaction is verified; evidence text is not independently authenticated. Files are read separately, not as one atomic snapshot.';
  let record;
  try { record = await plan({ action: 'read', project, initiative }); }
  catch { return { status: 'unknown', observedAt, reason: 'unreadable-or-unsafe-plan', executionAuthorized: false, processState: 'not-inspected', freshness: 'not-verified', limits }; }
  if (record.status === 'absent') return { status: 'absent', observedAt, executionAuthorized: false, processState: 'not-inspected', freshness: 'not-verified', limits };
  try {
    const file = await snapshot(record.path);
    if (file.sha256 !== record.sha256) throw Error('changed-plan');
    if (!record.markdown.startsWith(`# ${initiative}: `)) throw Error('invalid-plan-identity');
    const parsed = parse(record.markdown), jobs = [];
    for (const job of parsed) {
      const { briefName, ...fields } = job;
      jobs.push({ ...fields, artifacts: await artifacts(dirname(record.path), { ...job, initiative }), processState: 'not-inspected' });
    }
    return { status: 'observed', observedAt, initiative, plan: { path: file.path, sha256: file.sha256, modifiedAt: file.modifiedAt }, jobs, executionAuthorized: false, processState: 'not-inspected', freshness: 'not-verified', limits };
  } catch { return { status: 'unknown', observedAt, reason: 'invalid-or-changing-plan', executionAuthorized: false, processState: 'not-inspected', freshness: 'not-verified', limits }; }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = {}, parts = process.argv.slice(2);
    for (let i = 0; i < parts.length; i += 2) {
      if (!['--project', '--initiative'].includes(parts[i]) || !parts[i + 1] || Object.hasOwn(args, parts[i])) throw Error('invalid status option');
      args[parts[i]] = parts[i + 1];
    }
    if (!args['--project'] || !args['--initiative']) throw Error('project and initiative required');
    console.log(JSON.stringify(await status({ project: args['--project'], initiative: args['--initiative'] }), null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
