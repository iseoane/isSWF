# J018 cut 1: Native caller root identity and containment

## Bounded outcome

Prepare pinned planner/reviewer bundles on Windows using canonical filesystem identity and native path-component containment. Change only the two callers, one focused preparation regression and its quality-check registration. Do not activate the broader legacy Windows maintenance backlog or PR87.

Input Git base: `fcddfda5d2c520b11354bce0407cece17b37cda0`. Exact independently reviewed functional snapshot: `16ef8e01035d40f553773692a20649515b9932948cbbdd159eded61aad364bf1` (an uncommitted snapshot, not a Git SHA).

## Evidence and accepted limitation

- Native Windows baseline failed `git-root-required`; canonical-root-only mutation still failed `private-external-store-required`.
- Exact candidate preparation fixture and existing context handoff passed on native Windows. Affected Linux fixtures passed. These observations do not establish complete Windows execution support.
- Original independent Standards, Spec and aggregate verdicts are **FAIL**, retained unchanged. The reviewer found the two production fixes sound but identified insufficient regression coverage: the nonroot case uses a file, the target/store case reaches an earlier grant-binding refusal, and workspace preparation cases are absent.
- The operator explicitly accepts this current coverage limitation without another correction/re-review round. When the affected code is changed in future, apply TDD and add cases needed for that change. This acceptance is not a reviewer PASS or proof that those cases are covered.
- Complete Windows caller fixtures still failed directory synchronization at this checkpoint; the separate persistence slice must not be represented as part of this root-only commit.

## Delivery boundary

This record accompanies the unchanged root-only functional bytes. Later combined-candidate checks and exact-head CI must identify their own candidate; do not attribute them retroactively to this intermediate commit. Historical briefs, mixed repairs, original failures and private evidence remain retained separately.

The selected feature workflow covers checks, reviewable commits, a non-force feature push, one focused PR and exact-head CI. Integration, release, operative installation, cleanup and further maintenance slices remain separate. Ordinary native Pi/Claude use does not depend on finishing this legacy backlog.
