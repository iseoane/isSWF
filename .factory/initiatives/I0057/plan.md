# I0057: Deterministic guards for coordinator process rules

Type: enhancement

Operator feedback 2026-11-14 during I0009 on native Windows: the process is not deterministic, because it depends on the coordinator remembering written rules. In one session, seven rules held only in Markdown were broken and nothing checked them in time. Scheduled after I0009. Add executable machinery only where this evidence shows a structural need (AGENTS.md).

## J001

- Status: pending
- Objective: Writing initiative records gives immediate, mechanical feedback on plan and record contract violations.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Prepare a brief; compare a Claude Code PostToolUse hook, a Pi equivalent and a pre-commit check for each host and platform.

### Acceptance

- Editing `.isswf/` or `.factory/` initiative records runs the strict plan parser and a records validator. The validator checks that `Run:` lines match the pane's parser, that a job with records or an active writer is not left `pending` or `blocked` while work runs, and that record fields are present. Failures surface before commit on Linux and Windows, in Pi and Claude Code.
- One shared validator owns the rules and the pane parser reuses it; no rule is duplicated in two places.

### Evidence

- 2026-11-14: I0055 and I0056 used `Brief: None.`; only CI caught `unsafe-brief-reference` (PR323). The status tool does not apply the strict parse.
- 2026-11-14: `Run:` lines with trailing notes in A003, A011 and V006 were silently ignored by the pane (tools/isswf-snapshot-core.mjs:116).
- 2026-11-14: J029 stayed `blocked` while its worker, review and PR ran, so the pane's quota-resume prompt (hooks/register.tsx:165) never armed.

## J002

- Status: pending
- Objective: Delegation handoffs that the methodology requires are generated, not hand-written.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Prepare a brief after J001.

### Acceptance

- An unbound reviewer handoff is produced by a tool that emits the exact `base..candidate` diff file, its byte count and SHA-256, and the required review resources; a review cannot be dispatched without them.
- Delivery detects commits that change non-record paths after the last reviewed candidate without a recorded delta review, before push or in CI.

### Evidence

- 2026-11-14: J029 review call 2 stopped inconclusive because the handoff lacked the diff; one call was lost.
- 2026-11-14: coordinator test changes 2ac2f83 and 12efb53 were merged in PR322 before independent review (V003, J029-R4-04).

## J003

- Status: pending
- Objective: Coordinator shell use cannot silently break session state or violate the CI-waiting rule.
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md) (pending until prepared)
- Blocker: None.
- Next step: Prepare a brief; check which guards each host supports.

### Acceptance

- A `cd` that would leave the session working directory outside the project root is refused or reverted, so the pane keeps finding the state directory.
- Continuous CI waiting (`gh pr checks --watch`, `gh run watch`, sleep loops) is refused, with the documented alternatives offered (feature-delivery.md: a native completion event, one bounded deferred check, or manual revisit).

### Evidence

- 2026-11-14: a `cd` into jobs/J029 and later into .agents moved the session cwd; the pane showed "no .isswf or .factory state directory".
- 2026-11-14: the coordinator used `gh pr checks --watch` with sleep, contrary to feature-delivery.md:63; one wait was killed for low memory.
