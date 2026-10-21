# Historical development audit

This directory contains archive metadata only. It is not the factory runtime.

Historical `.factory` job reports remain unchanged, including their original references and verdicts. Resolve their `.audit` references at the checkpoint below, not against this metadata-only working directory. Active README/docs links are updated separately.

Tracked historical artifacts remain in Git at `7678f6476501c410245d0056a1e1c5e262ff8c21` (audit tree `f77aee1d95716e4e14ebf5ec1949882fff64f943`). View a file with `git show 7678f6476501c410245d0056a1e1c5e262ff8c21:.audit/<path>`. For reproduction, use the full source and exact inputs required by that historical case, not an isolated script copy. Restoring files does not renew consumed model/worker grants.

## Local-only artifacts

Historical links redirected here refer to local-only evidence, not published files. Consult the guide at the recorded Git checkpoint for its original reference, then look under the private payload. No private filename census is published.

The full local payload and checksum manifest are private under `tooling/.local/audit-archive/audit-7678f6476501-NO2W4F`. They are Git-ignored and must not be installed or published. On another checkout, that private local archive may be absent; Git still preserves the tracked artifacts. Git does not back up the local-only portion: keep the private archive in your own backup before retiring this checkout. No payload was deleted or Git history rewritten.

New durable job receipts belong under `.factory/initiatives/<id>/jobs/<job>/`; development fixtures and raw temporary logs do not belong in the installed product. Do not add new scripts or raw logs here.
