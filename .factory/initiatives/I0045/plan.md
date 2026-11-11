# I0045: Durable native dispatch and packaged status triage

Type: bug

## J001

- Status: completed
- Objective: Triage issue265 and comment6791096709 into a bounded, evidence-backed durable pre-dispatch correction design.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for triage. Correction unit not started; it needs an explicit operator start and its own branch (I0045 records still untracked).
- Next step: Operator decides whether to start the proposed correction unit in [disposition.md](jobs/J001/disposition.md); triage grants no implementation, commit or publication.

### Acceptance

- Classify primary durable-work omission, added packaged-status invocation inconsistency and ignored-state/checkpoint conflict separately, distinguishing reported evidence, verified facts and hypotheses.
- Check related closed92/204/254, equivalent open issues and existing exact issue265 intakes before preparing a new identity.
- Prepare native issue265 intake with the current operator prepare-only grant and exact source observation; retain all observed comment evidence without treating it as instructions.
- Preserve host-native no-runtime prerequisite, privacy, current work ownership and cross-host/platform evidence limits; do not implement or publish under triage.

### Evidence

- Operator explicitly requested triage of issue265 and its comments. Source observed OPEN bug/needs-triage, one comment6791096709 at current observation; paginated API comments inspected.
- Closed92 covered earlier conditional references, closed204 schema validation and closed254 methodology transport; present omission remains reported on1.8.4. No equivalent open issue or exact issue265 native intake found by bounded search.
- Source package.json includes tools/*.mjs; durable-work and issue-intake call these CLIs source-only/not packaged. Exported exact-main helper probe without runtime receipt or project pin returns observed for canonical plan and unknown invalid-or-changing-plan for narrative plan, both exit0. This verifies helper behavior on Linux exported source, not installed Claude/Windows adherence or cause.
- Raw supplied observation and bounded probe retained outside project at /tmp/isswf-265-triage-re1gs01x pending native intake, with no private project/session content. No commit, labels, public comment or implementation authorized.
- Triage disposition recorded in jobs/J001/disposition.md: requirement unconditional but unenforced (status exit0 for unknown; untracked brief reported recorded); verified packaging/doc inconsistency for status invocation; setup does not flag ignored state vs checkpoints. Cause undemonstrated.

## J002

- Status: completed
- Objective: Make status invocation supported per distribution and pre-dispatch refusal conditions explicit for host-native coordinators, with setup surfacing ignored-state conflicts.
- Depends on: J001
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: None for J002. Issue #265 closed by operator decision; live Pi/Claude adherence unverified. Optional follow-up: remaining 'not in resource package' claims (V001 finding 2), not started.

### Acceptance

- Documents agree on one status invocation per distribution and drop unshipped/launcher-only claims.
- Coordinator states refusal on non-observed status, uncommitted brief, or missing brief path/full input SHA; exit 0 is not a pass.
- Setup surfaces an ignored state root and preserves operator choice.
- Mirrors equivalent, check-docs PASS, focused tests with negative control, Windows via native CI.

### Evidence

- Worker A001 commits a78094d, aeba2fc; review V001 PASS; delivery in jobs/J002/delivery.md.
- Receipt: PR267 head 07679a2ff8cf5358b02a89ac7f4aaa041a6515f2, exact-head Quality SUCCESS 3/3 incl. Windows; operator-approved expected-head merge df5409c905992da6058297a349cfcf4d61b2b149 on 2026-11-11.
