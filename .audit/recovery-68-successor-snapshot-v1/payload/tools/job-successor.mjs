import { createHash, randomUUID } from 'node:crypto';
import { readFile, mkdir, lstat, open, link, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { recoveryReview } from './recovery-review.mjs';

const encode = value => JSON.stringify(value);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const digest = value => hash(encode(value));
const same = (left, right) => encode(left) === encode(right);
const reference = value => typeof value === 'string' && value.trim() && value.length <= 1000 && !/[\x00-\x1f\x7f]/.test(value);
const safeId = value => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/.test(value);

export function admission(binding) {
  const key = digest(['job-admission-v1', binding.repo, binding.logicalJobRef]);
  return { version: 1, key, repo: binding.repo, logicalJobRef: binding.logicalJobRef, attemptId: binding.attemptId, inputSha: binding.inputSha, jobSha256: binding.jobSha256, grantRef: binding.grantRef, workerTotal: 1 };
}
const requestKeys = ['repo', 'logicalJobRef', 'attemptId', 'grantRef', 'packageRoot', 'runtimeSha', 'methodologySha', 'inputSha', 'targetBase', 'jobPath', 'jobSha256', 'models', 'briefPath', 'briefSha256', 'mode'];
const requestOf = binding => Object.fromEntries(requestKeys.map(key => [key, binding[key]]));
async function regularJSON(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 64000) throw Error('invalid successor admission evidence');
  const bytes = await readFile(path);
  return { bytes, value: JSON.parse(bytes) };
}
async function publish(directory, key, value) {
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const stat = await lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('successor directory must be a real private directory');
  const sync = async path => { const file = await open(path, 'r'); try { await file.sync(); } finally { await file.close(); } };
  await sync(join(directory, '..'));
  const pending = join(directory, '.pending-' + randomUUID());
  const file = await open(pending, 'wx', 0o600);
  try { await file.writeFile(encode(value) + '\n'); await file.sync(); } finally { await file.close(); }
  try {
    try { await link(pending, join(directory, key + '.json')); }
    catch (error) { if (error.code === 'EEXIST') throw Error('predecessor successor slot already consumed; no retry or replacement'); throw error; }
    await sync(directory);
  } finally { await unlink(pending); }
}

