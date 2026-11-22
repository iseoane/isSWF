# Possible future actions

[Home](../../README.md) · [Documentation](index.md) · [Español de España](../es/future-actions.md)

These are proposals, not implemented features, a delivery schedule, or permission to run jobs. Check the current code and agree scope before taking one on. Existing plans are records of decisions, not proof that every planned capability exists.

## Recovery

Broader recovery across reboot, arbitrary surviving processes, and lost external responses needs its own design and evidence. Do not describe the current bounded recovery as universal automatic resumption.

## Review quality

Build a reviewer regression set from defects a review missed and that were confirmed later, such as reverts or escaped platform failures. Each case keeps the exact candidate, the accepted brief and the confirmed defect. Rerun the reviewer profile on the set whenever its methodology, model or effort changes, and keep a change only when it finds more confirmed defects without more findings later marked wrong. Run it on known-clean candidates too, to count false alarms. The finding resolutions recorded in review reports supply the noise data.

Pilot formal verification for one high-risk invariant, after the empirical review mode (I0033). A candidate is "never change a project pin while a registered execution is active" in the launcher (`tools/isswf.mjs`), where crashes, retries and recovery can interleave in orders tests rarely reach. Model it with a model checker such as TLA+, show the check fails on a variant with the guard removed, and record which files and commit the model covers so drift is visible. Weigh the Java/TLC development dependency and the risk of the model drifting from the code before starting.

Let a target project declare numeric quality gates for changed code in its `REVIEW.md` or setup record: a complexity score such as CRAP, duplication, and differential mutation testing. The worker would run them before hand-off and the reviewer would check the results. Costs: new locked development dependencies, slow mutation runs with noise from equivalent mutants, and thresholds that can be gamed. Pilot on `tools/` first. Source: [unclebob/ub-mode](https://github.com/unclebob/ub-mode) (3da62bf3) and [unclebob/swarm-forge](https://github.com/unclebob/swarm-forge) (f4f5fbca).

Offer an optional refactor assignment after the tests pass, selected by the coordinator for larger features, with behavior pinned by the existing tests. Costs: an extra model call and code churn. It would never be a mandatory stage. Source: the same repositories.

## Records-only pushes

Check plan records before a records-only commit goes to `main` without a pull request. A guard would parse each changed `plan.md` with `parsePlan` and each changed record with the record check, and refuse the push when one fails. Today these commits skip review, so a malformed record reaches `main` and breaks CI for every open pull request, as `None.` in an I0061 dependency field did on 2026-11-18.

## Initiatives panel for Pi

A panel like the Claude Code initiatives pane (cards for plans, jobs and review rounds, a file tree and an agents view) for Pi, which has no equivalent today. Costs: a Pi-specific interface to build and keep in step with the record formats. It would only read the records and would grant no permission. Source: the operator's plan to bring a similar panel to Pi.
