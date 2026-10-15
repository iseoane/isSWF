**Delivery #59 candidate review — documentary only** (no edits, agents, network; validator not executed)

Input checkpoint and target base share `f6608f1…`, recorded separately; worktree HEAD matches. Candidate = the four untracked paths, no commit/snapshot ID. The brief declares that limit and never uses the branch or a self-hash as candidate identity. Scope: exactly four untracked files, no tracked diffs (pre-edit empty porcelain is plausible but not independently verifiable).

| Artifact | What / why / how |
|---|---|
| `.agents/roles/delivery.md` | 8-step profile: pins job/checkpoint/base/grant/candidate, reports change/why/checks/problems, visual only when factual, blast/risk/reversibility, separates closure/review/acceptance, never publishes |
| `.agents/roles/references/delivery.md` | Identity table, summary contents, authorization boundary |
| `docs/templates/delivery.md` | Copyable draft sections incl. checks, problems, review, risk/recovery |
| `.audit/delivery-59-build-brief.md` | Scope and limits; no candidate SHA or self-hash |

**Spec: pass.** Partial/blocked drafts stay labeled and legal; review vs. acceptance separate and coordinator-owned; `not published`/`not authorized` explicit; visuals never fabricated or mandatory; grounding file (§6, drafts within grant) fits.

**Standards: fail — two blockers.** Fixes are one-line.
1. Five links escape `.agents` (`delivery.md:17,28,32`). `verify-markdown-core.mjs:26` copies only `.agents`, then `readFile`s each relative target (`:36–40`) → ENOENT. `spec-v1.md:174` requires format validation where a validator exists; #54 already resolved this exact regression with root code spans (`quality-54-closure.md:15`). The brief's corrected `test -f` probe passed in the real tree, so it missed the fixture. Fix: `` `docs/durable-work.md` `` etc. (`planner.md:9` convention).
2. `delivery.md:17` "…where available" contradicts `durable-work.md:28` (missing checkpoint/path blocks; never substitute latest) and accepted `planner.md`/`researcher.md` wording; it silently permits latest files. Fix: read via `git show <sha>:<path>`; block on missing, and say so in step 1.

**Provenance/grant:** conversation-based, no artifact — the brief declares this and does not self-authorize; the review dispatch naming the same four paths is corroboration only.

**Risk:** text/format only; blast = the validator plus profiles loading this file; reversible by reverting text, no data effects.

**Verdict: aggregate fail** (Spec pass, Standards fail). Re-review the corrected candidate; behavior remains untested.
