# J008: Connect shared roles to host-native delegation

## Objective and authorization

The operator approves reducing isSWF to shared methodology with thin host integrations, retaining native Windows/Linux and both Pi/Claude Code. After the isolated pi-subagents trial, the operator says to proceed. Implement and check this functional unit locally; do not install globally, migrate source state, remove evidence, merge or invoke real models. Existing feature-branch delivery authority does not imply integration or package publication.

## Grounding

Current standalone delivery baseline: `d97d69868177bdb568affb64c726025478bf483a` (actual remote main). The earlier prototype baseline was `1c7e898ca1eb4e8e35c455aeadbb1f39832caed7`; its results below are retained prior evidence, not checks of the ported candidate. Package and plugin manifests, shared coordinator/setup/worker, host guides and role wrappers are the affected consumers. The published pi-subagents 0.83.0 manifest/discovery supports `pi.subagents.agents`; actual Pi 1.4.0 offline foreground trials passed on native Windows and Linux (Debian/WSL), using a loopback stub. Claude already has native agent definitions. No custom execution extension is needed for this unit.

## Scope and acceptance

- Package Pi role definitions discoverable by pi-subagents, sharing methodology with existing Claude roles.
- Select model/effort through host configuration, not the legacy Luna/high adapter. Missing capability blocks only that delegation; never substitute another host/model automatically.
- Make host-native delegation the normal coordinator/setup path without requiring a project runtime pin, external grant file, compiled factory executable or capacity store. Keep explicit legacy assignments on their original guides and contracts.
- Provide shared task scope, checkout, baseline/candidate, role resources, selected model/effort, budget and useful verification. Keep independent judgment separate from implementation; no mandatory role pipeline.
- Preserve existing executables, runtime tests, historical pins/verdicts and reservations unchanged. Claim no OS containment or crash-recovery equivalence for native host sessions.
- Verify package role discovery and offline worker/reviewer behavior against actual Pi/extension dependencies on Windows and Linux, plus Claude wrapper/inventory checks where available. Static Claude checks are not live acceptance. Keep unresolved tests/review visible.

## Verification and stopping condition

Use focused metadata/instruction checks, an actual SDK plus local synthetic provider harness, existing host portability and packaging checks, bilingual docs and locked static checks. No real provider calls. Record harness/limitations in this brief rather than creating another status store. Semantic assessment covers the changed default execution boundary; independent acceptance remains pending until a separately supported authorized context exists. Complete the unit only with observed affected checks, or name the specific remaining blocker.

## Observed implementation and verification

- Shared profiles and host-native coordinator/setup/default-delivery instructions are connected. Pi uses `pi.subagents.agents`; Claude uses default top-level `agents/` discovery. No new production dispatcher, supervisor, runtime route exception or global setting was added. Legacy executables and historical attempts are retained.
- Development dependencies pin Pi 1.4.0, pi-subagents 0.83.0 and Claude Code 2.1.299. Actual isolated `npm ci --ignore-scripts --no-audit --no-fund` passed on Windows and Linux. No pre-existing locked dependency version changed.
- An actual npm tarball from the staged LF source was inspected and installed in isolated consumers on both systems. Round2 tests passed: Pi discovers all four roles; a synthetic worker writes the assigned result at high effort, a synthetic reviewer reads it at medium effort, provider failure remains visible, and foreground cancellation returns. Claude's actual plugin inventory reports the four named native profiles. This is not real-provider or Claude delegation acceptance.
- A discovery regression was reproduced: explicit per-file Claude manifest agent entries returned zero inventoried agents even for a minimal valid profile; default directory discovery returned the expected profile. Pi profiles were moved out of Claude's directory. Original unsuccessful artifact/probes remain retained; manifest validation alone did not prove discovery. `claude agents --json` lists sessions, not role profiles.
- Evidence: external `isswf host-native candidate b9dU1W/round2` contains LF source, tarball, pack report and Windows consumer. Windows check root `isswf native roles ñ RB1Wg2`; Linux check root `/tmp/isswf native roles ñ 3CZ4mQ`, using native Linux Node in Debian WSL. No WSL result substitutes for native Windows; neither proves background trees, OS isolation or crash recovery.
- Static host-portability and worker-methodology checks passed against the LF candidate. The original source working copy's CRLF-sensitive pre-existing frontmatter failure remains distinguished from that result. Bilingual docs, focused lint and diff checks passed after the final inventory fix. The first committed-source portable checks on `fde4abe6a295029817c8f814af4ea0322efad419` failed on both systems: the retained package validator only permitted `pi.skills`, so it rejected the new `pi.subagents` metadata. Both package-validator allowlists were extended for exactly the declared profile directory while keeping old manifests valid and refusing unknown paths/settings and production dependencies. `tests/package-metadata.mjs` passed on Windows and Linux against the actual CLI validation branches, using manifest-only repositories that deliberately stop at the next missing-payload guard; this is not full package acceptance. The failed logs remain retained; a wrapper's empty Linux exit text was not treated as PASS. Broader checks on `f8deacd` remain FAIL: Windows `initiative-status.mjs` cannot create its symlink (`EPERM`); Linux `diagnostic-task.mjs` exceeded its 60-second subprocess deadline. A process inspection found no surviving diagnostic/Bubblewrap process. A later standalone release test passed the Windows builder/metadata gates but stopped at its existing `spawnSync npm ENOENT`; Linux construction hit its 45-second deadline. No unrelated legacy repair or timeout increase was selected. Full ESLint and Knip passed; independent semantic review and passing broad quality/CI remain unclaimed.

