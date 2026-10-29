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
const briefTemplate = await readFile(join(source, '.factory/templates/job-brief.md'), 'utf8');
const attemptTemplate = await readFile(join(source, '.factory/templates/attempt.md'), 'utf8');
const reviewTemplate = await readFile(join(source, '.factory/templates/review.md'), 'utf8');
const reviewGuidance = await readFile(join(source, '.agents/roles/references/review.md'), 'utf8');
const reviewerRole = await readFile(join(source, '.agents/roles/reviewer.md'), 'utf8');
assert.match(briefTemplate, /Selected methods and required evidence[\s\S]*Do not create universal TDD\/E2E requirements/u);
assert.match(attemptTemplate, /distinguish reading\/receipt from application[\s\S]*disclosure does not waive a required method[\s\S]*no method was selected/u);
assert.match(reviewGuidance, /### Selected-method evidence[\s\S]*under \*\*Standards\*\*[\s\S]*missing and no deviation is declared[\s\S]*inconclusive[\s\S]*unselected methods/u);
assert.match(briefTemplate, /TDD red result before implementation[\s\S]*debug reproduction[\s\S]*E2E journey/u);
assert.match(reviewTemplate, /Selected-method evidence assessment[\s\S]*never silent pass[\s\S]*does not waive/u);
assert.match(reviewerRole, /selected-method evidence[\s\S]*separately from Spec/u);
const coordinatorSkill = await readFile(join(source, '.agents/skills/isswf-coordinator/SKILL.md'), 'utf8');
assert.match(coordinatorSkill, /For each selected method[\s\S]*observed failing regression before implementation[\s\S]*disclosure does not waive/u);
assert.match(actualWorker, /For each selected method[\s\S]*required observed evidence[\s\S]*retrospective red-first proof/u);
console.log('PASS worker instructions and brief/attempt/review contracts distinguish selected-method evidence from consumption, deviations and unselected methods; assertions are static contract checks, not live reviewer behavior');
