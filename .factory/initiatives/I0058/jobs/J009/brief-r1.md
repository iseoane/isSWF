# I0058 J009 brief r1

- Authorization: operator, 2026-11-17, "si da la cuota luego el j009". Feature-to-PR start: implementation, commits, independent review, push, PR and CI on `feat/i0058-j009-base-review-guide`. Merge needs the operator's go.
- Writer: the coordinator in the primary checkout (sole writer).
- Baseline: origin/main after #350.
- Objective and acceptance: [plan.md](../../plan.md) J009.

## Design

1. `isswf-handoff review` reads `REVIEW.md` at the base. The envelope's `reviewGuide` becomes `{ path, revision: <base>, blob, copy, changed }`: `blob` at the base (null when absent), `copy` the path of the base text written next to the diff (null when absent), and `changed` true when the candidate's blob differs from the base's.
2. `promptLines` gain `review-guide: <copy> (REVIEW.md at base <sha>)`, or `review-guide: absent at base <sha>`, and, when `changed`, `review-guide-changed: the candidate changes REVIEW.md; it needs a person's approval`.
3. `isswf-record-new create` fills a review's `REVIEW.md` field from the base, not the candidate.
4. `review-convergence.md` "Project review guide", the review skill step 1, and `docs/{en,es}/operations.md` name the base revision and the copy.

## Scope

- In: `tools/isswf-handoff.mjs`, `tools/isswf-handoff-core.mjs`, `tools/isswf-record-new.mjs`, their tests, `.agents/roles/references/review-convergence.md`, `.agents/skills/isswf-review/SKILL.md`, `docs/{en,es}/operations.md`.
- Out: `.agents/hosts/**` (needs a person; the bound-evidence allowlist text stays), the dispatch guard.

## Method

TDD (RED: a behavioral assertion that the envelope's guide blob is the base's when the candidate changes REVIEW.md). One opus/medium reviewer; budget 2 review rounds, 1 correction. Risks: the dispatch guard rejecting the new envelope or prompt lines; mirrors drifting.