export async function claimSuccessor({ store, request, job, baseline, grant, load }) {
  const context = await load(), prior = context.binding;
  if (prior.successor || prior.attemptId === request.attemptId || prior.inputSha === request.inputSha) throw Error('only one original-to-successor edge with new input/attempt is supported');
  if (prior.repo !== request.repo || prior.logicalJobRef !== request.logicalJobRef || prior.runtimeSha !== request.runtimeSha || prior.packageRoot !== request.packageRoot) throw Error('same project, logical job and pinned runtime required for successor');
  const original = context.job;
  if (job.workerTotal !== 2 || original.workerTotal !== 1 || job.methodologySha !== original.methodologySha || !same(job.models, original.models) || job.protectedCheckCommand !== original.protectedCheckCommand || !same(job.expectedMutablePaths, original.expectedMutablePaths)) throw Error('successor must carry original contract with explicit cumulative workerTotal=2');
  const checked = await recoveryReview({ action: 'check', load });
  const inspected = await recoveryReview({ action: 'inspect', load });
  if (checked.fingerprint !== inspected.fingerprint) throw Error('predecessor candidate changed during successor validation');
  const tree = Object.keys(baseline).sort().map(path => [path, baseline[path]]);
  const modes = [['', 0o755], ...tree.map(([path, entry]) => [path, entry.kind === 'directory' || entry.executable ? 0o755 : 0o644])];
  if (digest(tree) !== inspected.candidate.treeSha256 || digest(modes) !== inspected.candidate.permissionModesSha256) throw Error('successor base must exactly equal reviewed Git-representable candidate tree and permissions');
  if (!grant || grant.version !== 1 || !reference(grant.grantRef) || grant.grantRef !== request.grantRef || !reference(grant.reviewRef) || grant.predecessorAttemptId !== prior.attemptId || grant.receiptSha256 !== checked.receiptSha256 || grant.fingerprint !== inspected.fingerprint || grant.newAttemptId !== request.attemptId || grant.newInputSha !== request.inputSha || grant.newJobPath !== request.jobPath || grant.newJobSha256 !== request.jobSha256 || grant.newTargetBase !== request.targetBase || grant.mode !== request.mode || grant.cumulativeWorkerTotal !== 2 || grant.priorInvocationUncertainAndConsumed !== true || grant.exclusiveSuccessorOwner !== true) throw Error('matching explicit successor grant, cumulative worker budget=2 and uncertain prior-slot acknowledgment required');
  const initial = admission(prior), initialFact = await regularJSON(join(store, 'admissions', initial.key + '.json'));
  if (!same(initialFact.value, initial)) throw Error('original admission changed');
  const priorFact = await regularJSON(join(store, prior.attemptId + '.job.json'));
  if (!same(priorFact.value, prior)) throw Error('predecessor binding changed');
  const key = digest(['job-successor-v1', initial.key, prior.attemptId]);
  const edge = { version: 1, key, admissionKey: initial.key, originalAdmissionSha256: hash(initialFact.bytes), predecessorAttemptId: prior.attemptId, predecessorBindingSha256: hash(priorFact.bytes), receiptSha256: checked.receiptSha256, fingerprint: checked.fingerprint, request: requestOf(request), grant: { grantRef: grant.grantRef, reviewRef: grant.reviewRef, sha256: digest(grant), cumulativeWorkerTotal: 2, priorInvocationUncertainAndConsumed: true, exclusiveSuccessorOwner: true } };
  const final = await recoveryReview({ action: 'check', load });
  if (final.fingerprint !== checked.fingerprint || final.receiptSha256 !== checked.receiptSha256) throw Error('predecessor review changed before successor claim');
  await publish(join(store, 'successors'), key, edge);
  return { version: 1, key, sha256: hash(encode(edge) + '\n'), admissionKey: initial.key, predecessorAttemptId: prior.attemptId, cumulativeWorkerTotal: 2 };
}

export async function validateSuccessorBinding({ store, binding }) {
  const joined = binding.successor;
  if (!joined || joined.version !== 1 || !safeId(joined.predecessorAttemptId) || joined.predecessorAttemptId === binding.attemptId || joined.cumulativeWorkerTotal !== 2) throw Error('invalid successor binding');
  const initial = admission(binding), key = digest(['job-successor-v1', initial.key, joined.predecessorAttemptId]);
  if (joined.key !== key || joined.admissionKey !== initial.key) throw Error('successor key mismatch');
  const { bytes, value: edge } = await regularJSON(join(store, 'successors', key + '.json'));
  const priorFact = await regularJSON(join(store, joined.predecessorAttemptId + '.job.json'));
  const prior = priorFact.value;
  const admitted = admission(prior), initialFact = await regularJSON(join(store, 'admissions', initial.key + '.json'));
  if (hash(bytes) !== joined.sha256 || edge.version !== 1 || edge.key !== key || edge.admissionKey !== initial.key || edge.predecessorAttemptId !== prior.attemptId || prior.successor || prior.repo !== binding.repo || prior.logicalJobRef !== binding.logicalJobRef || prior.runtimeSha !== binding.runtimeSha || !same(initialFact.value, admitted) || hash(initialFact.bytes) !== edge.originalAdmissionSha256 || hash(priorFact.bytes) !== edge.predecessorBindingSha256 || !same(edge.request, requestOf(binding)) || edge.grant?.grantRef !== binding.grantRef || !reference(edge.grant?.reviewRef) || edge.grant?.cumulativeWorkerTotal !== 2 || edge.grant?.priorInvocationUncertainAndConsumed !== true || edge.grant?.exclusiveSuccessorOwner !== true) throw Error('successor edge, original admission or bound request changed');
  const reviewed = await regularJSON(join(store, prior.attemptId, 'recovery-review-receipt.json'));
  if (hash(reviewed.bytes) !== edge.receiptSha256 || reviewed.value.fingerprint !== edge.fingerprint) throw Error('successor predecessor receipt changed');
}
