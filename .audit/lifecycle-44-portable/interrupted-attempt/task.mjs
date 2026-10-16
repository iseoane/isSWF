import { writeFile } from 'node:fs/promises';
const workspace = process.argv[2];
await writeFile(workspace + '/partial-work', 'preserve-me');
await writeFile(workspace + '/child-pid', String(process.pid));
await new Promise(resolve => setTimeout(resolve, 800));
