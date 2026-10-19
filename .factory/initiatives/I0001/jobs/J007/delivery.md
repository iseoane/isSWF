# J007 optional context verification

## What changed and why

The coordinator selects advisory context; the factory has no automatic Engram adapter. This unit adds an optional installed-Engram regression and records current source precedence and existing native capability checks. It does not add a memory framework.

## Visual summary

```text
explicit project → selected memory → current source check → pinned role input
foreign context → excluded
missing optional service → primary sources when sufficient
unverified required isolation → client use blocked
```

## Scope

Synthetic data in a disposable store, the existing parent coordinator workflow, and existing native caller contracts. No user memory store mutation, real client data, installation, cloud request, MCP reconfiguration or index rebuild.

## Checks and results

Run `node tests/project-context-engram.mjs /absolute/existing/engram` to verify fresh-process recovery, explicit-project precedence over a conflicting default, and bidirectional project selection. This optional check is not a portable CI dependency. `context-verification.json` retains the actual installed version, executable hash, observations and limits.

The new portable `node tests/project-context-handoff.mjs .` observes actual prepare-only payloads from coordinator-selected facts, excludes mutable foreign/secret markers, and prepares an explicit source-only absence case. It does not implement automatic selection or a semantic filter.

Existing reviewer and planner tests verify committed context bytes, ignored working-tree drift, no inherited model tools, external grant refusals and failure boundaries. The actual diagnostic sandbox test verifies an outside canary, readonly project, hidden Git/home/environment and refused network access with a host positive control. These checks establish only their named runtime boundaries.

## Independent review

Pending exact-candidate native review. Neither the coordinator's observations nor fixture responses are an independent review.

## Integration risk and recovery

No production runtime change. The installed integration check runs in a real bwrap namespace: only its synthetic home/data are writable, host home/store are absent, credentials are cleared, and network is isolated. It verifies the fixture database location and deletes its synthetic directories after completion. Existing historical observations remain unchanged. A failed or missing optional service must not lead to installing another store or inventing an unresolved decision.

## Closure and acceptance

Project selectors are not authorization or access-control credentials. The parent coordinator can use broad integrations; this unit does not isolate the parent MCP process or certify a general secret detector. Client use remains blocked where required technical separation has not been established. No operator acceptance or whole-v1 completion is recorded.

## Blockers and next action

Complete independent review and exact PR/main CI. Reconcile residual MEM/SEC criteria explicitly rather than calling scoped synthetic tests universal isolation proof.
