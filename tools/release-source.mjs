import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

export const releaseReceiptName = '.isswf-release.json';
const sha256Pattern = /^[a-f0-9]{64}$/u;
const shaPattern = /^[a-f0-9]{40}$/u;
const versionPattern = /^\d+\.\d+\.\d+$/u;
const plainObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const safeRelative = value => typeof value === 'string' && !value.includes('\\') && !value.includes('\0') && !value.startsWith('/') && value.split('/').every(part => part && part !== '.' && part !== '..');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
// A Git blob oid is the SHA-1 of the canonical blob header and bytes. Release
// source pins recompute it so a payload can be cross-checked against the
// committed object identity, not only against its own recorded digest.
const blobOid = bytes => createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');

function readReceipt(root) {
  let bytes;
  try { bytes = readFileSync(join(root, releaseReceiptName)); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  let value;
  try { value = JSON.parse(bytes.toString('utf8')); }
  catch { throw new Error(`Malformed release receipt: ${join(root, releaseReceiptName)}`); }
  if (!plainObject(value)) throw new Error(`Malformed release receipt: ${join(root, releaseReceiptName)}`);
  return { bytes, value };
}

function validateReceipt(root, value) {
  if (Object.keys(value).sort().join(',') !== 'files,format,methodologySha,revision,sources,version') throw new Error(`Release receipt fields are invalid: ${join(root, releaseReceiptName)}`);
  if (value.format !== 1 || !versionPattern.test(value.version ?? '') || !shaPattern.test(value.revision ?? '') || !shaPattern.test(value.methodologySha ?? '')) throw new Error('Release receipt format/version/revision pins are invalid');
  if (!plainObject(value.files) || Object.keys(value.files).some(path => !safeRelative(path) || !sha256Pattern.test(value.files[path] ?? ''))) throw new Error('Release receipt file inventory paths or digests are invalid');
  if (!plainObject(value.sources)) throw new Error('Release receipt sources are invalid');
  for (const [sha, entries] of Object.entries(value.sources)) {
    if (!shaPattern.test(sha) || !plainObject(entries)) throw new Error('Release receipt source pins are invalid');
    for (const [path, entry] of Object.entries(entries)) {
      if (!safeRelative(path) || !plainObject(entry) || Object.keys(entry).sort().join(',') !== 'file,oid,sha256') throw new Error(`Release receipt source entry is invalid: ${sha} ${path}`);
      if (!safeRelative(entry.file) || !sha256Pattern.test(entry.sha256) || !shaPattern.test(entry.oid)) throw new Error(`Release receipt source entry is invalid: ${sha} ${path}`);
      const embedded = `.isswf-sources/${sha}/${path}`;
      if (entry.file !== path && entry.file !== embedded) throw new Error(`Release receipt source payload path is invalid: ${sha} ${path}`);
    }
  }
  if (!Object.hasOwn(value.sources, value.revision) || !Object.hasOwn(value.sources, value.methodologySha)) throw new Error('Release receipt must pin current revision and historical methodology sources');
}

// Exact inventory: the receipt itself, every receipt-listed file, and every
// embedded historical source payload. Only npm-local metadata (node_modules,
// package-lock.json) at the release root is tolerated beside them.
function walk(root) {
  const present = new Set();
  const visit = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink()) throw new Error(`Release contains a symbolic link: ${join(directory, entry.name)}`);
      const path = join(directory, entry.name);
      const relativePath = relative(root, path).split(sep).join('/');
      if (entry.isDirectory()) {
        if (directory === root && entry.name === 'node_modules') continue;
        if (!safeRelative(relativePath)) throw new Error(`Release contains an unsafe directory: ${path}`);
        visit(path);
      } else if (entry.isFile()) {
        if (directory === root && entry.name === 'package-lock.json') continue;
        if (!safeRelative(relativePath)) throw new Error(`Release contains an unsafe path: ${relativePath}`);
        present.add(relativePath);
      } else throw new Error(`Release contains a non-regular entry: ${path}`);
    }
  };
  visit(resolve(root));
  return present;
}

// Synchronous: returns null when the root has no release receipt (a normal Git
// checkout; callers keep their Git checks), and a validated receipt with
// runtimeId otherwise. The revision pin is trusted provenance from the builder,
// not a claim of cryptographic authenticity. Corruption is always fatal.
export function verifyRelease(root) {
  const target = resolve(root);
  const receipt = readReceipt(target);
  if (receipt === null) return null;
  const { bytes, value } = receipt;
  validateReceipt(target, value);
  const expected = new Set([releaseReceiptName, ...Object.keys(value.files)]);
  const payloadEntries = new Map();
  for (const [sha, entries] of Object.entries(value.sources)) {
    for (const [path, entry] of Object.entries(entries)) {
      if (entry.file === path) {
        if (entry.sha256 !== value.files[path]) throw new Error(`Original-path source digest differs from file inventory: ${sha} ${path}`);
        continue;
      }
      if (payloadEntries.has(entry.file)) throw new Error(`Duplicate embedded release source payload: ${entry.file}`);
      payloadEntries.set(entry.file, entry);
      expected.add(entry.file);
    }
  }
  const present = walk(target);
  for (const path of present) if (!expected.has(path)) throw new Error(`Release contains an unexpected file: ${path}`);
  for (const path of expected) if (!present.has(path)) throw new Error(`Release is missing a receipt-listed file: ${path}`);
  const contents = new Map();
  for (const [path, digest] of Object.entries(value.files)) {
    const fileBytes = readFileSync(join(target, path));
    contents.set(path, fileBytes);
    if (sha256(fileBytes) !== digest) throw new Error(`Release file hash mismatch: ${path}`);
  }
  for (const [sha, entries] of Object.entries(value.sources)) {
    for (const [path, entry] of Object.entries(entries)) {
      const fileBytes = contents.get(entry.file) ?? readFileSync(join(target, entry.file));
      if (sha256(fileBytes) !== entry.sha256 || blobOid(fileBytes) !== entry.oid) throw new Error(`Release source payload mismatch: ${sha} ${path}`);
    }
  }
  return { ...value, runtimeId: sha256(bytes) };
}

// Returns null only when the root has no release receipt, so non-release Git
// checkouts keep their Git reads. With a receipt present, validation and the
// pinned lookup are enforced and a missing or corrupt source always throws;
// there is no fallback.
export function readReleaseSource(root, sha, path) {
  const target = resolve(root);
  if (readReceipt(target) === null) return null;
  const release = verifyRelease(target);
  if (!shaPattern.test(sha ?? '') || !safeRelative(path)) throw new Error('invalid release source pin/path');
  const entry = release.sources[sha]?.[path];
  if (!entry) throw new Error(`Pinned release source is missing: ${sha} ${path}`);
  const bytes = readFileSync(join(target, entry.file));
  if (sha256(bytes) !== entry.sha256 || blobOid(bytes) !== entry.oid) throw new Error(`Release source payload mismatch: ${sha} ${path}`);
  return bytes;
}
