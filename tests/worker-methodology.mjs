import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = resolve(process.argv[2] ?? dirname(dirname(fileURLToPath(import.meta.url))));
const actualWorker = await readFile(join(source, '.agents/roles/worker.md'), 'utf8');
const briefTemplate = await readFile(join(source, '.factory/templates/job-brief.md'), 'utf8');
const attemptTemplate = await readFile(join(source, '.factory/templates/attempt.md'), 'utf8');
const reviewTemplate = await readFile(join(source, '.factory/templates/review.md'), 'utf8');
const reviewGuidance = await readFile(join(source, '.agents/roles/references/review.md'), 'utf8');
const reviewerRole = await readFile(join(source, '.agents/roles/reviewer.md'), 'utf8');
assert.match(briefTemplate, /Selected methods and required evidence[\s\S]*Do not create universal TDD\/E2E requirements/u);
assert.match(attemptTemplate, /distinguish reading\/receipt from application[\s\S]*disclosure does not waive a required method[\s\S]*no method was selected/u);
assert.match(reviewGuidance, /### Selected-method evidence[\s\S]*under \*\*Standards\*\*[\s\S]*missing and no deviation is declared[\s\S]*inconclusive[\s\S]*unselected methods/u);
assert.match(briefTemplate, /TDD red result before implementation[\s\S]*debug reproduction[\s\S]*E2E journey/u);
assert.match(reviewTemplate, /Exact diff source and consumed[\s\S]*Candidate paths reviewed/u);
assert.match(reviewerRole, /selected-method evidence[\s\S]*separately from Spec/u);
assert.match(reviewerRole, /unbound Agent-tool review of a commit or snapshot candidate without the exact diff[\s\S]*exact diff not supplied[\s\S]*Bound Pi\/Claude/u);
assert.match(reviewerRole, /record its source, base, candidate, and reviewed path scope as consumed evidence/u);
const reviewConvergence = await readFile(join(source, '.agents/roles/references/review-convergence.md'), 'utf8');
assert.match(attemptTemplate, /Deviations from required procedure and consequence:[^\n]*own departures[\s\S]*Process deviations observed:[^\n]*self-reported, not observed evidence[\s\S]*None\.[\s\S]*written rule that was not followed[\s\S]*copied by hand that could have been derived[\s\S]*another actor \(the coordinator's handoff included\)[\s\S]*never list one incident in both fields/u);
assert.match(reviewTemplate, /Reviewer limits for this round \(self-reported[\s\S]*delta round appended[\s\S]*Unreviewed areas and evidence limits:[\s\S]*approvals the reviewer cannot give[\s\S]*Convergence advice:[^\n]*recommended next step[\s\S]*accept[\s\S]*review-convergence\.md[\s\S]*Required corrections or unresolved questions[\s\S]*Process deviations observed:[^\n]*self-reported, not observed evidence[^\n]*written rule that was not followed[^\n]*copied by hand that could have been derived/u);
assert.match(actualWorker, /`Process deviations observed:` field as the template defines it \(self-reported, not observed evidence\)[\s\S]*Deviations from required procedure and consequence:/u);
assert.match(reviewerRole, /In every round, including a delta round[\s\S]*`Convergence advice:`[\s\S]*`Process deviations observed:`[\s\S]*self-reported, not observed evidence/u);
assert.match(reviewConvergence, /Repeat the reviewer limits and convergence advice for the delta round/u);
const coordinatorSkill = await readFile(join(source, '.agents/skills/isswf-coordinator/SKILL.md'), 'utf8');
assert.match(coordinatorSkill, /For each selected method[\s\S]*observed failing regression before implementation[\s\S]*disclosure does not waive/u);
assert.match(coordinatorSkill, /For an unbound Agent-tool review, supply the exact base\/candidate diff[\s\S]*reviewer\.md#required-input[\s\S]*reject any complete pass or fail report/u);
assert.match(coordinatorSkill, /### Apply methodology across the coordinator lifecycle[\s\S]*grounding\/design, assignment, consuming a result, review, PR\/delivery, or resuming/u);
assert.match(coordinatorSkill, /evaluate the existing trigger table for both the coordinator's action and any child action[\s\S]*unassessed optional trigger remains minor/u);
assert.match(coordinatorSkill, /For a selected resource governing the coordinator's own action, consume its canonical content before acting[\s\S]*selection, reading, a checklist, or an unrelated passing test is not application/u);
assert.match(coordinatorSkill, /provide each child the selected canonical path and pinned version or full content[\s\S]*confirm the child's available tools can actually consume it/u);
assert.match(coordinatorSkill, /On return, compare required method evidence with the current candidate[\s\S]*missing or stale application evidence[\s\S]*Do not begin dependent review or delivery/u);
assert.match(coordinatorSkill, /For coordinator-owned PR\/delivery, apply the existing feature-delivery and isswf-pr contracts[\s\S]*including risk and verification evidence[\s\S]*not a dispatch gate or proof of universal adherence/u);
const claudeHost = await readFile(join(source, '.agents/hosts/claude-code.md'), 'utf8');
assert.match(claudeHost, /An Agent-tool reviewer is unbound[\s\S]*reviewer\.md#required-input[\s\S]*exact base\.\.head committed diff/u);
assert.match(actualWorker, /For each selected method[\s\S]*required observed evidence[\s\S]*retrospective red-first proof/u);
// Record fields keep one canonical definition, in the template. Dropping part of it fails here; the files that
// name the field must not restate it (their old wording is listed in tooling/quality/stale-statements.json).
const fieldDefinitions = [
  [attemptTemplate, 'Required-resource consumption', /Required-resource consumption:[^\n]*consumed\/missing[^\n]*observed \(host trace\) or self-reported; a trace proves a read, not understanding or application\. Name unreadable required resources explicitly/u],
  [attemptTemplate, 'Retained substitute evidence', /Retained substitute evidence, when[^\n]*retain the harness and run log in committed tests\/ evidence or ignored tooling\/\.local\/<job>\/, never only disposable scratch space; link both paths[^\n]*archived commit and an unmutated baseline run, injected change and result\. Retrospective evidence is not red-first proof/u],
  [attemptTemplate, 'Method application report (TDD)', /Method application report:[^\n]*state applied\/not applied[^\n]*distinguish reading\/receipt from application[^\n]*full commit IDs of the test-only RED commit and the subsequent GREEN commit, the exact command and the failing assertion \(path:line\/message\)[^\n]*reruns the named command at both commits[^\n]*syntax\/setup failure is not RED\. If an honest RED is impossible, disclose the requirement, reason, and consequence; disclosure does not waive a required method or criterion\. Do not claim a retrospective red-first cycle\. For TDD, justify each new test in one line: the mistake it catches and why no existing test does\. State explicitly when no method was selected/u],
  [attemptTemplate, 'Required-reference application map', /Required-reference application map:[^\n]*concrete application in candidate \(path\/line or commit\), or not applicable \/ deliberately not applied → reason\. Do not list optional references/u],
  [reviewTemplate, 'Retained substitute evidence assessment', /Retained substitute evidence assessment[^\n]*what the attempt template's Retained substitute evidence field requires[^\n]*harness and run log[^\n]*committed tests\/ evidence or ignored tooling\/\.local\/<job>\/[^\n]*disposable scratch space does not satisfy it[^\n]*attribute supplied observations/u],
  [reviewTemplate, 'Reference-application outcomes', /Reference-application outcomes:[^\n]*“observed in candidate” \(the claimed application is visible[^\n]*“claimed, not visible” \(no application is visible[^\n]*only a concrete violation[^\n]*“not applicable accepted” \(the stated reason is sound/u],
  [reviewTemplate, 'Required-resource consumption', /Required-resource consumption:[^\n]*attempt template's Required-resource consumption field defines[^\n]*do not infer understanding or application from a read trace/u],
  [reviewGuidance, 'Selected-method evidence', /### Selected-method evidence[\s\S]*not re-run[\s\S]*disclosure is not a waiver[\s\S]*do not silently pass[\s\S]*inconclusive/u],
  [reviewTemplate, 'Selected-method evidence assessment', /Selected-method evidence assessment:[^\n]*review guide's Selected-method evidence section defines[^\n]*not re-run/u],
  [coordinatorSkill, 'Base worktree', /detached worktree at the brief's base \(`git worktree add --detach[^\n]*passes it as the child's checkout, and removes it after the child returns\. The base worktree is not write-protected; the researcher's and planner's tool lists have no file-writing tool/u],
];
for (const [text, field, pattern] of fieldDefinitions) assert.match(text, pattern, `canonical definition of ${field}`);
for (const [path, names] of [
  ['.agents/roles/worker.md', ['Retained substitute evidence', 'Required-resource consumption', 'Method application report']],
  ['.agents/roles/references/tdd.md', ['Method application report']],
  ['.agents/roles/references/review.md', ['Retained substitute evidence assessment', 'Reference-application outcomes', 'Required-resource consumption']],
  ['.agents/hosts/claude-code.md', ['Required-resource consumption', 'not write-protected']],
  ['.agents/hosts/pi.md', ['Required-resource consumption', 'not write-protected']],
  ['docs/en/installation.md', ['not write-protected']],
  ['docs/es/installation.md', ['worktree desacoplado (`--detach`)', 'sin protección contra escritura']],
]) {
  const body = await readFile(join(source, path), 'utf8');
  for (const name of names) assert.ok(body.includes(name), `${path} names ${name} instead of redefining it`);
}
console.log('PASS worker instructions and brief/attempt/review contracts distinguish selected-method evidence from consumption, deviations and unselected methods; assertions are static contract checks, not live reviewer behavior');
