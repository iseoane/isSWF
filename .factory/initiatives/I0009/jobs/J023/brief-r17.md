# J023: Pi actual-use gate deferred; delivery order

Operator decision (2026-10-31), recorded while correction 3 writer runs; applies after it stops:

- The brief-r13 gate "actual fresh Pi reviewer invokes `isswf_git_content`" no longer blocks content-unit publication or integration. It becomes a pending J023 closure condition, satisfied by one Pi reviewer call on the then-current candidate when the operator has Pi quota. Not recorded as passed.
- Content unit: after correction 3 and review round 3 PASS, coordinator pushes `feat/j023-git-content`, opens the PR (stating the deferred gate) and verifies exact-head native Windows/Linux CI. Integration into `main` remains a separate operator approval.
- Next unit: status operation + Claude host adapter for all four operations, on a branch stacked on the content branch; its acceptance includes actual Claude reviewer use. Brief to be prepared before dispatch.
- Risk accepted: a defect found later by the Pi call is repaired in a follow-up PR.
