# Attempt report

## Identity and pinned inputs

- Job ID and attempt ID:
- Reported status:
- Report timestamp and timezone:
- Brief path, revision, and input checkpoint (full Git SHA):
- Initiative spec path and revision, if used:
- Plan path and revision, if used:
- Profile path and revision, if available:
- Skills and revisions, if available:
- Target codebase base (full Git SHA):
- Trusted authorization reference (operator conversation or record ID, or external path; if tracked in Git, full Git SHA):
- Exclusive checkout or worktree:

## Execution

- Requested model and effort:
- Effective model and effort, as observed:
- Start and end timestamps, if known:
- Status evidence and source:
- Reported status is not proof of process state or liveness.
- Process state, only if directly checked, with time and evidence:

## Technical result

- Outcome: complete, partial, or blocked:
- Summary of work and unresolved decisions:
- Changed paths:
- Checks run and observed results:
- Resulting artifact paths and checkpoint or commit references:
- Risks, limits, and next action:

## Product acceptance

- Status at return: pending.
- Current operator decision and evidence: recorded by the coordinator in the canonical plan at <path/recordID>.

The worker reports the technical result and does not accept its own work. The coordinator records the operator's product-acceptance decision and evidence in the canonical plan. The worker-owned attempt report remains unchanged.
