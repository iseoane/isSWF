# Retrospective

Stored as `.factory/retrospectives/2026-11-22-session-close.md`.

## Review identity

- Trigger: explicit work-session close (operator, 2026-11-22: "revisa las sesiones de viernes, sabado y hoy domingo")
- Job or session label: sessions of 2026-11-20 to 2026-11-22; I0066 J002
- Reviewed interval: 2026-11-20 00:00 to 2026-11-22 20:50 (main e799c27f). No earlier retrospective file exists under `.factory/retrospectives/`.
- Grant and authorized project: isSWF repository, operator request above; I0066 J002 brief r1.
- Retrospective status: complete
- If pending, reason: not pending; the operator chose all proposals on 2026-11-22 ("añade todas!").

## Evidence reviewed

| Source | Revision or time | What it supports |
| --- | --- | --- |
| `git log --since=2026-11-20` on main | e799c27f | 133 commits; I0061, I0063, I0058, I0064, I0055, I0056, I0065 closed; PRs #364-#398 |
| GitHub releases | v1.9.6-v1.9.9 | four patch releases on 2026-11-22 |
| Failed Quality runs since 2026-11-20 | runs on 4af3ccd2, 018921df, 50f4cc74, plus PR #397 run 45060639451 | CI-only failures and their causes |
| Plans and A/V records of the seven initiatives | main e799c27f | job counts, review verdicts, Run lines, overrides, miss blocks |
| This coordinator session (I0065, I0066, v1.9.9) | 2026-11-22 | guard refusals and friction observed directly |

## Work and outcomes

- 40 jobs completed across seven initiatives; all plans show every job completed. 25 review records carry a fail verdict; each job with a fail verdict was corrected and later passed.
- Four patch releases (v1.9.6, v1.9.7, v1.9.8, v1.9.9), each with exact-main CI packages.
- Active or pending: I0066 J001-J004 pending (plan on main, not started). No worker, reviewer or worktree is active (checked: `git worktree list`, no running agents) at 2026-11-22 20:50.

## Findings

