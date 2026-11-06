# Job brief J001 / r1

## Identity and authorization

- Source: operator chat 2026-11-06 after the session retrospective.
- Authorization: implementation, local commits, push of `feat/retrospective-improvements`, PR and exact-head CI. No merge.
- Profile: worker. Target base: 649948ade2992033ff95c79d6c59ce4246b0b6d8.

## Objective

Turn five observed failure classes into deterministic checks or tooling.

## Units (one commit each, in this order)

1. **P1 CRLF plans.** `tools/isswf-plan.mjs:44` `parsePlan`: normalize `\r\n` to `\n` before parsing. Add a CRLF case to the existing plan parsing test (find it with `grep -rln parsePlan tests`).
2. **P4 packaged link check.** For every Markdown file shipped by the package allowlist (`package.json` `files` and `tools/factory-package.mjs`), each relative link must resolve to a file that is also shipped. Put it in the most fitting existing test (likely `tests/host-portability.mjs` or `tests/release-package.mjs`). Negative control: a disposable copy where a packaged skill links `../../../docs/en/reference.md` must fail. If existing packaged files already violate it, report them; fix only clear link mistakes, otherwise list them and stop that unit.
3. **P3 local CI-only host checks.** `.github/workflows/quality.yml` runs `tests/host-prerequisites.mjs` (line ~106) and `tests/source-host-isolation.mjs` (line ~136) outside `tools/check-quality.mjs`. Read the workflow to see their prerequisites (`tooling/host-tests` deps, `ISSWF_PLATFORM_ROOT` from platform-package). Add one documented local entry (a small script under `tooling/quality/` or a flag of check-quality) that runs them when prerequisites exist and prints an explicit SKIPPED with the reason otherwise; never install dependencies. Document it in `docs/en/development.md` "Quality checks" and `docs/es/development.md`.
4. **P5 diagram citation re-pin.** New `tooling/maintenance/workflow-citations.mjs <new-revision>`: for each source citation in `docs/diagrams/workflow.json`, find the cited lines from the current pinned revision in the new revision by exact text; with `--write` update moved citations and the revision; always print unresolved citations (path, old range, enclosing heading) and never guess them. Each citation processed once. Mention it in development guide EN/ES next to the diagram regeneration section.
5. **P2 diagnostician bundle margin.** `tools/diagnostic-task.mjs:129,149` caps prompt+instructions at 65536 bytes; the bundle includes `.agents/roles/references/review.md` (line ~118) and had ~120 bytes of margin. First check whether 65536 is documented as a contract (grep `docs/`, `model-routing.md`, `local-worker-lifecycle.md`). Preferred if not documented: raise both caps to one named constant with measured headroom (e.g. 98304) and add a test assertion that reports margin and fails under 8 KiB with a clear message. If it is documented, or a change is unclear, do not change it: add only the margin test and report options.

## Exclusions

- No changes to methodology text beyond the development guides. No dependency installation. Legacy contracts unchanged unless unit 5 shows the cap is undocumented.

## Checks

- Focused tests for each unit, with a negative control per new check (record command and failing assertion).
- `node tools/check-quality.mjs` (full suite) at the end, `node tooling/quality/check-docs.mjs`, `git diff --check`.

## Review

Empirical for P1, P3, P4 and P5 (executable checks with negative controls; coordinator records the criterion-to-assertion map). P2 is combined: empirical for the test, semantic for the contract decision. Budget: 1 worker, 1 review round, 1 correction cycle.

## Execution

- Use Edit/Write for file changes, no python heredocs. Conventional commits, no attribution lines. No push.
- Report per unit: files and line ranges, commit SHA, negative-control command and failing assertion, checks with exit codes, deviations.
