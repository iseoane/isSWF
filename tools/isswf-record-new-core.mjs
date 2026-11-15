// No Node imports and no `process` access, like tools/isswf-plan-edit-core.mjs: a runtime without Node built-ins
// can call these on text. tools/isswf-record-new.mjs is the Node wrapper that reads the files and runs Git.
import { RECORD_NAME } from './isswf-snapshot-core.mjs';

const KIND_PREFIX = { attempt: 'A', review: 'V' };
const LAST_NUMBER = 999;

export const recordError = (code, where = {}) => Object.assign(Error(code), { code }, where);

export function recordPrefix(kind) {
  if (!Object.hasOwn(KIND_PREFIX, kind)) throw recordError('invalid-kind');
  return KIND_PREFIX[kind];
}

/** The next unused ID of `kind`: one more than the highest number among the record names the job holds, whatever their source. */
export function nextRecordId(kind, names) {
  const prefix = recordPrefix(kind);
  let highest = 0;
  for (const name of names) if (RECORD_NAME.test(name) && name[0] === prefix) highest = Math.max(highest, Number(name.slice(1, 4)));
  if (highest >= LAST_NUMBER) throw recordError('ids-exhausted');
  return `${prefix}${String(highest + 1).padStart(3, '0')}`;
}
