import { createHash, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { open, mkdir, readFile, link, unlink, lstat } from 'node:fs/promises';
import { join } from 'node:path';

const hash = value => createHash('sha256').update(value).digest('hex');
const sha = value => typeof value === 'string' && /^[0-9a-f]{40}$/.test(value);
const text = value => typeof value === 'string' && value.length > 0 && !/[\x00-\x1f\x7f]/.test(value);
const ref = value => text(value) && value.length <= 200 && !value.startsWith('-') && !value.includes('..') && !/[ ~^:?*\[\\]/.test(value);
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function effectIntent(binding, job) {
  const effect = job.externalEffect;
  if (!text(job.logicalJobRef) || job.logicalJobRef.length > 200 || !effect || effect.operation !== 'pr-open' || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(effect.repository || '') || !ref(effect.head) || !ref(effect.base) || effect.head === effect.base || !sha(effect.candidateSha) || !sha(effect.baseSha) || !text(effect.title) || effect.title.length > 200 || typeof effect.body !== 'string' || Buffer.byteLength(effect.body) > 16000 || typeof effect.draft !== 'boolean') throw Error('explicit logical job and complete pinned PR intent required');
  const repository = effect.repository.toLowerCase();
  const key = hash(JSON.stringify([repository, job.logicalJobRef, 'pr-open']));
  const marker = `<!-- isswf-effect:${key} -->`;
  if (effect.body.includes('<!-- isswf-effect:')) throw Error('reserved effect marker in body');
  return { version: 1, key, repository, logicalJobRef: job.logicalJobRef, operation: 'pr-open', inputSha: binding.inputSha, targetBase: binding.targetBase, candidateSha: effect.candidateSha, baseSha: effect.baseSha, head: effect.head, base: effect.base, title: effect.title, body: effect.body, draft: effect.draft, marker };
}

async function syncDirectory(path) {
  const file = await open(path, 'r');
  try { await file.sync(); } finally { await file.close(); }
}
async function fact(path) {
  try {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 64000) throw Error('invalid effect fact');
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (error) { if (error.code === 'ENOENT') return null; throw Error('missing or corrupt effect evidence'); }
}
async function publishFact(directory, name, value) {
  const temporary = join(directory, `.pending-${randomUUID()}`);
  const file = await open(temporary, 'wx', 0o600);
  try { await file.writeFile(JSON.stringify(value) + '\n'); await file.sync(); } finally { await file.close(); }
  try { await link(temporary, join(directory, name)); await syncDirectory(directory); }
  finally { await unlink(temporary); }
}
async function privateDirectory(path) {
  try { await mkdir(path, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  const stat = await lstat(path);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw Error('effect directory must be a private real directory');
}
function validateGrant(grant, intent) {
  if (!grant || grant.version !== 1 || !text(grant.grantRef) || grant.host !== 'github.com' || grant.key !== intent.key || grant.intentSha256 !== hash(JSON.stringify(intent)) || grant.maxInvocations !== 1 || !Number.isInteger(grant.maxQueries) || grant.maxQueries < 1 || grant.maxQueries > 20 || grant.exclusiveEffectOwner !== true || grant.priorWritersCeased !== true || !text(grant.reviewRef) || !Array.isArray(grant.actions) || grant.actions.length === 0 || grant.actions.some(action => !['prepare', 'publish', 'reconcile'].includes(action))) throw Error('matching explicit effect grant, review, cessation and numeric budgets required');
  return { grantRef: grant.grantRef, maxInvocations: grant.maxInvocations, maxQueries: grant.maxQueries, reviewRef: grant.reviewRef, actions: [...grant.actions].sort() };
}
function matchPull(pull, intent) {
  return pull && pull.state === 'open' && pull.merged_at === null && Number.isSafeInteger(pull.number) && pull.number > 0 && pull.head?.repo?.full_name?.toLowerCase() === intent.repository && pull.base?.repo?.full_name?.toLowerCase() === intent.repository && pull.head.ref === intent.head && pull.base.ref === intent.base && pull.head.sha === intent.candidateSha && pull.base.sha === intent.baseSha && typeof pull.body === 'string' && pull.body.includes(intent.marker) && pull.title === intent.title && pull.draft === intent.draft;
}
function outcome(pull, intent) {
  if (!matchPull(pull, intent)) throw Error('remote PR does not match immutable intent; no retry permitted');
  return { version: 1, key: intent.key, observedState: 'open', number: pull.number, url: `https://github.com/${intent.repository}/pull/${pull.number}`, candidateSha: intent.candidateSha, baseSha: intent.baseSha };
}

function githubTransport() {
  return {
    request(method, path, body) {
      const args = ['api', '--hostname', 'github.com', '--method', method, path];
      if (body) args.push('--input', '-');
      const result = spawnSync('gh', args, { input: body ? JSON.stringify(body) : undefined, encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024, env: process.env });
      if (result.error || result.status !== 0) throw Error('GitHub transport failed; preserve submitted evidence and reconcile, never retry');
      try { return JSON.parse(result.stdout); } catch { throw Error('incomplete GitHub response'); }
    }
  };
}

export async function externalEffect({ action, store, intent, grant, transport = githubTransport() }) {
  if (!['prepare', 'inspect', 'publish', 'reconcile'].includes(action)) throw Error('unsupported effect action');
  const effects = join(store, 'effects'), directory = join(effects, intent.key);
  const authority = action === 'inspect' ? null : validateGrant(grant, intent);
  if (authority && !authority.actions.includes(action)) throw Error('effect action not granted');
  const expected = authority ? { intent, authority } : null;
  if (action === 'prepare') {
    await privateDirectory(effects);
    await privateDirectory(directory);
    await syncDirectory(store); await syncDirectory(effects);
    const existing = await fact(join(directory, 'intent.json'));
    if (!existing) {
      try { await publishFact(directory, 'intent.json', expected); }
      catch (error) { if (error.code !== 'EEXIST') throw error; }
    }
  }
  const prepared = await fact(join(directory, 'intent.json'));
  if (!prepared && action === 'inspect') return { key: intent.key, state: 'unprepared', intent, intentSha256: hash(JSON.stringify(intent)), retry: 'never' };
  if (!prepared || !equal(prepared.intent, intent) || (expected && !equal(prepared, expected))) throw Error('effect intent missing or conflicting; explicit operator decision required');
  const submitted = await fact(join(directory, 'submitted.json'));
  const confirmed = await fact(join(directory, 'outcome.json'));
  const claim = { version: 1, key: intent.key, intentSha256: hash(JSON.stringify(prepared)) };
  if (submitted && !equal(submitted, claim)) throw Error('conflicting submission evidence');
  if (confirmed && (!submitted || !equal(confirmed, { version: 1, key: intent.key, observedState: 'open', number: confirmed.number, url: `https://github.com/${intent.repository}/pull/${confirmed.number}`, candidateSha: intent.candidateSha, baseSha: intent.baseSha }) || !Number.isSafeInteger(confirmed.number) || confirmed.number < 1)) throw Error('conflicting outcome evidence');
  if (action === 'inspect' || action === 'prepare' || confirmed) return { key: intent.key, state: confirmed ? 'confirmed' : submitted ? 'submitted-unknown' : 'prepared', ...(confirmed ? { outcome: confirmed } : {}), retry: 'never' };
  async function query(path) {
    for (let slot = 1; slot <= authority.maxQueries; slot++) {
      try { await publishFact(directory, `query-${slot}.json`, { version: 1, key: intent.key, path }); }
      catch (error) { if (error.code === 'EEXIST') continue; throw error; }
      return transport.request('GET', path);
    }
    throw Error('explicit query budget exhausted');
  }
  async function findExisting() {
    const matches = [];
    for (let page = 1; page <= authority.maxQueries; page++) {
      const pulls = await query(`repos/${intent.repository}/pulls?state=all&head=${encodeURIComponent(intent.repository.split('/')[0] + ':' + intent.head)}&base=${encodeURIComponent(intent.base)}&per_page=100&page=${page}`);
      if (!Array.isArray(pulls) || pulls.length > 100) throw Error('incomplete PR query');
      for (const pull of pulls) {
        if (typeof pull.body !== 'string') throw Error('incomplete PR query row');
        if (pull.body.includes(intent.marker)) matches.push(pull);
      }
      if (pulls.length < 100) return matches;
    }
    throw Error('incomplete paginated PR query');
  }
  async function record(pull) {
    const value = outcome(pull, intent);
    try { await publishFact(directory, 'outcome.json', value); }
    catch (error) { if (error.code !== 'EEXIST' || !equal(await fact(join(directory, 'outcome.json')), value)) throw error; }
    return { key: intent.key, state: 'confirmed', outcome: value, retry: 'never' };
  }
  if (action === 'reconcile') {
    if (!submitted) throw Error('no submitted invocation to reconcile');
    const matches = await findExisting();
    if (matches.length !== 1) throw Error('uncertain remote effect: zero or ambiguous matches; no retry permitted');
    return record(matches[0]);
  }
  if (submitted) throw Error('submission already claimed; explicitly reconcile, never publish again');
  const matches = await findExisting();
  if (matches.length !== 0) throw Error('preexisting remote effect requires explicit reconciliation/decision');
  const head = await query(`repos/${intent.repository}/git/ref/heads/${intent.head.split('/').map(encodeURIComponent).join('/')}`);
  const base = await query(`repos/${intent.repository}/git/ref/heads/${intent.base.split('/').map(encodeURIComponent).join('/')}`);
  if (head?.object?.sha !== intent.candidateSha || base?.object?.sha !== intent.baseSha) throw Error('remote refs differ from reviewed intent');
  await publishFact(directory, 'submitted.json', claim);
  const pull = await transport.request('POST', `repos/${intent.repository}/pulls`, { head: intent.head, base: intent.base, title: intent.title, body: `${intent.body}\n\n${intent.marker}`, draft: intent.draft });
  return record(pull);
}
