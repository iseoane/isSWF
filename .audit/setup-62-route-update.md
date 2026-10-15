Proposed minimal changes:

```diff
--- .factory/models.json
+++ .factory/models.json
@@
     "researcher": [
-      { "model": "opencode-go/glm-5.3-flash", "effort": "high" },
-      { "model": "openai-codex/gpt-6-luna", "effort": "medium" }
+      { "model": "openai-codex/gpt-6-luna", "effort": "medium" }
     ],
```

```diff
--- .factory/project-setup.md
+++ .factory/project-setup.md
@@
-Model configuration: .factory/models.json, inherited approved routes, no override.
+Model configuration: .factory/models.json; researcher uses the explicitly granted
+whole-route override recorded there for future attempts only; no fallback.
 Custom decision: preserve the existing review checklist.
 Isolation: not technically established; client execution blocked.
+
+## Setup evidence
+Target: /tmp/isswf-setup62-kyQXJd/approved-route-update
+Target base: 8aeb5260907573d1d9215f6f6d6134d83e3b06e7
+Source checkout: /home/iseoane/Work/isSWF
+Source checkpoint: 9dc64bb34411f18f7ac01ee6fdb3443eced3b002
+Grant: operator-approved whole-route researcher override, no fallback,
+future attempts only. Route values are in .factory/models.json.
+Checks: node check.mjs localapproved, scopefixtureowner, localdraftonly,
+isolationunverifiedclientblocked (all passed).
+Delivery: local draft only; no commit authorized. Checkpoint pending.
+Isolation: unverified; client execution blocked. Runtime/effort availability
+was not tested. Existing attempts were not changed.
```

Target was clean at its observed base. Applying only these two target-owned file changes now.

**Configured** in `/tmp/isswf-setup62-kyQXJd/approved-route-update`:

- Updated the researcher route in `.factory/models.json` to the approved whole-route override. Other roles are unchanged; no fallback is configured.
- Updated `.factory/project-setup.md` to reference the canonical config and record the grant, source checkpoint, checks, and delivery boundary.

All four requested Node checks passed, as did route/other-role verification and `git diff --check`. Target base: `8aeb5260907573d1d9215f6f6d6134d83e3b06e7`; source checkpoint: `9dc64bb34411f18f7ac01ee6fdb3443eced3b002`.

Isolation remains unverified, so client execution is blocked. Runtime availability was not tested. Changes are uncommitted; checkpoint pending.
