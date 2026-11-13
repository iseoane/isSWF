# I0050: Bound review evidence: candidate-bound checks, content reads and verdict records

Type: enhancement

Source: https://github.com/iseoane/isSWF/issues/278 (triaged 2026-11-12 in a Claude Code session; operator approved creating this initiative). Item 2 split by cause: the large-file limit is a tool gap; `content-path-not-allowed` on review-policy files comes from the coordinator's own path allowlist (tools/git-evidence.mjs:133), so it is guidance. Every job is S or M. Plan approval is preparation only; each job needs an explicit operator start.

## J001

- Size: M
- Status: completed
- Objective: Hand coordinator-observed checks to bound reviewers in a block bound to the candidate SHA.
- Depends on: None
- Brief: [brief-r2.md](jobs/J001/brief-r2.md)
- Blocker: None.
- Next step: None. Merge into main awaits the operator (I0050 PR).

### Acceptance

- The review handoff carries a checks block (candidate SHA, commands, exit codes, short output) written mechanically on that SHA.
- A block naming a different SHA is reported as "checks not bound to candidate"; a matching block lets a review pass without an "observed build missing" limit. Claude and Pi parity; Linux and Windows CI.

### Evidence

- Coordinator-owned implementation on feat/i0050-bound-review-evidence (workers blocked by auto-mode no-verdict; operator chose coordinator implementation 2026-11-13).
- Review R1 (native isswf-reviewer, model inherited, diff 83ff248..d76b02b without `.factory/initiatives`, supplied inline): Aggregate PASS, Standards pass, Spec pass; 0 blocking. Applied: invoker checks range length against the request; review-checks finishes on child exit after a timeout (new test, negative control fails without the fix); review.md treats `cleanAfterChecks: false` as a limit.
- Local: full check-quality PASS once on d76b02b; after corrections review-checks, git-content, git-evidence-mcp, check-docs and eslint pass. Windows via PR CI.

## J002

- Size: M
- Status: completed
- Objective: Let bound reviewers read a line or byte range of a large file at the bound revision.
- Depends on: None
- Brief: [brief-r1.md](jobs/J002/brief-r1.md)
- Blocker: None.
- Next step: None. Merge into main awaits the operator (I0050 PR).

### Acceptance

- A reviewer can read any range of a changed file of at least 150 KB at the candidate SHA through `content`, with the same integrity checks; Claude MCP and Pi tools; Linux and Windows CI.

### Evidence

- Coordinator-owned implementation on feat/i0050-bound-review-evidence (workers blocked by auto-mode no-verdict; operator chose coordinator implementation 2026-11-13).
- Review R1 (native isswf-reviewer, model inherited, diff 83ff248..d76b02b without `.factory/initiatives`, supplied inline): Aggregate PASS, Standards pass, Spec pass; 0 blocking. Applied: invoker checks range length against the request; review-checks finishes on child exit after a timeout (new test, negative control fails without the fix); review.md treats `cleanAfterChecks: false` as a limit.
- Local: full check-quality PASS once on d76b02b; after corrections review-checks, git-content, git-evidence-mcp, check-docs and eslint pass. Windows via PR CI.

## J003

- Size: S
- Status: completed
- Objective: Make the bound review launch include the review-policy files the brief cites in the content allowlist.
- Depends on: None
- Brief: [brief-r1.md](jobs/J003/brief-r1.md)
- Blocker: None.
- Next step: None. Merge into main awaits the operator (I0050 PR).

### Acceptance

- Claude and Pi bound-launch guidance tell the coordinator to list review-policy files (such as REVIEW.md), the plan and the brief in `paths`; check-docs passes.

### Evidence

- Coordinator-owned implementation on feat/i0050-bound-review-evidence (workers blocked by auto-mode no-verdict; operator chose coordinator implementation 2026-11-13).
- Review R1 (native isswf-reviewer, model inherited, diff 83ff248..d76b02b without `.factory/initiatives`, supplied inline): Aggregate PASS, Standards pass, Spec pass; 0 blocking. Applied: invoker checks range length against the request; review-checks finishes on child exit after a timeout (new test, negative control fails without the fix); review.md treats `cleanAfterChecks: false` as a limit.
- Local: full check-quality PASS once on d76b02b; after corrections review-checks, git-content, git-evidence-mcp, check-docs and eslint pass. Windows via PR CI.

## J004

- Size: S
- Status: completed
- Objective: Record the reviewer's verdict verbatim and any coordinator override separately.
- Depends on: None
- Brief: [brief-r1.md](jobs/J004/brief-r1.md)
- Blocker: None.
- Next step: None. Merge into main awaits the operator (I0050 PR).

### Acceptance

- Durable-work guidance and record templates keep the review verdict equal to the review report header and put overrides with their evidence in a separate field; check-docs and focused tests pass.

### Evidence

- Coordinator-owned implementation on feat/i0050-bound-review-evidence (workers blocked by auto-mode no-verdict; operator chose coordinator implementation 2026-11-13).
- Review R1 (native isswf-reviewer, model inherited, diff 83ff248..d76b02b without `.factory/initiatives`, supplied inline): Aggregate PASS, Standards pass, Spec pass; 0 blocking. Applied: invoker checks range length against the request; review-checks finishes on child exit after a timeout (new test, negative control fails without the fix); review.md treats `cleanAfterChecks: false` as a limit.
- Local: full check-quality PASS once on d76b02b; after corrections review-checks, git-content, git-evidence-mcp, check-docs and eslint pass. Windows via PR CI.
