import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Stub for the TDD cycle: the commands do nothing until their behaviour is implemented.
export const reviewHandoff = async () => ({ ok: false, code: 'not-implemented' });
export const coverage = async () => ({ ok: false, code: 'not-implemented' });

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify({ ok: false, code: 'not-implemented' }));
  process.exitCode = 1;
}
