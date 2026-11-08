# Job brief J002 / r1

## Identity and authorization

- Source: operator chat 2026-11-08: optional skills and principles exist but are rarely used; keep them optional but make their use deliberate. "lo hacemos ya, esto es básico en la factoría".
- Authorization: implementation and local commits on `feat/methodology-selection`. Push, PR, merge are coordinator-owned.
- Profile: worker. Target base: 4203b0289609d9e167339ebd0b83befb607f5c1d.

## Problem (grounded)

- `.agents/skills/isswf-coordinator/SKILL.md:66` names when to load design/execution/verification principles, buried in the "read the code" paragraph; "verification principles when choosing diagnosis or evidence" applies to almost everything.
- `.factory/templates/job-brief.md` "Selected methods" and "Required engineering references" ask to list only selected items, so a resource whose trigger applied but was skipped leaves no trace. Observed: I0035 #237 was a defect with reproduction and verification-principles was not selected; records show these references cited in I0009–I0025 and none since.

## Objective

Optional methodology stays optional, but every resource whose trigger applies to a job is a recorded decision.

## Units

1. **One trigger catalog** in the coordinator skill (replace/condense the line-66 sentence; keep brief, e.g. a short table): for each optional resource — design-principles, execution-principles, verification-principles, isswf-debug/bug-diagnosis, isswf-tdd, isswf-e2e, isswf-security, isswf-performance, isswf-observability, isswf-interview, researcher — one concrete trigger. Reuse existing trigger wording from the coordinator selection list (lines ~34-50), worker.md step 2 and each skill's description; do not invent new policy. Make verification-principles concrete (e.g. defect, regression, intermittent failure, or acceptance needing non-test evidence). Avoid duplicating the existing selection bullets: the catalog should be the single place, and other places link to it.
2. **Brief records the decision**: in `.factory/templates/job-brief.md` add a "Methodology considered" field: for each catalog resource whose trigger applies, "selected" or "not selected: <reason>"; resources whose trigger does not apply are omitted. Add the same item to the coordinator's brief content list (section 4). State that this is a decision record, not a requirement to load anything.
3. **Reviewer check**: in `.agents/roles/references/review.md` (near Required methodology or Standards) one sentence: a resource whose catalog trigger clearly applies but is neither selected nor declined in the brief is a minor finding. It is not a blocker and does not make the resource mandatory.

## Exclusions

- No new skill, role, tool, dependency or mandatory method. Do not change what TDD/E2E/review modes require. Keep text short. Pi and Claude share these files; no host-specific change unless a host guide repeats the trigger list.

## Checks

- tests asserting on edited files: `grep -rln "job-brief.md\|isswf-coordinator/SKILL.md\|references/review.md" tests` and run them (at least worker-methodology, worker-method-evidence, host-portability, review-guidance, reviewer-task, diagnostic-task); `node tooling/quality/check-docs.mjs`; `git diff --check`. Packaging tests if templates are packaged (release-package, bun-release).

## Review

Independent semantic review after the worker stops.
