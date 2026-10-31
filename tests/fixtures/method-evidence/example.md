# Example method-evidence handoff (fixture only)

This synthetic example demonstrates the report contract; it is not an execution record.

## Brief selection

- Selected method: TDD. Behavioral contract: `canPublish(owner, actor)` permits publication only when the owner and actor match.
- Required engineering references: design-principles, comments, code-quality, writing/agent-documents.
- Expected evidence: test-only RED commit followed by GREEN; report the named command and assertion. Each required reference maps to a concrete candidate location or an explained non-applicability.

## Attempt

- TDD applied: yes.
- RED commit: `1111111111111111111111111111111111111111`; test-only change.
- RED command: `node --test tests/publish.test.mjs`.
- RED result: assertion at `tests/publish.test.mjs:18`, “expected false, received true”.
- GREEN commit: `2222222222222222222222222222222222222222`; production change.
- GREEN command: `node --test tests/publish.test.mjs`.
- GREEN result: passed.
- TDD contract with no honest RED: wording-only clarification in `docs/contract.md`; declared deviation because no executable behavior changed, with consequence that no RED/GREEN pair is claimed.
- Consumption: `.agents/roles/references/tdd.md` → consumed, self-reported; `.agents/roles/references/comments.md` → consumed, observed in host tool trace.
- Application map: design-principles → responsibility boundary visible in `src/publish.mjs`; comments → deliberately not applied, no non-obvious constraint needed; code-quality → focused behavioral assertions in `tests/publish.test.mjs`; writing/agent-documents → not applicable accepted by reviewer because no agent-facing document changed.

## Review

- TDD pair: command rerun at both commits; behavioral RED and passing GREEN confirmed.
- Consumption: tdd.md self-reported; comments.md observed in trace.
- Reference outcomes: design-principles — observed in candidate; comments — not applicable accepted; code-quality — observed in candidate; writing/agent-documents — not applicable accepted; a claimed comments.md application with no visible diff application — claimed, not visible.
- False-claim control: an author claims “comments.md was read and applied” but the candidate contains no application; reviewer records **claimed, not visible**, not a pass. This outcome is not itself a violation finding; reviewer names a finding only if the diff demonstrates a concrete comments-guidance violation.
