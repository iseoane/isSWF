import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, readdir, lstat, open, link, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { workspaceTree } from './native-recovery.mjs';
import { externalEffect } from './external-effect-journal.mjs';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const encoded = value => JSON.stringify(value);
const digest = value => hash(encoded(value));
const entries = tree => Object.keys(tree).sort().map(path => [path, tree[path]]);
const reference = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 1000 && !/[\x00-\x1f\x7f]/.test(value);
const hexadecimal = value => typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);

async function prEvidence(store, logicalJobRef) {
  const directory = join(store, 'effects'), evidence = [];
  let names;
  try { names = await readdir(directory); } catch (error) { if (error.code === 'ENOENT') return evidence; throw error; }
  for (const name of names.sort()) {
    if (!/^[0-9a-f]{64}$/.test(name)) throw Error('ambiguous PR journal blocks recovery review');
    const record = JSON.parse(await readFile(join(directory, name, 'intent.json'), 'utf8'));
    if (!record.intent || record.intent.key !== name || !reference(record.intent.logicalJobRef)) throw Error('corrupt PR journal blocks recovery review');
    if (record.intent.logicalJobRef !== logicalJobRef) continue;
    const observed = await externalEffect({ action: 'inspect', store, intent: record.intent });
    if (!['prepared', 'confirmed'].includes(observed.state)) throw Error('uncertain submitted PR blocks recovery review');
    for (const file of ['intent.json', 'submitted.json', 'outcome.json']) {
      try { evidence.push([name + '/' + file, hash(await readFile(join(directory, name, file)))]); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  }
  return evidence;
}

async function snapshot(load) {
  const context = await load();
  const { observation, binding, dispatch, job, baseline, attemptDir, store } = context;
  if (observation.state !== 'unknown' || observation.recovery?.status !== 'stopped-review-required') throw Error('known stopped native recovery required for candidate review');
  const tree = await workspaceTree(dispatch.workspace);
  const changed = [...new Set([...Object.keys(baseline), ...Object.keys(tree)])].filter(path => encoded(baseline[path]) !== encoded(tree[path])).sort();
  if (encoded(changed) !== encoded(observation.recovery.changedPaths) || changed.some(path => tree[path]?.kind !== 'file' || tree[path].sha256 !== observation.recovery.candidateHashes[path] || !job.expectedMutablePaths.includes(path) || (baseline[path]?.kind === 'file' && tree[path].executable !== baseline[path].executable))) throw Error('candidate changed during recovery observation');
  if (!reference(job.protectedCheckCommand)) throw Error('original committed protected check required');
  const evidence = [];
  for (const name of ['dispatch.json', 'owner.json', 'execution-child.json', 'native-recovery.json', 'task.mjs']) evidence.push([name, hash(await readFile(join(attemptDir, name)))]);
  for (const name of (await readdir(join(attemptDir, 'native-tools'))).sort()) evidence.push(['native-tools/' + name, hash(await readFile(join(attemptDir, 'native-tools', name)))]);
  const admissionKey = digest(['job-admission-v1', binding.repo, binding.logicalJobRef]);
  const candidate = {
    version: 1, attemptId: binding.attemptId, repo: binding.repo, logicalJobRef: binding.logicalJobRef,
    runtimeSha: binding.runtimeSha, methodologySha: binding.methodologySha,
    packageReceiptSha256: hash(await readFile(join(binding.packageRoot, '.isswf-package-receipt.json'))),
    inputSha: binding.inputSha, targetBase: binding.targetBase, jobPath: binding.jobPath, jobSha256: binding.jobSha256,
    models: binding.models, briefPath: binding.briefPath, briefSha256: binding.briefSha256, taskSha256: binding.taskSha256,
    admissionSha256: hash(await readFile(join(store, 'admissions', admissionKey + '.json'))),
    treeSha256: digest(entries(tree)),
    permissionModesSha256: digest(await Promise.all(['', ...Object.keys(tree).sort()].map(async path => [path, (await lstat(join(dispatch.workspace, path))).mode & 0o7777]))),
    changedEntries: changed.map(path => [path, tree[path]]),
    nativeEvidenceSha256: digest(evidence), protectedCheckCommandSha256: hash(job.protectedCheckCommand),
    nodeSha256: hash(await readFile(process.execPath)), bwrapSha256: hash(await readFile('/usr/bin/bwrap')),
    knownPrEvidenceSha256: digest(await prEvidence(store, binding.logicalJobRef)),
  };
  return { context, candidate, fingerprint: digest(candidate) };
}

async function receipt(path) {
  try {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 1024 * 1024) throw Error('invalid review receipt');
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) { if (error.code === 'ENOENT') return null; throw Error('corrupt review receipt'); }
}
function validateReceipt(value, current) {
  if (!value || value.version !== 1 || value.fingerprint !== current.fingerprint || encoded(value.candidate) !== encoded(current.candidate) || !reference(value.approval?.grantRef) || !reference(value.approval?.reviewRef) || !hexadecimal(value.approval?.sha256) || value.approval.independentReview !== true || value.approval.verdict !== 'pass' || value.protectedCheck?.exitCode !== 0 || !hexadecimal(value.protectedCheck?.stdoutSha256) || !hexadecimal(value.protectedCheck?.stderrSha256)) throw Error('review receipt missing, stale or mismatched');
}
function protectedCheck(current) {
  const args = ['--unshare-user', '--unshare-pid', '--unshare-net', '--unshare-ipc', '--unshare-uts', '--new-session', '--die-with-parent', '--cap-drop', 'ALL', '--clearenv', '--ro-bind', '/usr', '/usr', '--symlink', 'usr/bin', '/bin', '--symlink', 'usr/lib', '/lib', '--symlink', 'usr/lib', '/lib64', '--proc', '/proc', '--dev', '/dev', '--tmpfs', '/tmp', '--dir', '/tmp/home', '--ro-bind', process.execPath, '/runtime/node', '--ro-bind', current.context.dispatch.workspace, '/work', '--chdir', '/work', '--remount-ro', '/', '--setenv', 'PATH', '/runtime:/usr/bin:/bin', '--setenv', 'HOME', '/tmp/home', '--setenv', 'LANG', 'C.UTF-8', '--', '/bin/sh', '-c', current.context.job.protectedCheckCommand];
  const result = spawnSync('/usr/bin/bwrap', args, { encoding: 'buffer', timeout: 10000, killSignal: 'SIGKILL', maxBuffer: 16000, env: { PATH: '/usr/bin:/bin' }, stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.error || result.status !== 0 || result.signal) throw Error('original protected check failed, timed out or exceeded output bound');
  return { exitCode: 0, stdoutSha256: hash(result.stdout), stderrSha256: hash(result.stderr) };
}
async function publish(directory, value) {
  const pending = join(directory, '.review-' + randomUUID());
  const file = await open(pending, 'wx', 0o600);
  try { await file.writeFile(encoded(value) + '\n'); await file.sync(); } finally { await file.close(); }
  try {
    await link(pending, join(directory, 'recovery-review-receipt.json'));
    const parent = await open(directory, 'r');
    try { await parent.sync(); } finally { await parent.close(); }
  } finally { await unlink(pending); }
}

export async function recoveryReview({ action, load, approval }) {
  if (!['inspect', 'record', 'check'].includes(action)) throw Error('review action must be inspect, record or check');
  const current = await snapshot(load);
  if (action === 'inspect') return { status: 'review-required', fingerprint: current.fingerprint, candidate: current.candidate, successorAuthorized: false, providerCharge: 'not-reconciled' };
  const path = join(current.context.attemptDir, 'recovery-review-receipt.json');
  const existing = await receipt(path);
  if (action === 'check') {
    validateReceipt(existing, current);
    return { status: 'valid', fingerprint: current.fingerprint, receiptSha256: hash(await readFile(path)), successorAuthorized: false, providerCharge: 'not-reconciled' };
  }
  if (!approval || approval.version !== 1 || !reference(approval.grantRef) || !reference(approval.reviewRef) || approval.independentReview !== true || approval.verdict !== 'pass' || approval.allowProtectedCheck !== true || approval.fingerprint !== current.fingerprint || approval.protectedCheckCommandSha256 !== current.candidate.protectedCheckCommandSha256) throw Error('matching trusted independent review approval and protected-check grant required');
  const identity = { grantRef: approval.grantRef, reviewRef: approval.reviewRef, independentReview: true, verdict: 'pass', sha256: digest(approval) };
  if (existing) {
    validateReceipt(existing, current);
    if (encoded(existing.approval) !== encoded(identity)) throw Error('conflicting review approval; receipt is write-once');
  } else {
    const check = protectedCheck(current);
    const after = await snapshot(load);
    if (after.fingerprint !== current.fingerprint) throw Error('candidate or evidence changed during protected check');
    const value = { version: 1, fingerprint: current.fingerprint, candidate: current.candidate, approval: identity, protectedCheck: check };
    try { await publish(current.context.attemptDir, value); }
    catch (error) {
      if (error.code !== 'EEXIST' || encoded(await receipt(path)) !== encoded(value)) throw error;
    }
  }
  return { status: 'valid', fingerprint: current.fingerprint, receiptSha256: hash(await readFile(path)), successorAuthorized: false, providerCharge: 'not-reconciled' };
}
