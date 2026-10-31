# I0018: Claude writer permission readiness

Type: enhancement

## J001

- Status: in-review
- Objective: Resolve #124 with pre-dispatch writer permission checks and fail-closed handling of classifier no-verdict.
- Depends on: None
- Brief: [brief-r1.md](jobs/J001/brief-r1.md)
- Blocker: None for bounded source instructions; no live Claude permission behavior is claimed.
- Next step: Independent combined review of stopped candidate932ad4b after full local quality on50f2f9 and affected checks; then final-head PR CI.

### Acceptance

- Check effective Claude edit capability and approval route in the assigned workspace before writer dispatch; distinguish OS access from host permission and future classifier decisions.
- A denied/no-verdict action stops affected writes; no retry, Bash/PowerShell fallback, mode/rule/hook bypass or silent replacement. Reconcile exact refusal, partial work, actor state and remaining budget before an authorized continuation.
- Cover normal permitted/approval-required, known-denied, unknown/unavailable approval, no-verdict and later-resume scenarios without new runtime or host settings.

### Evidence

- Operator explicitly starts the next ordered issue; coordinator identifies #124. Source base 4a5d3295fea0861af61baa01a442ebe47f06257e.
- Official Claude permission/modes documents reviewed: per-action classifier denial is not predicted by OS writability or a tool list; this Pi session performs no real Claude call.
