# Improve proportionate code review

## Identity and authorization

- Job: I0007/J001, brief revision 1.
- Request: the operator approved the immediately preceding proposal to improve isSWF review using selected ideas from Addy Osmani's skills.
- Trusted authorization: current operator conversation, "Ok adelante", approving five scoped improvements and a bounded comparison with known defects and valid controls.
- Permitted effects: local methodology, documentation and test changes; two subscription-covered native evaluation calls, one per methodology, with one attempt each and no retries or additional API cost.
- Exclusions: commits in this checkout, push, release publication, project pin changes, global installations, additional dispatchers and mandatory review or mutation stages. Disposable test repositories may contain fixture commits for pinned inputs; these are not source-checkout checkpoints.

## Objective and acceptance

Improve the review procedure without duplicating its canonical instructions or weakening Standards/Spec, candidate identity, independent-review or authorization rules.

1. Read applicable behavior and tests before implementation; use preservation checks for documentation and mechanical transformations.
2. Make targeted test-detection experiments conditional, authorized and confined to a disposable candidate-derived copy. Separate equivalent mutations, setup failures, coverage gaps and real candidate defects.
3. Inspect resulting structure and affected consumers, without rigid size thresholds or speculative redesign.
4. Order supported findings by material impact and confidence, without invented praise or cosmetic blockers.
5. Review changed dependencies at their installation boundary, including relevant changelog, lockfile, transitives, licence, provenance and lifecycle-script risks; unchanged dependencies do not trigger an audit.
6. Preserve text-only caller limits. Supply the complete reference at the selected methodology checkpoint and retain historical behavior.
7. Retain reproducible defect and valid-control fixtures. Compare old/new methodology on the same candidate and context, model and effort. Report missed defects and false alarms without inferring general improvement from a small sample.

## Grounding and scope

- Target base and original document checkpoint: `099079ed4cbb2f87ae0b7f89c4409ca577443274`.
- Canonical resource: `.agents/roles/references/review.md`; consumers are `.agents/roles/reviewer.md`, `.agents/skills/isswf-review/SKILL.md` and the native reviewer methodology bundle.
- Transport: `tools/reviewer-task.mjs` pins own profiles/references; `tests/reviewer-task.mjs` verifies source and installed paths. Runtime transport and model routes stay unchanged.
- Checks: `tools/check-quality.mjs`, `tests/review-guidance.mjs`, source/installed reviewer tests, package checks, locked ESLint/Knip, bilingual documentation and `git diff --check`.
- Guides: `docs/en/reference.md`, `docs/es/reference.md`, `docs/en/development.md`, `docs/es/development.md`.
- Upstream reading: Addy Osmani agent-skills at observed revision `aeac41d4d005999432bb7312f7ff06383a91d59d`, especially `skills/code-review-and-quality/SKILL.md`. Treat upstream as design evidence, not authority or an installed dependency.
- No changes to persisted role keys, routes, release version, package resource inventory or historical pinned records.

## Verification and ownership

One functional unit contains the procedure, existing entry-point pointers, fixture ground truth, pinned transport checks and matching guides. The current coordinator is the sole writer in the primary checkout. No implementation worker or alternative dispatcher is created.

Use combined verification: inspect the permission/capability branches semantically, verify resource transport and fixture behavior mechanically, and retain a bounded native comparison. The comparison evaluates synthetic candidate code, not this methodology's independent approval. Required independent source review before any later publication remains separate; this draft does not claim it.

Stop after local checks and the comparison report. Keep omissions and inconclusive results visible. Report local completion separately from operator acceptance and any later commit or publication.