## Retained focused candidate

Candidate `9d0572abfe7d8a16c1ecaffb803f1e62b0f3133e` passed the final focused checks from fresh LF committed-source clones on native Windows and Linux. Both actual CLI metadata guards passed. The same inspected npm artifact contains four Pi and four Claude profiles and no private initiative/auth paths. Pi's actual SDK synthetic foreground cases and Claude's four-role plugin inventory passed on both systems. Windows root: `isswf native roles ñ 0vc9eG`; Linux root: `/tmp/isswf native roles ñ EnuVXK`. Artifact SRI: `sha512-k1l8d/ho6yZZgwgk2Br1qiLQh9UIl/rcu03EAOz5RKHquDkHNJ8nbKf2TtBfT+Ci3PopV2Y8GtRsrVHW2xv2CA==`. Reproduction pointers and exact limits are retained privately in `tooling/.local/windows-install/host-native-unit-results.json`. Final full ESLint, Knip, bilingual-doc checks and diff checks passed.

This record does not change the failed broad checks above into PASS. No live model, independent semantic verdict, hosted CI, publication, installation migration or merge is claimed. The local functional unit is 648 changed lines before this record-only update; one coherent slicing pass found roles, shared default, host metadata, regressions and bilingual usage belong together. Publication requires reconciling the size exception/delivery strategy rather than silently expanding the paused runtime PR.

## Approved standalone delivery and green-check work

The operator explicitly approves the standalone PR and size exception, and asks to get the checks green. Keep PR #87 paused and unchanged. The isolated delivery branch contains only this unit over actual remote main, not the experimental native runtime. Current authority covers reversible fixes, tests, commits, branch push, PR creation and exact-head CI, but no real providers, new live actors, global changes, merge or release.

Port validation found that compiled releases and materialized Markdown packages did not include the new Pi host resources even though source npm packing did. The exact optional resource allowlist now includes the host guide, four thin profiles and their shared planner/researcher resources, with byte checks for both package paths. CI delegation consumes the installed platform artifact rather than only source files.

The native-filesystem Linux release suite passed independently in 63.9 seconds but exceeded the portable harness's 60-second bound. A diagnostic trace found the three serial installed-role fixture suites cost 25.7, 8.9 and 5.4 seconds; builds cost about 1.6 seconds. Run those independent fixture suites concurrently against the read-only installed artifact and wait for every child before teardown, keeping all assertions and their 45-second deadlines. Windows npm commands use the Node-installed npm CLI, as the existing platform fixture already does, instead of requiring an executable named npm. New exact-candidate results remain pending; do not claim the earlier failed broad checks passed.

## Rollback

Revert this unit's manifest/profile/instruction/default-flow changes together. Existing legacy tools and retained installations remain available; rollback does not delete or replay any attempt or alter global host settings.
