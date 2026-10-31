# J032: Observable methodology application — grounded gap and first slice

## Assignment and base

Operator requests the J032 brief after J023 closed (PR116 `a88f471`, PR117 `135d0fbc97d3b9421a3945f365b3ca8b3451e8c2` on `origin/main`). Supersedes brief-r1's planning-only state; brief-r1 outcome and acceptance remain the target. Base for implementation: `origin/main` `135d0fb`. Feature-to-PR scope applies once dispatched (commit, branch push, PR, exact-head CI); integration needs operator approval.

## What already exists (do not rebuild)

- Assignment side: `.factory/templates/job-brief.md:26` requires selected methods and their observable evidence; coordinator SKILL §4–5 requires resolving resource paths and consumption acknowledgement.
- Return side: `.agents/roles/worker.md` Return requires consumed vs missing resources, per-method evidence with observer/command/result/provenance, disclosed deviations, no retrospective red-first claims; `.factory/templates/attempt.md` has a method application report field.
- Review side: `.agents/roles/references/review.md` Required methodology (missing required procedure ⇒ Standards inconclusive, aggregate cannot pass) and Selected-method evidence; `.factory/templates/review.md:18`.
- Static guards: `tests/worker-methodology.mjs`, `tests/host-portability.mjs:96,147`.

So brief-r1 slice 1 (handoff/self-report distinctions) and most of slice 2 (honest completion rules) are already contract. J023 shows they worked as rules: reviewers marked missing RED as FAIL/INCONCLUSIVE, workers disclosed unread references.

## Observed gaps (J023, 2026-10-31)

1. **Application evidence is only self-reported and not retained.** Every RED in J023 corrections was worker-reported; reviewers V007, V008, V010 explicitly could not verify them. Coordinator could only re-verify retrospective mutants because a harness and log happened to survive in the scratchpad.
2. **Evidence lives only in the final report, which can be lost.** The Claude-route worker was stopped at commit; its RED evidence for `eb3aea3`/`950aa22` became unrecoverable (V009-2).
3. **Reference application is invisible.** Workers reported reading design-principles, code-quality and comments, but no report linked any of them to the diff; reviewers assessed comments ad hoc (V007 F4, V008) without a contract for it.
4. **Consumption is self-report even when a native trace exists.** Claude `claude -p` stream-json and subagent transcripts record actual Read calls (coordinator used this to verify actual tool use in V009). The contract never says the coordinator may check it, so "observed consumption" and "self-report" collapse into one.

## Slice 1 (this unit): durable, verifiable selected-method evidence

Outcome: when TDD (or another method with an observable red/green or sensitivity requirement) is selected, a reviewer can verify the evidence from durable Git state rather than from the author's word, and interruption does not lose it.

Proposed contract (methodology only, no new runtime machinery):
- **RED retained in Git.** For selected TDD, the author commits the failing regression test before the production fix, with the observed failing command and assertion in that commit message; the next commit makes it pass. A reviewer or CI can re-run the test at the RED commit. Applies per contract, not per line; documented exception when a red commit cannot exist (pure refactor, equivalent change) is a declared deviation.
- **Sensitivity evidence retained in repo or ignored local evidence path** with harness and run log when used as a substitute, never only in a scratch directory.
- **Observed vs self-reported consumption.** Coordinator SKILL, host guides (Claude, Pi) and review.md state that when the host exposes a trace of the child's tool calls, the coordinator may verify required-resource reads from it and record the result as "observed"; otherwise consumption stays "self-reported". No transcript retention by default; only the resulting list.
- **Reference application map.** For engineering references the brief marks as required for this task (e.g. design-principles, code-quality, comments, verification-principles), the author reports `reference → concrete application in the candidate (path:line or commit) → or explicit "not applicable / deliberately not applied" with reason`. The reviewer checks each entry against the actual diff under Standards and records it as "application observed in candidate", "claimed but not visible", or "not applicable accepted". A required reference read but with no visible application is not automatically a failure: it is reported, and becomes a finding only if the diff shows a concrete violation. Optional references need no entry. No universal checklist, no per-line justification.
- Update `isswf-tdd` SKILL, `worker.md` Return, `review.md` Selected-method evidence, attempt/review templates, coordinator SKILL and both host guides; paired EN/ES user guides only where user-visible.

Acceptance:
- Review template/review.md gain the three reference-application outcomes; a fixture brief + report pair shows one observed, one claimed-not-visible and one not-applicable entry.
- Static tests (extend `tests/worker-methodology.mjs`/`host-portability.mjs`) assert the new contract wording in each owner, and that no owner claims a self-report is observed.
- A focused fixture demonstrates the red-commit rule is checkable: a script or test helper that, given a commit range, identifies a test-only commit whose test fails at that commit and passes at the next (deterministic Git fixture, Linux/Windows CI). Only if this stays small; otherwise the check remains a reviewer instruction and the fixture is a documented manual procedure.
- Negative controls: a range with fix before test, and a "RED" commit whose test already passes, are reported as not demonstrating RED.
- No universal TDD, no new dispatcher, no compliance database, no mandatory transcript retention.

## Pending decision (operator)

Red commits make some intermediate commits fail tests (affects `git bisect` and per-commit CI). Options: (a) accept red commits on feature branches, merged with a merge commit (current practice) — **recommended**; (b) keep evidence as a retained log file under ignored `tooling/.local/` instead of commits — weaker, not reviewable in the PR. **Operator decided (a) on 2026-10-31.**

## Allocation and methods

- Author: one Claude `isswf-worker` `sonnet`/`medium`, branch `feat/j032-method-evidence` from `135d0fb`, explicit-file commits; Bash writes allowed if Write gets classifier no-verdict. This unit dogfoods its own rule: TDD selected, RED commits required.
- Review: up to two `isswf-reviewer` `opus`/`medium` rounds on coordinator patch + SHA-256, verifying RED commits by Git history.
- Brief-r1 slice 2 (reference application) is folded into this unit as the reference application map; a later slice only if a demonstrated gap remains.

## Reading map (base 135d0fb)

`.agents/skills/isswf-tdd/SKILL.md`, `.agents/roles/references/tdd.md`, `.agents/roles/worker.md` (Return), `.agents/roles/references/review.md` (Required methodology, Selected-method evidence), `.agents/skills/isswf-coordinator/SKILL.md` §3–6, `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`, `.factory/templates/{job-brief,attempt,review}.md`, `tests/worker-methodology.mjs`, `tests/host-portability.mjs`, `docs/en|es` guides that describe TDD or review evidence. Evidence: J023 V007–V010, brief-r16, brief-r20.

Status: ready to execute.
