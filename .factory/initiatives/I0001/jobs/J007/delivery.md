# J007 optional context verification

## What changed and why

The coordinator selects advisory context; the factory has no automatic Engram adapter. The earlier scoped CLI/handoff verification remains valid. An additional real installed MCP probe now exposes a concrete limitation: `mem_context` filters observation titles but appends global statistics naming other projects. The new diagnostic and coordinator guidance keep that client-context path blocked; they do not fix Engram or add a memory framework.

## Visual summary

```text
explicit project → selected memory → current source check → pinned role input
scoped search foreign observations → excluded
shared-store summary foreign metadata → client context blocked
missing optional service → primary sources when sufficient
unverified required isolation → client use blocked
```

## Scope

Synthetic data in a disposable store, the existing parent coordinator workflow, and existing native caller contracts. No user memory store mutation, real client data, installation, cloud request, MCP reconfiguration or index rebuild.

## Checks and results

Run `node tests/project-context-engram.mjs /absolute/existing/engram` to verify fresh-process recovery, explicit-project precedence over a conflicting default, and bidirectional project selection. This optional check is not a portable CI dependency. `context-verification.json` retains the actual installed version, executable hash, observations and limits.

Add `--mcp` to the installed command for an isolated MCP stdio probe. On observed Engram 3.4.0 it exits **2**, reporting `BLOCKED-CLIENT-CONTEXT-SUMMARY` and `approvedForClientUse: false`. Scoped searches pass their positive/negative controls, but the summary returns a foreign project name in global statistics. `mcp-verification.json` retains the actual response and explicit limits. This blocked result is not a general MCP or client-use approval.

The portable `node tests/project-context-handoff.mjs .` observes actual prepare-only payloads from coordinator-selected facts, excludes mutable foreign/secret markers, and prepares an explicit source-only absence case. It does not implement automatic selection or a semantic filter.

Existing reviewer and planner tests verify committed context bytes, ignored working-tree drift, no inherited model tools, external grant refusals and failure boundaries. The actual diagnostic sandbox test verifies an outside canary, readonly project, hidden Git/home/environment and refused network access with a host positive control. These checks establish only their named runtime boundaries.

## Independent review

Earlier independent review passed the bounded source unit at `41a2e19c26797083c2d931c882369d8f83d1150f`; it did not establish MCP summary isolation. The additional diagnostic/guidance unit requires its own source review and exact CI. See `mcp-verification.json` for that review status. No report accepts complete J007 or v1.

## Integration risk and recovery

No production runtime change. The installed integration check runs in a real bwrap namespace: only its synthetic home/data are writable, host home/store are absent, credentials are cleared, and network is isolated. It verifies the fixture database location and deletes its synthetic directories after completion. Existing historical observations remain unchanged. A failed or missing optional service must not lead to installing another store or inventing an unresolved decision.

## Closure and acceptance

Project selectors are not authorization or access-control credentials. The parent coordinator can use broad integrations; this unit does not isolate the parent MCP process or certify a general secret detector. Client use remains blocked where required technical separation has not been established. No operator acceptance or whole-v1 completion is recorded.

## Blockers and next action

Complete the additional diagnostic/guidance source review and exact PR/main CI. Shared-store MCP context summaries remain blocked for client use because of the observed foreign-project metadata. Use separately verified scoped queries or pinned files for supported work. Fixing/reconfiguring the installed service needs its own scope; no global change or client dispatch is authorized here.
