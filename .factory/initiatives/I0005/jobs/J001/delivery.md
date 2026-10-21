# I0005/J001 delivery

## What changed and why

isSWF can be assembled from a committed revision into a complete on-demand release without requiring a source checkout on the destination machine. Pi package, core and plugin manifest share version 1.1.0. New repositories use `.isswf`; existing `.factory` state moves only through an explicit byte-preserving transition.

## Visual summary

Install package, explicitly initialize each repository, use its retained pinned core, inspect the next release, then explicitly migrate. Package updates never switch project pins automatically.

## Checks and results

- `ISSWF_TEST_PI=/home/iseoane/.pi/agent/bin/pi node tools/check-quality.mjs` passed. The executable path is this environment's existing Pi launcher; other environments can supply their own or omit the optional manager probe.
- The release test builds committed fixture releases, installs the actual tarball with npm offline, and exercises real Pi manager user/project installation with a temporary `PI_CODING_AGENT_DIR`. It does not modify the operator's global configuration or initialize state merely by installing the package.
- Packaged native worker preparation reads historical own methodology without Git and still reads target briefs from their Git checkpoint. Planner, reviewer and diagnostician injected caller suites run against the extracted package.
- Migration tests cover preview without writes, repetition, route/history preservation, retained runtimes, rollback, dirty/drift/active/tamper/symlink refusal, bootstrap recovery, live-owner refusal, post-rename recovery, execution-pin races, and an operator edit during runtime retention.
- ESLint, Knip and `git diff --check` passed separately.
- No Claude process or real factory-provider test was run. SDK session/sandbox execution and registry publication were not verified by these offline checks.

## Independent review

`V001.md` retains the prior failures and the accepted Standards PASS / Spec PASS for candidate `0b8d40a634e5eedd20f09b12431f0c57dbe1ac38def512ee3af13719e331f0c8`. The reviewer verified its 40 file hashes and independently reran the checks. Separate processes used the same Codex model family; no cross-family diversity is claimed.

## Scope

Local implementation and safe offline fixtures only. Existing operator changes in `docs/plan-v1.md`, `docs/vision.md` and unrelated `.factory` records were preserved. No commit, push, merge, registry publication, real global installation or migration of this checkout was performed.

## Integration risk and recovery

The selected store retains exact older cores. Version migration changes the pin, preserves unknown pin fields, saves exact before/after bytes and uses recoverable cooperative claims. Historical records, models and tracking choices are not rewritten. State-directory migration uses exact file/mode inventory and same-filesystem rename. Unknown execution evidence blocks. External writers require operator reconciliation; these controls are not a hostile-writer boundary or global scheduler. Unknown data schemas refuse rather than guessing transformations. There is no automatic cleanup or force unlock.

## Closure and acceptance

Implementation, offline verification and independent review are complete for the accepted source candidate. Product acceptance remains with the operator. The canonical initiative stays in this checkout's existing `.factory` until a separately invoked clean migration; new installations use `.isswf`.

## Blockers and next action

No remaining implementation defect was identified by final review. The next boundary is operator acceptance and authorization to checkpoint, build, publish or install the release. The operator's prohibition on executing Claude remains in force.
