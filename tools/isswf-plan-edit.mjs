import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function editPlanFile() {}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(JSON.stringify({ ok: true }));
