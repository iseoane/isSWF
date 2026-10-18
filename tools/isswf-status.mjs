#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, opendir, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { plan } from './isswf-plan.mjs';
import { intake as readIntake } from './isswf-intake.mjs';

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
async function deliveryAt(path) {
  try {
    const file = await snapshot(join(path, 'delivery.md'));
    if (Buffer.byteLength(file.text) > 32768) throw Error('oversized-delivery');
    const allowed = new Set(['What changed and why', 'Visual summary', 'Scope', 'Checks and results', 'Independent review', 'Closure and acceptance', 'Integration risk and recovery', 'Blockers and next action']);
    const sections = {}; let current;
    for (const line of file.text.split('\n')) {
      if (line.startsWith('## ')) {
        const name = line.slice(3); current = allowed.has(name) ? name : null;
        if (current) { if (Object.hasOwn(sections, current)) throw Error('duplicate-delivery-section'); sections[current] = ''; }
      } else if (current) sections[current] += line + '\n';
    }
    if (!Object.keys(sections).length) throw Error('missing-delivery-sections');
    for (const name of Object.keys(sections)) sections[name] = sections[name].trim().replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/gu, '\ufffd');
    return { status: 'recorded', path: file.path, sha256: file.sha256, modifiedAt: file.modifiedAt, sections, provenance: 'curated delivery record; assertions not independently authenticated' };
  } catch (error) { return { status: error.code === 'ENOENT' ? 'absent' : 'unknown', reason: error.code === 'ENOENT' ? 'no-delivery-summary' : 'invalid-or-unsafe-delivery' }; }
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
      const declaredMetadata = {};
      for (const line of report.text.split('\n')) {
        const field = /^- (Actor|Actual model|Requested model and effort|Observed actual model and effort metadata|Profile path and revision, if available|Skills and revisions, if available|Resolved ordered route and selected destination): (.+)$/u.exec(line);
        if (!field) continue;
        if (Object.hasOwn(declaredMetadata, field[1])) declaredMetadata[field[1]] = 'Unknown: duplicate metadata field';
        else declaredMetadata[field[1]] = field[2].length <= 1024 ? field[2].replace(/[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/gu, '\ufffd') : 'Unknown: oversized metadata field';
      }
      reports.push({ path: report.path, sha256: report.sha256, modifiedAt: report.modifiedAt, reportedStatus, declaredMetadata });
    }
    let intake = { status: 'absent' };
    try {
      const file = await snapshot(join(path, job.briefName === 'brief-r1.md' ? 'intake.json' : job.briefName.replace('brief-', 'intake-').replace('.md', '.json'))), value = JSON.parse(file.text);
      const { integritySha256, ...payload } = value;
      if ((value.revision ?? 1) !== Number(/^brief-r([0-9]+)\.md$/u.exec(job.briefName)[1]) || value.version !== 1 || value.project !== resolve(root, '../../..') || !['needs-info', 'ready-for-agent'].includes(value.preparation) || sha(JSON.stringify(payload)) !== integritySha256 || value.briefSha256 !== brief.sha256 || value.identity?.initiative !== job.initiative || value.identity?.jobId !== job.id) throw Error('invalid-intake');
      intake = { status: 'bound', path: file.path, sha256: file.sha256, modifiedAt: file.modifiedAt, preparation: value.preparation, sourceObservedAt: value.source?.observedAt ?? null };
      try {
        await snapshot(join(path, 'duplicate.json'));
        const disposition = await readIntake({ action: 'read', project: value.project, repository: value.identity.repository, issue: value.identity.issue, initiative: value.identity.initiative, jobId: value.identity.jobId, type: value.identity.type, revision: value.revision ?? 1 });
        if (disposition.status !== 'duplicate-linked') throw Error('invalid-duplicate');
        intake.duplicate = disposition.duplicate;
        intake.executionAuthorized = false;
      } catch (error) { if (error.code !== 'ENOENT') throw error; }

    } catch (error) { if (error.code !== 'ENOENT') intake = { status: 'unknown', reason: 'invalid-or-unsafe-intake' }; }
    return { status: 'recorded', brief: { path: brief.path, sha256: brief.sha256, modifiedAt: brief.modifiedAt }, intake, reports, delivery: await deliveryAt(path) };
  } catch (error) { return { status: error.code === 'ENOENT' ? 'not-prepared' : 'unknown', reason: error.code === 'ENOENT' ? 'missing-job-or-brief' : 'invalid-or-unsafe-artifact' }; }
}
export async function initiatives({ project }) {
  const observedAt = new Date().toISOString(), entries = [];
  try {
    await directory(join(project, '.factory')); await directory(join(project, '.factory/initiatives'));
    const dir = await opendir(join(project, '.factory/initiatives'));
    for await (const entry of dir) {
      if (entries.length >= 100) throw Error('too-many-initiatives');
      entries.push(entry.name);
    }
  } catch (error) { return { status: error.code === 'ENOENT' ? 'absent' : 'unknown', observedAt, reason: error.code === 'ENOENT' ? 'no-initiative-directory' : 'unsafe-or-oversized-initiative-directory', initiatives: [] }; }
  const items = [];
  for (const initiative of entries.sort()) {
    if (!/^[A-Z][A-Z0-9-]{0,63}$/u.test(initiative)) continue;
    try {
      const record = await plan({ action: 'read', project, initiative });
      if (record.status === 'absent') { items.push({ initiative, status: 'absent', reason: 'missing-plan' }); continue; }
      const file = await snapshot(record.path);
      if (file.sha256 !== record.sha256) throw Error('changed-plan');
      const prefix = '# ' + initiative + ': ', heading = record.markdown.split('\n', 1)[0];
      const title = heading.startsWith(prefix) ? heading.slice(prefix.length) : '';
      if (!title.trim() || title.length > 4000 || /[\x00-\x1f\x7f]/u.test(title)) throw Error('invalid-title');
      const jobs = parse(record.markdown);
      items.push({ initiative, status: 'observed', title, label: initiative + ' · ' + title, counts: Object.fromEntries(states.map(state => [state, jobs.filter(job => job.reportedStatus === state).length])), jobs: jobs.length, blockers: jobs.filter(job => job.reportedStatus === 'blocked').map(job => ({ id: job.id, blocker: job.blocker })), planModifiedAt: file.modifiedAt });
    } catch { items.push({ initiative, status: 'unknown', reason: 'invalid-changing-or-unsafe-plan' }); }
  }
  return { status: 'observed', observedAt, initiatives: items, limits: 'Declared canonical plan states only; no live process, remote PR, freshness or dependency verification. Records are read separately.' };
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
    const heading = record.markdown.split('\n', 1)[0], prefix = `# ${initiative}: `;
    const title = heading.startsWith(prefix) ? heading.slice(prefix.length) : '';
    if (!title.trim() || title.length > 4000 || /[\x00-\x1f\x7f]/u.test(title)) throw Error('invalid-plan-identity');
    const parsed = parse(record.markdown), jobs = [];
    for (const job of parsed) {
      const { briefName, ...fields } = job;
      jobs.push({ ...fields, artifacts: await artifacts(dirname(record.path), { ...job, initiative }), processState: 'not-inspected' });
    }
    return { status: 'observed', observedAt, initiative, title, label: `${initiative} · ${title}`, plan: { path: file.path, sha256: file.sha256, modifiedAt: file.modifiedAt }, jobs, executionAuthorized: false, processState: 'not-inspected', freshness: 'not-verified', limits };
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
