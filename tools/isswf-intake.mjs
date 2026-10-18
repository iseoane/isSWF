#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, realpath, lstat, mkdir, open, link, unlink, rmdir } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { qualityInventory } from './project-quality.mjs';

const digest = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const text = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 16000 && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/u.test(value);
const hex = value => typeof value === 'string' && /^[0-9a-f]{64}$/u.test(value);
const within = (parent, path) => { const part = relative(parent, path); return part === '' || (!part.startsWith(`..${sep}`) && part !== '..' && !isAbsolute(part)); };
function repository(value) {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]*\/[a-z0-9_.-]+$/iu.test(value) || value.length > 200) throw Error('invalid repository');
  return value.toLowerCase();
}
function identity(repo, number) {
  if (!Number.isSafeInteger(number) || number < 1) throw Error('invalid issue number');
  const canonical = repository(repo);
  return { repository: canonical, issue: number, jobId: `S01-${number}-${digest([canonical, number])}` };
}
async function regular(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 256000) throw Error('bounded regular file required');
  return readFile(path, 'utf8');
}
async function json(path) { return JSON.parse(await regular(path)); }
async function projectRoot(project) {
  if (!isAbsolute(project ?? '')) throw Error('project must be absolute');
  const root = await realpath(project);
  const result = spawnSync('git', ['-C', root, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', timeout: 10000, env: { PATH: process.env.PATH, HOME: '/nonexistent', GIT_CONFIG_NOSYSTEM: '1', GIT_NO_REPLACE_OBJECTS: '1' } });
  if (result.status !== 0 || await realpath(result.stdout.trim()) !== root) throw Error('project must be a Git root');
  return root;
}
async function grantAt(path, project, expected) {
  if (!isAbsolute(path ?? '')) throw Error('explicit external prepare grant required');
  const grantPath = await realpath(path);
  if (within(project, grantPath)) throw Error('prepare grant must be outside the project');
  const value = await json(grantPath);
  if (Object.keys(value).sort().join(',') !== 'issue,permissions,project,reference,repository,version' || value.version !== 1 || value.project !== project || repository(value.repository) !== expected.repository || value.issue !== expected.issue || !text(value.reference) || JSON.stringify(value.permissions) !== '["prepare"]') throw Error('matching explicit prepare-only grant required');
  return { version: 1, project, repository: expected.repository, issue: expected.issue, reference: value.reference, permissions: ['prepare'] };
}
async function observationAt(path, expected) {
  const value = await json(path), issue = value.issue;
  if (!text(value.observedAt) || !Number.isFinite(Date.parse(value.observedAt)) || !issue || issue.number !== expected.issue || typeof issue.body !== 'string' || issue.body.length > 100000 || !text(issue.title) || !['OPEN', 'CLOSED'].includes(issue.state) || !text(issue.updatedAt) || !Number.isFinite(Date.parse(issue.updatedAt)) || !Array.isArray(issue.labels) || issue.labels.length > 100) throw Error('complete issue observation required');
  const url = new URL(issue.url);
  if (url.origin !== 'https://github.com' || url.search || url.hash || url.username || url.password || url.pathname.toLowerCase() !== `/${expected.repository}/issues/${expected.issue}`) throw Error('observed issue identity mismatch');
  const labels = issue.labels.map(label => { if (!text(label.name) || label.name.length > 100) throw Error('invalid observed label'); return label.name; }).sort();
  const source = { repository: expected.repository, issue: expected.issue, title: issue.title, bodySha256: digest(issue.body), labels, updatedAt: issue.updatedAt, state: issue.state };
  return { ...source, fingerprint: digest(source), observedAt: value.observedAt };
}
async function proposalAt(path, project) {
  const value = await json(path);
  if (Object.keys(value).sort().join(',') !== 'acceptance,exclusions,nextStep,objective,questions,scope,targetBase' || !text(value.objective) || !text(value.nextStep) || !/^[0-9a-f]{40}$/u.test(value.targetBase)) throw Error('complete curated proposal required');
  for (const field of ['scope', 'exclusions', 'acceptance', 'questions']) if (!Array.isArray(value[field]) || value[field].length > 30 || value[field].some(item => !text(item))) throw Error('invalid proposal list');
  if (!value.scope.length || (!value.questions.length && !value.acceptance.length)) throw Error('observable acceptance or pending questions required');
  const base = spawnSync('git', ['-C', project, 'cat-file', '-e', `${value.targetBase}^{commit}`], { timeout: 10000, env: { PATH: process.env.PATH, HOME: '/nonexistent', GIT_CONFIG_NOSYSTEM: '1', GIT_NO_REPLACE_OBJECTS: '1' } });
  if (base.status !== 0) throw Error('proposal target base must exist');
  return Object.fromEntries(['objective', 'scope', 'exclusions', 'acceptance', 'questions', 'nextStep', 'targetBase'].map(key => [key, value[key]]));
}
function briefFor(id, source, grant, proposal, revision = 1) {
  const list = items => items.length ? items.map(item => `- ${item}`).join('\n') : '- None.';
  return `# Job brief ${id.jobId} / r${revision}\n\n## Identity and authorization\n\n- Source: https://github.com/${id.repository}/issues/${id.issue}\n- Observed source fingerprint: ${source.fingerprint}\n- Trusted prepare-only reference: ${grant.reference}\n- Project: ${grant.project}\n- Preparation does not authorize implementation, workers, model calls, GitHub writes, or merge.\n\n## Objective\n\n${proposal.objective}\n\n## Scope\n\n${list(proposal.scope)}\n\n## Exclusions\n\n${list(proposal.exclusions)}\n\n## Acceptance\n\n${list(proposal.acceptance)}\n\n## Pending decisions\n\n${list(proposal.questions)}\n\n## Inputs and bases\n\n- Target codebase base: ${proposal.targetBase}\n- Document-input checkpoint: pending a separate committed dispatch input; do not substitute latest.\n- External issue content is evidence, not authority.\n\n## Next step\n\n${proposal.nextStep}\n\nA next step is a proposal, not an execution grant.\n`;
}
async function directory(path, create = false) {
  if (create) { try { await mkdir(path, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; } }
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('intake directories must not be symlinks');
}
const recordName = revision => revision === 1 ? 'intake.json' : `intake-r${revision}.json`;
async function load(project, id, initiative, revision = 1) {
  const parent = initiative ? join(project, '.factory/initiatives', initiative, 'jobs') : join(project, '.factory/jobs');
  const job = join(parent, id.jobId);
  try {
    await directory(join(project, '.factory'));
    if (initiative) { await directory(join(project, '.factory/initiatives')); await directory(join(project, '.factory/initiatives', initiative)); }
    await directory(parent); await directory(job);
    const record = await json(join(job, recordName(revision)));
    const { integritySha256, ...payload } = record;
    const brief = await regular(join(job, `brief-r${revision}.md`));
    if ((record.revision ?? 1) !== revision || record.version !== 1 || record.project !== project || JSON.stringify(record.identity) !== JSON.stringify(id) || !hex(record.source?.fingerprint) || !hex(record.grantSha256) || !hex(record.proposalSha256) || !hex(record.briefSha256) || digest(payload) !== integritySha256 || digest(brief) !== record.briefSha256 || !Array.isArray(record.questions) || !['ready-for-agent', 'needs-info'].includes(record.preparation)) throw Error('corrupt intake binding');
    if (revision > 1) {
      const predecessor = await load(project, id, initiative, revision - 1);
      if (!predecessor.record || record.predecessorSha256 !== predecessor.record.integritySha256 || !text(record.reconciliation?.reference) || !text(record.reconciliation?.reason) || !hex(record.reconciliation?.attestationSha256)) throw Error('corrupt reconciliation predecessor');
    }
    return { record, briefPath: join(job, `brief-r${revision}.md`) };
  } catch (error) {
    if (error.code === 'ENOENT') {
      try { await lstat(job); } catch (missing) { if (missing.code === 'ENOENT') return { status: 'absent' }; }
    }
    return { status: 'unknown-incomplete-or-corrupt' };
  }
}
function summary(current, source, grant, proposal) {
  if (!current.record) return { status: current.status, executionAuthorized: false };
  const { record } = current, reasons = [];
  if (source && source.fingerprint !== record.source.fingerprint) reasons.push('source-changed');
  if (grant && digest(grant) !== record.grantSha256) reasons.push('grant-changed');
  if (proposal && digest(proposal) !== record.proposalSha256) reasons.push('proposal-changed');
  return { status: reasons.length ? 'reconciliation-required' : 'prepared', identity: record.identity, briefPath: current.briefPath, briefSha256: record.briefSha256, revision: record.revision ?? 1, recordSha256: record.integritySha256, preparation: record.preparation, source: record.source, observation: source ?? null, freshness: source ? 'supplied-observation-not-live-query' : 'last-observed-only', authority: grant ? 'supplied-prepare-grant-checked' : 'not-rechecked', pendingDecisions: [...record.questions, ...reasons], executionAuthorized: false };
}
async function synced(path, bytes) {
  const file = await open(path, 'wx', 0o600);
  try { await file.writeFile(bytes); await file.sync(); } finally { await file.close(); }
}
async function syncDirectory(path) { const handle = await open(path, 'r'); try { await handle.sync(); } finally { await handle.close(); } }
async function reconcile({ root, id, initiative, revision, reconciliationPath, grant, source, proposal }) {
  if (!isAbsolute(reconciliationPath ?? '')) throw Error('external reconciliation attestation required');
  const external = await realpath(reconciliationPath);
  if (within(root, external)) throw Error('reconciliation attestation must be external');
  const authority = await json(external);
  if (Object.keys(authority).sort().join(',') !== 'expected,issue,permissions,project,reason,reference,repository,revision,version' || authority.version !== 1 || authority.project !== root || repository(authority.repository) !== id.repository || authority.issue !== id.issue || authority.revision !== revision || !text(authority.reference) || !text(authority.reason) || JSON.stringify(authority.permissions) !== '["reconcile"]' || !authority.expected || Object.keys(authority.expected).sort().join(',') !== 'briefSha256,recordSha256' || !hex(authority.expected.recordSha256) || !hex(authority.expected.briefSha256)) throw Error('matching explicit reconciliation attestation required');
  const predecessor = await load(root, id, initiative, revision - 1);
  if (!predecessor.record || predecessor.record.integritySha256 !== authority.expected.recordSha256 || predecessor.record.briefSha256 !== authority.expected.briefSha256) throw Error('reconciliation predecessor conflict');
  const job = join(root, initiative ? '.factory/initiatives/' + initiative + '/jobs' : '.factory/jobs', id.jobId);
  let brief = briefFor(id, source, grant, proposal, revision);
  if (initiative) {
    const inventory = await qualityInventory(root);
    brief += '\n## Project quality inventory\n\n' + Object.entries(inventory.checks).map(([name, check]) => '- ' + name + ': ' + check.state + '. Evidence: ' + (check.evidence.join(', ') || 'none detected') + '. ' + check.recommendation).join('\n') + '\n\n' + inventory.limits + '\n';
  }
  brief += '\n## Explicit reconciliation\n\n- Operator reference: ' + authority.reference + '\n- Reason: ' + authority.reason + '\n- Predecessor record SHA256: ' + predecessor.record.integritySha256 + '\n- Plan adoption remains a separate coordinator action.\n';
  const payload = { version: 1, revision, predecessorSha256: predecessor.record.integritySha256, project: root, identity: id, source, grantSha256: digest(grant), proposalSha256: digest(proposal), briefSha256: digest(brief), preparation: proposal.questions.length ? 'needs-info' : 'ready-for-agent', questions: proposal.questions, reconciliation: { reference: authority.reference, reason: authority.reason, attestationSha256: digest(authority) } };
  const recordBytes = JSON.stringify({ ...payload, integritySha256: digest(payload) }) + '\n';
  if (Buffer.byteLength(brief) > 256000 || Buffer.byteLength(recordBytes) > 256000) throw Error('reconciliation exceeds byte limit');
  const existing = await load(root, id, initiative, revision);
  if (existing.record) {
    if (existing.record.integritySha256 !== digest(payload)) throw Error('reconciliation revision conflict');
    return { ...summary(existing, source, grant, proposal), status: 'reused' };
  }
  const briefPath = join(job, 'brief-r' + revision + '.md'), recordPath = join(job, recordName(revision));
  for (const path of [briefPath, recordPath]) {
    try { await lstat(path); throw Error('incomplete reconciliation requires inspection'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const lock = join(job, '.intake-write');
  await mkdir(lock, { mode: 0o700 });
  const fresh = await load(root, id, initiative, revision - 1);
  if (fresh.record?.integritySha256 !== predecessor.record.integritySha256) throw Error('reconciliation predecessor changed');
  await synced(briefPath, brief); await syncDirectory(job);
  const pending = join(lock, randomUUID());
  await synced(pending, recordBytes); await link(pending, recordPath); await syncDirectory(job);
  await unlink(pending); await rmdir(lock); await syncDirectory(job);
  return { ...summary(await load(root, id, initiative, revision), source, grant, proposal), status: 'reconciled' };
}
function duplicateIdentity(value) {
  const scoped = value?.initiative !== undefined;
  const keys = scoped ? 'initiative,issue,jobId,repository,type' : (value?.jobId === undefined ? 'issue,repository' : 'issue,jobId,repository');
  if (!value || Object.keys(value).sort().join(',') !== keys) throw Error('invalid duplicate target identity');
  const id = identity(value.repository, value.issue);
  if (!scoped && value.jobId !== undefined && value.jobId !== id.jobId) throw Error('invalid derived duplicate identity');
  if (scoped) {
    if (!/^[A-Z][A-Z0-9-]{0,63}$/u.test(value.initiative) || !/^[A-Z][A-Z0-9-]{0,63}$/u.test(value.jobId) || !['bug', 'enhancement', 'maintenance', 'research'].includes(value.type)) throw Error('invalid duplicate target scope');
    Object.assign(id, { initiative: value.initiative, jobId: value.jobId, type: value.type });
  }
  return id;
}
async function unlinkedTarget(root, id) {
  try { await lstat(join(jobPath(root, id), 'duplicate.json')); throw Error('duplicate target is already linked'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
function jobPath(root, id) { return join(root, id.initiative ? '.factory/initiatives/' + id.initiative + '/jobs' : '.factory/jobs', id.jobId); }
async function duplicateAt(root, id) {
  let value;
  try {
    await directory(join(root, '.factory'));
    if (id.initiative) { await directory(join(root, '.factory/initiatives')); await directory(join(root, '.factory/initiatives', id.initiative)); }
    await directory(join(root, id.initiative ? '.factory/initiatives/' + id.initiative + '/jobs' : '.factory/jobs'));
    await directory(jobPath(root, id));
    value = await json(join(jobPath(root, id), 'duplicate.json'));
  } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  const { integritySha256, ...payload } = value;
  if (value.version !== 1 || digest(payload) !== integritySha256 || JSON.stringify(value.source?.identity) !== JSON.stringify(id) || !text(value.reference) || !text(value.reason) || !Array.isArray(value.evidence) || !value.evidence.length || value.evidence.length > 30 || value.evidence.some(item => !text(item.reference) || !text(item.observation))) throw Error('invalid duplicate binding');
  for (const ref of [value.source, value.target]) {
    const target = duplicateIdentity(ref.identity);
    if (!Number.isSafeInteger(ref.revision) || ref.revision < 1 || ref.revision > 10000) throw Error('invalid duplicate revision');
    const current = await load(root, target, target.initiative, ref.revision);
    if (!current.record || current.record.integritySha256 !== ref.recordSha256 || current.record.briefSha256 !== ref.briefSha256) throw Error('duplicate reference changed or unavailable');
  }
  await unlinkedTarget(root, value.target.identity);
  if (jobPath(root, id) === jobPath(root, value.target.identity)) throw Error('duplicate cannot target itself');
  return value;
}
async function linkDuplicate(root, id, revision, path) {
  if (!isAbsolute(path ?? '')) throw Error('external duplicate decision required');
  const external = await realpath(path);
  if (within(root, external)) throw Error('duplicate decision must be external');
  const decision = await json(external);
  if (Object.keys(decision).sort().join(',') !== 'evidence,permissions,project,reason,reference,source,target,version' || decision.version !== 1 || decision.project !== root || JSON.stringify(decision.permissions) !== '["link-duplicate"]' || !text(decision.reference) || !text(decision.reason) || !Array.isArray(decision.evidence) || !decision.evidence.length || decision.evidence.length > 30 || decision.evidence.some(item => Object.keys(item).sort().join(',') !== 'observation,reference' || !text(item.reference) || !text(item.observation))) throw Error('matching explicit duplicate decision and evidence required');
  for (const ref of [decision.source, decision.target]) if (!ref || Object.keys(ref).sort().join(',') !== 'briefSha256,identity,recordSha256,revision' || !hex(ref.recordSha256) || !hex(ref.briefSha256)) throw Error('pinned duplicate references required');
  const sourceId = duplicateIdentity(decision.source.identity);
  if (JSON.stringify(sourceId) !== JSON.stringify(id) || decision.source.revision !== revision) throw Error('duplicate source identity/revision mismatch');
  const payload = { version: 1, source: { ...decision.source, identity: sourceId }, target: { ...decision.target, identity: duplicateIdentity(decision.target.identity) }, reference: decision.reference, reason: decision.reason, evidence: decision.evidence, decisionSha256: digest(decision) };
  const record = { ...payload, integritySha256: digest(payload) };
  const existing = await duplicateAt(root, id);
  if (existing) {
    if (existing.integritySha256 !== record.integritySha256) throw Error('duplicate decision conflict');
    return { status: 'duplicate-linked', duplicate: existing, executionAuthorized: false };
  }
  for (const ref of [record.source, record.target]) {
    if (!Number.isSafeInteger(ref.revision) || ref.revision < 1 || ref.revision > 10000) throw Error('invalid duplicate revision');
    const bound = await load(root, ref.identity, ref.identity.initiative, ref.revision);
    if (!bound.record || bound.record.integritySha256 !== ref.recordSha256 || bound.record.briefSha256 !== ref.briefSha256) throw Error('duplicate reference changed or unavailable');
  }
  await unlinkedTarget(root, record.target.identity);
  if (jobPath(root, id) === jobPath(root, record.target.identity)) throw Error('duplicate cannot target itself');
  const job = jobPath(root, id), lock = join(job, '.intake-write');
  await mkdir(lock, { mode: 0o700 });
  const pending = join(lock, randomUUID());
  const bytes = JSON.stringify(record) + '\n';
  if (Buffer.byteLength(bytes) > 256000) throw Error('duplicate decision exceeds byte limit');
  await synced(pending, bytes); await link(pending, join(job, 'duplicate.json')); await syncDirectory(job);
  await unlink(pending); await rmdir(lock); await syncDirectory(job);
  return { status: 'duplicate-linked', duplicate: await duplicateAt(root, id), executionAuthorized: false };
}
export async function intake({ action, project, repository: repo, issue, sourcePath, grantPath, proposalPath, initiative, jobId, type, revision = 1, reconciliationPath, duplicatePath }) {
  if (!['prepare', 'read', 'reconcile', 'link-duplicate'].includes(action)) throw Error('action must be prepare, read or reconcile');
  if (!Number.isSafeInteger(revision) || revision < 1 || revision > 10000 || (action === 'prepare' && revision !== 1) || (action === 'reconcile' && revision < 2)) throw Error('invalid explicit revision');
  const root = await projectRoot(project), id = identity(repo, issue);
  if (initiative !== undefined) {
    if (!/^[A-Z][A-Z0-9-]{0,63}$/u.test(initiative) || !/^[A-Z][A-Z0-9-]{0,63}$/u.test(jobId ?? '') || !['bug', 'enhancement', 'maintenance', 'research'].includes(type)) throw Error('initiative, job and type required');
    await directory(join(root, '.factory')); await directory(join(root, '.factory/initiatives')); await directory(join(root, '.factory/initiatives', initiative));
    const plan = await regular(join(root, '.factory/initiatives', initiative, 'plan.md'));
    if (!plan.includes(`## ${jobId}\n`)) throw Error('job must be present in initiative plan');
    Object.assign(id, { initiative, jobId, type });
  } else if (jobId !== undefined || type !== undefined) throw Error('job/type requires initiative');
  if (action === 'link-duplicate') return linkDuplicate(root, id, revision, duplicatePath);
  let duplicate;
  try { duplicate = await duplicateAt(root, id); } catch (error) {
    if (action === 'read') return { status: 'unknown-incomplete-or-corrupt', executionAuthorized: false };
    throw error;
  }
  if (duplicate) return { status: 'duplicate-linked', duplicate, executionAuthorized: false };
  const grant = grantPath ? await grantAt(grantPath, root, id) : null;
  const source = sourcePath ? await observationAt(sourcePath, id) : null;
  const proposal = proposalPath ? await proposalAt(proposalPath, root) : null;
  if (action !== 'read' && (!grant || !source || !proposal)) throw Error('prepare requires external grant, observed source and curated proposal');
  if (action === 'reconcile') return reconcile({ root, id, initiative, revision, reconciliationPath, grant, source, proposal });
  let brief, recordBytes;
  if (action === 'prepare') {
    brief = briefFor(id, source, grant, proposal);
    if (initiative) {
      const inventory = await qualityInventory(root);
      brief += '\n## Project quality inventory\n\n' + Object.entries(inventory.checks).map(([name, check]) => `- ${name}: ${check.state}. Evidence: ${check.evidence.join(', ') || 'none detected'}. ${check.recommendation}`).join('\n') + `\n\n${inventory.limits}\n`;
    }
    const payload = { version: 1, project: root, identity: id, source, grantSha256: digest(grant), proposalSha256: digest(proposal), briefSha256: digest(brief), preparation: proposal.questions.length ? 'needs-info' : 'ready-for-agent', questions: proposal.questions };
    recordBytes = JSON.stringify({ ...payload, integritySha256: digest(payload) }) + '\n';
    if (Buffer.byteLength(brief) > 256000 || Buffer.byteLength(recordBytes) > 256000) throw Error('prepared brief or record exceeds byte limit');
  }
  const current = await load(root, id, initiative, revision);
  if (action === 'read' || current.status !== 'absent') {
    const result = summary(current, source, grant, proposal);
    if (action === 'prepare' && result.status === 'prepared') result.status = 'reused';
    return result;
  }
  await directory(join(root, '.factory'), true);
  const parent = initiative ? join(root, '.factory/initiatives', initiative, 'jobs') : join(root, '.factory/jobs');
  await directory(parent, true);
  const job = join(parent, id.jobId);
  try { await mkdir(job, { mode: 0o700 }); } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    const result = summary(await load(root, id, initiative), source, grant, proposal);
    return result.status === 'prepared' ? { ...result, status: 'reused' } : result;
  }
  await syncDirectory(parent);
  await synced(join(job, 'brief-r1.md'), brief);
  const pending = join(job, '.intake-' + randomUUID());
  await synced(pending, recordBytes);
  await link(pending, join(job, 'intake.json')); await unlink(pending); await syncDirectory(job);
  return summary(await load(root, id, initiative), source, grant, proposal);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [action, ...values] = process.argv.slice(2), args = {};
    for (let i = 0; i < values.length; i += 2) {
      if (!['--project', '--repository', '--issue', '--source', '--grant', '--proposal', '--initiative', '--job', '--type', '--revision', '--reconciliation', '--duplicate'].includes(values[i]) || !values[i + 1] || Object.hasOwn(args, values[i])) throw Error('invalid intake option');
      args[values[i]] = values[i + 1];
    }
    const result = await intake({ action, project: args['--project'], repository: args['--repository'], issue: Number(args['--issue']), sourcePath: args['--source'], grantPath: args['--grant'], proposalPath: args['--proposal'], initiative: args['--initiative'], jobId: args['--job'], type: args['--type'], revision: args['--revision'] === undefined ? 1 : Number(args['--revision']), reconciliationPath: args['--reconciliation'], duplicatePath: args['--duplicate'] });
    console.log(JSON.stringify(result, null, 2));
    if (action !== 'read' && !(action === 'link-duplicate' && result.status === 'duplicate-linked') && !['prepared', 'reused', 'reconciled'].includes(result.status)) process.exitCode = 2;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
