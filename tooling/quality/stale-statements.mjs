import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const listPath = 'tooling/quality/stale-statements.json';

/** Reads and validates the committed phrase list. */
export async function loadStatements(root) {
  const list = JSON.parse(await readFile(join(root, listPath), 'utf8'));
  if (!Array.isArray(list.statements)) throw new Error(`${listPath}: statements must be an array`);
  for (const entry of list.statements) {
    for (const field of ['phrase', 'reason', 'since']) {
      if (typeof entry[field] !== 'string' || entry[field] === '') throw new Error(`${listPath}: every statement needs a non-empty ${field}`);
    }
  }
  return list.statements;
}

// `*` stays inside one path segment and `**` crosses segments, as in an ordinary glob.
function scopeMatches(scope, path) {
  if (scope === undefined) return true;
  const source = scope.replace(/[.+?^${}()|[\]\\]/gu, '\\$&').replace(/\*\*|\*/gu, star => (star === '**' ? '.*' : '[^/]*'));
  return new RegExp(`^${source}$`, 'u').test(path);
}

/**
 * Finds the listed statements in the given texts. `files` maps a repository path to its text; CRLF is normalized
 * before matching, and an entry's phrase is literal unless it sets `regex`.
 */
export function findStale(statements, files) {
  const hits = [];
  for (const [path, raw] of files) {
    const text = raw.replaceAll('\r\n', '\n');
    for (const entry of statements) {
      if (!scopeMatches(entry.scope, path)) continue;
      const found = entry.regex === true ? new RegExp(entry.phrase, 'iu').test(text) : text.includes(entry.phrase);
      if (found) hits.push({ path, phrase: entry.phrase, reason: entry.reason, since: entry.since });
    }
  }
  return hits;
}
