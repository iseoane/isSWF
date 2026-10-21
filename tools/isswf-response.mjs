import { stateDirectory } from './project-state.mjs';
import assert from 'node:assert/strict';
import { constants } from 'node:fs';
import { lstat, mkdir, open, opendir } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';

const id = value => typeof value === 'string' && /^[A-Z][A-Z0-9-]{0,63}$/u.test(value);
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
const noteValid = value => typeof value === 'string' && value.trim().length > 0 && Buffer.byteLength(value) <= 4000 && !/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u.test(value);
const valid = value => value?.version === 1 && /^[a-f0-9]{32}$/u.test(value.responseId) && id(value.initiative) && id(value.jobId) && noteValid(value.note) && digest(value.planSha256) && digest(value.briefSha256) && (value.deliverySha256 === null || digest(value.deliverySha256)) && typeof value.recordedAt === 'string' && Number.isFinite(Date.parse(value.recordedAt)) && value.applied === false;
async function directory(path) {
  const info = await lstat(path); assert(info.isDirectory() && !info.isSymbolicLink(), 'unsafe-response-directory');
}
async function responseRoot({ project, initiative, jobId }) {
  assert(isAbsolute(project ?? '') && id(initiative) && id(jobId), 'invalid-response-scope');
  let path = project; await directory(path);
  for (const component of [stateDirectory(project), 'initiatives', initiative, 'jobs', jobId]) { path = join(path, component); await directory(path); }
  return join(path, 'responses');
}
export async function readResponses(scope) {
  try {
    const root = await responseRoot(scope); await directory(root);
    const names = [], dir = await opendir(root);
    for await (const entry of dir) { if (names.length >= 50 || !/^[a-f0-9]{32}\.json$/u.test(entry.name)) throw Error('invalid-response-directory'); names.push(entry.name); }
    let bytes = 0; const records = [];
    for (const name of names.sort()) {
      const handle = await open(join(root, name), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
      try {
        const info = await handle.stat(); if (!info.isFile() || info.size > 8192) throw Error('invalid-response-record');
        const data = await handle.readFile(); bytes += data.length; if (data.length > 8192 || bytes > 128000) throw Error('response-read-bound');
        const value = JSON.parse(data.toString('utf8'));
        if (!valid(value) || name !== value.responseId + '.json' || value.initiative !== scope.initiative || value.jobId !== scope.jobId) throw Error('invalid-response-record');
        records.push(value);
      } finally { await handle.close(); }
    }
    return { status: 'recorded', records, provenance: 'local browser-session submissions; unverified author, not applied decisions or grants' };
  } catch (error) { return { status: error.code === 'ENOENT' ? 'absent' : 'unknown', records: [], reason: error.code === 'ENOENT' ? 'no-response-records' : 'invalid-unsafe-or-oversized-responses' }; }
}
export async function recordResponse({ project, initiative, jobId, responseId, note, planSha256, briefSha256, deliverySha256 }) {
  const record = { version: 1, responseId, initiative, jobId, note, planSha256, briefSha256, deliverySha256, recordedAt: new Date().toISOString(), applied: false };
  assert(valid(record), 'invalid-response');
  const root = await responseRoot({ project, initiative, jobId });
  try { await mkdir(root, { mode: 0o700 }); } catch (error) { if (error.code !== 'EEXIST') throw error; }
  await directory(root);
  const existing = await readResponses({ project, initiative, jobId });
  assert(existing.status === 'recorded' && existing.records.length < 50, 'response-store-unavailable-or-full');
  const handle = await open(join(root, responseId + '.json'), constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  try { await handle.writeFile(JSON.stringify(record) + '\n'); await handle.sync(); } finally { await handle.close(); }
  return { status: 'recorded-not-applied', responseId, applied: false, executionAuthorized: false };
}
