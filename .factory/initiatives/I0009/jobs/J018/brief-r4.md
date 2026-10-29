# J018 — native Windows temporary-evidence eligibility

## Selected outcome and boundary

The operator selects only cut 3: let `evidenceDigest` accept canonical children of the native Windows temporary directory while rejecting that directory itself and unrelated or noncanonical roots. Keep Linux `/tmp` and `/var/tmp` eligibility, the source-object exception, and existing link, traversal, byte, deadline and evidence-pin guards. Change only `tools/diagnostic-probes.mjs` and the existing diagnostic fixture if needed; no new production module, suite or orchestration framework.

Cuts 1/2 were integrated through PR98 as `5f3f711d8567f9550db337ef167235e604480e75`, tree `9af23d99dfd4143217e3bad2432223a9567e8fab`; post-merge Quality run 40904303022 passed all three jobs. Their historical review/acceptance limits remain unchanged: cut-1 independent FAIL for insufficient coverage was operator-accepted, not converted to PASS; cut-2 independent PASS and author TIMEOUT remain distinct.

This cut does not fix diagnostic target-root/separation predicates, Windows privileges or sandbox execution, capacity, directory durability, old caller fetch-count failures or timing. No deadline increases, skipped tests, release, installation, cleanup, further cut or integration permission is implied.

## Authorization and exact candidate

The operator explicitly approved one Luna HIGH author and one Sol MEDIUM independent reviewer through the existing native Pi foreground integration: two fresh contexts, 360000ms shared including intermediate checks, no parent model, retry, replacement, nested actor or extra round. Both completed in 132846ms, consuming 2/2 contexts under the existing OAuth subscription; no further model calls are granted.

Base: `5f3f711d8567f9550db337ef167235e604480e75`. Retained two-functional-file snapshot: `39c65d6f860c2646938c05e9ffe282d8baa0cad22a628deec26c1c7053c218c2`. Only the predicate/imports and the existing root-refusal assertion changed; the latter uses `tmpdir()` instead of literal `/tmp`. No cases or modules were added. Curated plan/brief metadata is coordinator-authored, separate from the functional review.

## Observed verification

- Independent Standards PASS, Spec PASS, aggregate PASS, no findings, on that exact stopped snapshot. The reviewer consumed core methodology, tests before implementation, and recorded observations; no reviewer command execution or independent hashing is claimed.
- Native Windows direct public API: canonical temporary-child digest and temporary-root refusal PASS. Changed bytes match the Linux candidate.
- Full existing Windows diagnostic fixture remains FAIL at file-symlink creation with `EPERM`; later assertions are not certified on Windows. It was neither repaired nor skipped.
- Existing Linux diagnostic fixture with actual Bubblewrap PASS. The author also reports Linux default diagnostic and original-evidence consumer PASS.
- Full working-tree Linux quality PASS with existing Bun 1.4.3 and synthetic-SDK Bubblewrap fixtures; locked Windows ESLint, Knip, documentation and diff checks PASS. HEAD materialization in that run used the baseline; synthetic release fixtures are not evidence of this later publication commit.

Committed-source artifact inspection, branch publication and exact-head PR CI are separate delivery observations, not inferred from those checks. The selected feature-to-PR flow ends with a verified PR for an explicit human integration decision; broader J018 remains partial.
