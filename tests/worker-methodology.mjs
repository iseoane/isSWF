import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const source = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));
const { nativeWorkerInstructions } = await import(pathToFileURL(join(source, 'tools/pi-worker-task.mjs')).href);
const files = {
  '.agents/roles/worker.md': '# Worker\n\nObsolete dispatcher prerequisite.\n\n## Assignment contract\n\nHonor the brief.\n\n## Execution\n\nRead [TDD](references/tdd.md) only when applicable.\n\n## Dispatch configuration\n\nObsolete transport configuration.\n',
  '.agents/roles/references/tdd.md': 'Reference content should be loaded only when needed.',
};
const prompt = nativeWorkerInstructions('Fix only the authorized file.', files);
assert.match(prompt, /^# Native worker execution\n\nThis worker is already dispatched through the Pi SDK\./u);
assert.match(prompt, /Its only callable tool is sandbox_shell\./u);
assert.match(prompt, /No external skills, extensions, dispatcher, agent creation, or third-party installation are required or authorized/u);
assert.match(prompt, /Methodology does not expand that grant\./u);
assert.match(prompt, /# Trusted brief\n\nFix only the authorized file\./u);
assert.match(prompt, /## Assignment contract\n\nHonor the brief\./u);
assert.match(prompt, /Read \[TDD\]\(references\/tdd\.md\) only when applicable\./u);
assert.match(prompt, /\/factory\/\.agents\/roles\/references\/tdd\.md/u);
assert.equal(prompt.includes('Reference content should be loaded only when needed.'), false);
assert.equal(prompt.includes('Obsolete dispatcher prerequisite.'), false);
assert.equal(prompt.includes('Obsolete transport configuration.'), false);
assert.throws(() => nativeWorkerInstructions('brief', {}), /pinned worker methodology sections missing/u);
assert.throws(() => nativeWorkerInstructions('brief', { '.agents/roles/worker.md': '## Dispatch configuration\n## Assignment contract\n' }), /pinned worker methodology sections missing/u);
const actualWorker = await readFile(join(source, '.agents/roles/worker.md'), 'utf8');
const actual = nativeWorkerInstructions('Keep the existing grant.', { '.agents/roles/worker.md': actualWorker });
assert.match(actual, /safe reproduction and evidence before claiming cause/u);
assert.match(actual, /A worker does not create a TDD requirement/u);
assert.match(actual, /PR creation or updates, push, merge, deploy, and external side effects are not implied/u);
console.log('PASS native worker instructions preserve methodology and grant, omit coordinator transport, and disclose references conditionally');
