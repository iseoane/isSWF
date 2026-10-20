# J006 controlled machine restart

## What changed and why

A real physical restart interrupted a separately authorized synthetic offline worker. Its persistent records and partial result survived. The existing recovery path refused uncertain identity instead of inventing success or restarting the work. No production runtime change or new retry mechanism was needed.

## Visual summary

```text
case 1: wait → 10-second command deadline → terminal failure → reboot refused
case 2: live wait → synced evidence → immediate authorized reboot
new boot → same inputs/partial files → unknown identity → blocked, review required
```

## Scope

Two explicit one-worker authorities, two distinct synthetic targets, one physical reboot. Both worker budgets are consumed; no retries or replacement. No worker model prompt or GitHub effect was requested. This is conservative evidence recovery, not automatic resumption, successful work or universal external-effect recovery.

## Checks and results

`restart-case-v2.json` records actual boot IDs, four unchanged lifecycle metadata records, 41 unchanged before/after workspace files and the Git-baseline comparison. Only the allowed `result.txt` partial differs from baseline. Normal read is unknown because boot identity changed; reconcile is blocked with review required and retry never.

The read-only `verify-restart.mjs` reproduces those checks against the original trusted persistent case. It validates fixed executable consumers against approved retained source before calling the normal read/reconcile CLI. It does not launch, repair, publish, read auth content or reboot. It is job-owned verification, not an installed-package command or a mandatory portable-CI dependency.

## Independent review

PR75 delivered the bounded original-evidence access prerequisite with passing source review and exact PR/main CI. `original-access-verification.json` retains that report and actual read-only runtime observations. The separate `restart-case-v2.json` review field records this case-delivery verdict. The physical test alone is not independent source approval, and publication CI remains a separate gate.

## Integration risk and recovery

This delivery adds safe evidence and a read-only verifier, not execution behavior. Original raw records, both claims and partial work remain private and untouched. A copied archive is not authenticated by this verifier; use only the original approved fixture. An unknown result is never permission to recreate a worker.

## Closure and acceptance

Technical delivery requires passing independent source review and exact PR/main CI. Requested acceptance concerns this bounded actual reboot, evidence-preservation and refusal behavior, not an auto-resume service or client deployment. J013 preserve-all agreement is already explicit; J005/J007 and whole-v1 acceptance are not inferred.

## Blockers and next action

After the case-delivery review and exact PR/main CI pass, inspect the recorded outcome and accept or request changes to this bounded behavior. Operator acceptance and whole-v1 acceptance are not inferred. Do not run another reboot or worker to replace these observations.
