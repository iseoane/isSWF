# I0058 J011 brief r1: records stay in the assigned checkout, plus missing tests

- Authorization: operator, 2026-11-21, "Dale" (J001 r5 and J011 in parallel, within the 2-worker limit). Standing grant; merge unless HIGH risk.
- Writer: one isswf-worker in its own worktree, bound by `checkout:` and `branch:` lines.
- Objective and acceptance: [plan.md](../../plan.md) J011, both acceptance items. The review-record wording correction is already done on main through coordinator notes.

## Changes

1. **Record location guard.** At dispatch, the dispatch guard path records the child's `checkout:` binding from its prompt, keyed by the child's identity.
   - Claude: the `agentId` returned by the `Agent` call.
   - Pi: the run id.
   - This is the same shape as the J012 ledger, or a sibling under `<git-common-dir>/isswf/`.

   The record guard (`tools/isswf-record-guard-core.mjs`) then checks attempt and review record writes, `A###.md` and `V###.md` under `<state>/initiatives/`.
   - When a write comes from a child with a known binding and its path is outside that checkout, the guard refuses on Claude and on Pi.
   - The refusal names the bound checkout.
   - When the binding is unknown, or on any fault, the write is allowed: fail open.
   - The coordinator's own writes (no child identity) are not checked.
   - Reuse the existing path containment helper.
2. **Tests.**
   - The researcher and planner agent definitions (`agents/`, and the Pi equivalents) do not list `Write`, `Edit` or `Bash`. J008 V004 N2.
   - The `--project` option of `tools/isswf-review-launch.mjs` changes where the selection is read from. J007 V002 F6.
   - The handoff refuses an incomplete entry under the first reviewer spelling instead of trying the next one. J007 V002 F8.
3. **Docs.** EN and ES operations (guards section), describing the location guard and its per-host gaps.

## Scope

- In: the binding capture, the guard check on both hosts, the tests (Linux and Windows paths; inside, outside and unknown binding; a coordinator write), the docs, and the package lists if a module ships.
- Out: other record rules (J001 r5); counting workers (J012).

## Checks

1. In a new worktree, first run `npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund`.
2. Run the touched tests.
3. Run a jiti ts+jsx transform of `hooks/register.tsx`; jiti is in `tooling/quality/node_modules`.
4. Run `node tests/unrun-tests.mjs .`; every new test must be registered.
5. If packaging changed, run `node tests/release-package.mjs .`.
6. Run `node tooling/quality/check-docs.mjs` and `git diff --check`.
7. On the final code head, run `node tools/isswf-verify.mjs --project <checkout> --tier job` and report the stamp path.
8. If you change `.factory/verification.json`, refresh its digest in `.factory/project-setup.md`.
9. Record wall-clock times.
10. Write and commit A001 in your checkout, with full SHAs.

Commit only in your assigned checkout and branch. Run long checks one at a time. Leave no background shells.

## Method

TDD for the guard check. One opus/medium reviewer, 2 rounds, 1 correction.
