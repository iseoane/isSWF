# J001 delivery · Proportionate changed-candidate verification

## What changed and why

Resolve #95 by replacing unconditional fresh-review language with proportionate delta verification across coordinator, reviewer, review guide and durable-work contracts. Preserve mandatory independent judgment, applicable candidate-pinned evidence and prior adverse/inconclusive verdicts.

## Checks and results

Functional candidate: 15b41c62e2e9571039c8c30b9a8e76796d47fc28; code base: 3ea750e0eab488c3de2f71daa2d266da8a37847a. Coordinator docs check PASS (11 pairs,182 links,9 technical guides), diff check PASS. Native Windows host-portability FAIL at existing unchanged CRLF frontmatter (#84); new assertions execute before that failure. No full local suite or live adherence evaluation. Required remote CI pending. Records added after functional review do not change its five functional blobs.

## Independent review

V001: Standards PASS, Spec PASS, aggregate scoped semantic PASS; no blocking findings; review 1/2. Native reviewer configured openai/gpt-6.1-sol MEDIUM; actual runtime identity not exposed. Reviewer consumed pinned canonical role/skill/guidance, candidate diff and coordinator provenance. Reviewer tools were file-only; no commands executed by reviewer.

## Scope

Five functional files plus curated I0010 records. No #84 repair, runtime authority change, installation, release, deployment or cleanup.

## Integration risk and recovery

LOW: affected consumers are coordinators/reviewers interpreting changed-candidate verification. Plausible failure is misclassifying a semantic delta as mechanical and reusing unsuitable evidence, weakening review coverage. Explicit risk/independence requirements, exact-delta comparison, applicability/provenance and adverse-verdict retention mitigate this without changing execution permissions. Independent semantic assessment passed; static assertions detect instruction-contract loss but do not establish future agent adherence. Detect regression through review reports and candidate-specific evidence; revert the five functional files if needed, without rewriting historical verdicts. Rollback is not live-tested and cannot undo previously taken external actions. Local CRLF failure remains visible; exact-head remote checks remain mandatory.

## Closure and acceptance

Implementation and scoped semantic review complete; publication and required CI pending. LOW-risk integration is authorized only through the protected expected-head PR path after gates pass. Other issues remain pending; no general completion claim.

## Blockers and next action

Publish PR, read back exact head/base, inspect required CI and address any relevant failure before integration. Local #84 failure is retained, not waived or repaired here.
