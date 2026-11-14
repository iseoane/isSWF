# J029 r3 — Actual interrupted-owner public recovery, Windows and Linux

## Current start and state

Operator resumed I0009 on native Windows 2026-11-14 ("adelante") after slice 1 (normal migration) integrated as PR266 merge `bb2216bdf809cc0350a9720f529812204956d1af`; exact-head `99dc65c` Quality SUCCESS 3/3 including the Windows matrix. Coordinator reran on native Windows x64, Node v26.12.1, main `e1e09d7`: `tests/state-migration-publication.mjs` PASS (6 s), `tests/directory-sync-portability.mjs` ok (1 s), `tests/release-package.mjs` PASS (217 s). Fault injections there remain test substitutions, and release-package recovery uses dead-owner fixtures, not interruption. Report-accuracy follow-up: A001's GREEN claim for `124a605` stays contradicted by coordinator-checks-r2; A002, delivery and plan receipts match the observed PR/CI state. V001's TDD-sequence FAIL stays as recorded; the one-off acceptance does not turn it into PASS.

This revision is slice 2 of brief-r1: actual migration-owner loss and installed public `recover-state`. Execution waits for the operator's approval of the budget below.

## Outcome and acceptance

1. A real installed `migrate-state` process is terminated abruptly at each reproducible boundary of `tools/state-migration.mjs` `moveState`: claim published, no journal record (claim-before-journal); record published, before `rename`; after `rename`, before `complete.json`. Then public `recover-state` through the same installed launcher, using the existing identity/cessation contract, resolves to exactly one active root with the recorded inventory, writes the expected `recovered.json`/`complete.json`, and a repeat is stable.
2. Controls refuse and keep claim, journal and state bytes: owner still alive (a real paused process), malformed `owner.json`, claim/journal disagreement, inventory drift after interruption, both roots present.
3. Interruption is a real process ending (SIGKILL on Linux, TerminateProcess/`process.kill` on Windows), not an injected `ceased` predicate. A test-only preload or pause seam that stops the real process at a boundary is allowed; production code must not gain a test hook. Name the launcher. If the compiled Bun artifact cannot host the seam, cover it with the genuine Node release launcher and state the Bun gap.
4. Linux and native Windows: the new journey runs in the existing CI matrix and locally on this Windows machine. Do not assert POSIX modes on Windows or claim directory-entry power-loss durability on Windows.
5. English/Spain-Spanish recovery guidance describes actual operator steps and limits. Preserve strict owner identity, claims, journals and no-replay behavior. No forced unlock, automatic claim clearing or blind replay. A production defect found by the journey is reported to the coordinator before repair.

## Ownership and authority (pending approval)

Trusted factory and target: this checkout. Shared-sequential policy: dedicated branch `feat/j029-interrupted-recovery` from current main, one writer. Untracked `.agents/skills/project-release/` and uncommitted I0055 records are not J029 scope and are never staged by the worker.

Writer paths: `tests/release-package.mjs` or `tests/platform-package.mjs` (prefer extending the existing installed harness), one focused test file if needed, `.github/workflows/quality.yml` only to run it, `docs/installation.md`, `docs/en/installation.md`, `docs/es/installation.md`, next unused attempt record `A003.md`. `tools/state-migration.mjs` and `tools/isswf.mjs` are read-only unless the coordinator approves a reported defect.

Approved budget (operator, 2026-11-14: "adelante! incluso te apruebo 2 extras por si acaso"): Claude Code native roles per the approved preset, worker `sonnet`/medium and reviewer `opus`/medium. At most 8 child calls: the base 6 (1 worker, up to 3 independent review rounds, up to 2 correction cycles) plus 2 contingency calls for a review or correction the coordinator judges necessary, each with its reason recorded. No automatic retries or nested delegation. Disposable fixtures only; kill only processes the test itself started. Coordinator owns commits beyond the worker's local ones, push, PR and CI; merge needs a separate operator decision. Actual effective model and effort will be recorded as observed or unknown.

## Methodology and verification

Worker: AGENTS.md, REVIEW.md, worker role, comments and code-quality references, `docs/durable-work.md`, `docs/installation.md`, this brief, brief-r1 and analysis-20261111. Selected: isswf-e2e (CLI/API, test-quality), isswf-debug (bug diagnosis) for boundary attribution, isswf-writing for the guides. TDD is not selected: the expected change adds acceptance coverage for existing behavior. A failing journey is a diagnosed finding, not a planned RED.

Independent combined Standards/Spec review is required because data-loss and false-cessation risk is material. The reviewer receives the exact candidate, the retained interruption receipts and the review resources, and judges whether the receipts show real process loss at the claimed boundary. Checks: the new journey, `state-migration-publication`, `release-package`, docs check, ESLint on changed files, `git diff --check`; the full quality suite only if packaging paths change. CI runs the full suite.