| Finding | Evidence | Impact | Fact, inference, or unknown |
| --- | --- | --- | --- |
| F1. Run lines are missing from most attempt and review records. | Records with `- Run:`: I0061 2/27, I0063 2/19, I0058 21/52, I0064 9/12, I0055 1/7, I0056 2/4, I0065 8/24 (45/145). Operator saw no worker in the pane. | The pane under-reports runs; launch identity is lost for recovery. | Fact (counts); cause in I0065 is the coordinator not passing `--run` (fact); earlier initiatives: inference. |
| F2. Four CI-only failures, none recorded as a miss block. | 4af3ccd2 and 50f4cc74: `isswf-handoff coverage` reported `unreviewed-commits`; 018921df: `unrun-tests` (`isswf-parallel-workers.mjs` not wired); PR #397: `tests/host-portability.mjs` version mismatch (coordinator SKILL.md line). `grep "^- Kind:"` finds no miss block in any of the seven initiatives. | Each cost a CI round (2-6 min Windows) and a fix push; the retrospective reference requires miss blocks and a verification refresh for ci-only misses. | Fact. |
| F3. Coverage and host-portability checks that failed only in CI can run locally. | Both are plain `node` commands; the release procedure now lists host-portability (PR #398); coverage is in I0066 J003 scope. | Same failures can recur. | Fact; that the job tier does not run them: inference, unverified. |
| F4. A local initiative-tier verify on Windows can never satisfy the close gate. | `isswf-verify --tier initiative --record I0065` took 384 s and recorded `check-quality` and `dead-code` as "not run" on win32; the close gate refused it; a `source: "ci"` record of the main Quality run was accepted. | Six minutes lost; the refusal message suggests the local run first. | Fact. |
| F5. The plan commit guard accepted an unparsable plan once. | Commit 12aa0df3 (new I0066 plan with `Brief: None yet; ...`) passed; the next commit of the same file was refused with `unsafe-brief-reference`. | An invalid plan reached main. | Fact; cause (new file not checked): inference. |
| F6. Review record filling is manual and error-prone. | I0065: dispatch refused for a missing brief path (J006 V002); handoff regenerated after the record existed (J003); `Run:` line format refusal; "None.." resolution refusal; override not accepted for a commit that touched a comment in `tooling/`. | Extra rounds; I0066 J003 targets this. | Fact. |
| F7. Windows CI is the critical path. | windows-latest 4m34s-5m42s vs ubuntu 1m48s-2m6s; jobs already parallel. | Every PR waits on Windows. | Fact; I0066 J004 exists. |
| F8. Sizing: I0065 J003 needed two correction rounds; J004 needed a correction plus an operator-requested extra round. | I0065 J003 A001-A003, V001-V003; J004 A001-A003, V001-V003. | Budgets of one correction were exceeded through operator additions. | Fact; sizing miss for J003 (semantic README rewrite underestimated): inference. |
| F9. Decisions that worked: records-only direct push, exact-head CI, `--match-head-commit` merges, and CI artifacts as release source produced no bad merge or release. | PRs #364-#398; v1.9.6-v1.9.9 readback OK. | Keep. | Fact. |

## Misses

None recorded by the coordinator when observed. The four CI-only failures in F2 qualify as `ci-only` misses and are listed here as `late-recorded` (2026-11-22, coordinator, this retrospective) without per-job blocks; recording them in each job's records is proposal P2.

## Improvement proposals

| Proposal and destination | Evidence and impact | Existing source or duplicate check | Structural fix considered first | Verification | Scope: current grant or new grant required |
| --- | --- | --- | --- | --- | --- |
| P1. Refuse missing Run lines (I0066 J001). | F1 | Already I0066 J001. | Yes: guard and record check. | Tests in J001. | Current (I0066). |
| P2. Detect a CI failure on a reviewed head and require a miss block before the fix is merged; run coverage before push. | F2, F3 | `retrospective.md` "Misses" is prose only; I0066 J003 covers coverage before integration. | Yes: `isswf-ci-state` failure plus the integration tool refusing until a `- Kind: ci-only` block exists. | A test where CI failed on a reviewed head and integration is refused without a block. | Needs an I0066 job (operator choice). |
| P3. Close gate guidance: on win32 recommend the CI record directly. | F4 | `tools/isswf-plan-commit-guard-core.mjs:142` message. | Yes: message and `isswf-verify --tier initiative` refusing early on win32 when checks will be "not run". | Test of the message/early refusal. | Needs an I0066 job. |
| P4. Plan guard checks newly added plans. | F5 | `tools/isswf-plan-commit-guard-core.mjs`. | Yes. | Regression test with a new plan file containing an unsafe Brief. | Needs an I0066 job. |
| P5. Record templates without trailing punctuation after placeholders. | F6 ("None..") | `.factory/templates/review.md` Finding resolutions line. | Yes: template change or tolerant parser. | record-check test. | Fold into I0066 J003. |
| P6. Size semantic README rewrites as L. | F8 | `.agents/roles/references/planning.md` sizing. | No structural option (judgment). | Next doc initiative sizing. | Prose; no job proposed. |

- Actual tracker issue created or updated: no.
- Policy, `AGENTS.md`, or skill edited: no.

## Session-close safety

- Active work left untouched: none active.
- Pinned briefs and inputs left unchanged: yes.
- Last known states and evidence: I0066 J001-J004 pending on main e799c27f.

## Limits and next action

- Missing or inaccessible evidence: transcripts of the Friday and Saturday sessions were not read (records and Git only); Saturday CI failures' review state at that moment is inferred from records.
- Analysis failure, if any: none.
- Delivery impact: retrospective pending does not block an otherwise verified delivery.
- Next action: P2 to I0066 J005, P3 to J006, P4 to J007, P5 folded into J003, P6 to J008.
