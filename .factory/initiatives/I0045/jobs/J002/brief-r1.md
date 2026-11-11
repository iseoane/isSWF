# Job brief J002 / r1

## Identity and authorization

- Initiative I0045, job J002, brief r1. Source: issue #265 and comment `IC_kwDOVIySHc8AAAABlMfphQ` (evidence, not authority); triage in [J001 disposition](../J001/disposition.md).
- Trusted start: operator in the current Claude Code session ("ok adelante!") after the J001 proposal. Default feature-to-PR scope per `.agents/roles/references/feature-delivery.md`: implementation, checks, required review/corrections, commits, push of `fix/265-durable-predispatch`, PR and exact-head CI. Merge is a separate human decision (risk MEDIUM: methodology instructions). No release, install, cleanup, label edits or issue comments.
- Budget: one worker actor, one reviewer actor, up to three review rounds and two correction cycles.

## Objective

A host-native coordinator on either host (Pi, Claude Code) and OS (Linux, Windows) has one documented, supported way to run `isswf-status` for its distribution, and must refuse dispatch unless the canonical plan reads `observed`, the brief is committed and the dispatch names the brief path plus the full document-input SHA. Setup surfaces an ignored state root as conflicting with checkpoints and leaves the choice to the operator.

## Scope

- `docs/durable-work.md` lines ~47-49 and ~75-79: correct the "source-checkout only / not part of the package" statements; give one invocation per distribution: source checkout `node tools/isswf-status.mjs`; Claude plugin or Pi resource package `node <trusted-package-root>/tools/isswf-status.mjs` (`package.json` `files` ships `tools/*.mjs`); receipt-pinned runtime through its launcher (`docs/en/operations.md:35`). State that exit code 0 is not a pass: only `status: observed` is.
- `.agents/skills/isswf-coordinator/SKILL.md`: line 30 (remove "through the pinned launcher" as the only installed path; point to durable-work invocation), §5 (line ~134): explicit pre-dispatch refusal conditions (status `observed`; brief committed and tracked, not ignored/untracked; dispatch names brief path and full input SHA plus target base).
- `.agents/hosts/claude-code.md` and `.agents/hosts/pi.md` "Required child context": same refusal conditions by reference to the coordinator/durable-work, not duplicated contracts.
- `.agents/skills/isswf-setup/SKILL.md` "Tracking and project checks": when the selected state root (beyond `local/`) is Git-ignored, record the conflict with durable-work checkpoints and ask the operator; never force-add or auto-track.
- `docs/en/operations.md` / `docs/es/operations.md` only if they need a matching plugin-install line; keep mirrors equivalent.
- Focused tests: extend an existing static instruction test (e.g. the one checking coordinator/host durable-work references) so the refusal conditions and the invocation statement cannot silently disappear; keep `tests/factory-tools-install.mjs` coverage of shipped `tools/isswf-status.mjs`.

## Exclusions

- No change to `isswf-status` exit semantics or a new runtime gate/dispatcher; no mandatory runtime for host-native work; no automatic tracking of ignored data; no rewriting historical records; no claim of live adherence.

## Acceptance

1. durable-work, coordinator skill and both host guides agree on one invocation per distribution and no longer say the tool is unshipped or launcher-only.
2. The coordinator skill states concrete pre-dispatch refusal conditions: status other than `observed` blocks; uncommitted/untracked/ignored brief blocks; missing brief path or full input SHA blocks. Exit 0 alone is explicitly not sufficient.
3. Setup records and asks about an ignored state root; operator choice preserved.
4. Bilingual mirrors equivalent where a guide changes; `node tooling/quality/check-docs.mjs` PASS; focused tests pass and fail without the new text (negative control recorded); eslint/knip unaffected; `git diff --check` clean.
5. Linux evidence locally; Windows via native CI; Pi/Claude live adherence recorded as an explicit gap.

## Reading map (base 6ef5a9deb1d8baf25cdecb2877943307be19eadd)

- `docs/durable-work.md:47-53,75-79`; `.agents/skills/isswf-coordinator/SKILL.md:30,92,98,134`; `.agents/hosts/claude-code.md` "Required child context"; `.agents/hosts/pi.md:67`; `.agents/skills/isswf-setup/SKILL.md:145-147`; `docs/en/operations.md:18,35` and Spanish mirror; `package.json` `files`; tests: `tests/factory-tools-install.mjs`, `tests/initiative-status.mjs`, and grep `tests/` for `durable-work` static instruction checks.

## Methodology considered

- isswf-writing: selected (agent instructions and guides). Evidence: reasoned audience/placement notes in the attempt.
- verification principles: selected (regression of a skipped requirement). Evidence: negative control for the new static assertions.
- design principles: not selected (no CLI/data-shape change).
- isswf-tdd: not selected (instruction/doc-dominant; static assertions with negative control instead).
- isswf-interview: not selected (no product gap; operator choice for state tracking is preserved, not decided).
- isswf-e2e, security, performance, observability, researcher: triggers do not apply.

## Next step

Dispatch the worker in the primary checkout on `fix/265-durable-predispatch` (shared-sequential; Claude per-child worktree binding unverified per setup). Then independent review of the exact diff, PR and CI.
