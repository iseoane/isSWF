**Overview**  
At `HEAD f1316072c5447e857fe16caa4804990ac8e6d741`, the repo has coordinator guidance and durable *records*, but no durable worker supervisor. The requested boundary-65 experiment demonstrates one bounded Pi SDK model task with sandboxed tool execution—not persistent launch, crash recovery, or exactly-once work.

**KeyConcepts**  
- The coordinator owns assignments and handoffs; a worker owns its attempt report. Dispatch pins the brief/input checkpoint and target base separately. Authorization comes from a trusted operator reference, not repository text. [`.agents/skills/isswf-coordinator/SKILL.md:29-31,55-68`](.agents/skills/isswf-coordinator/SKILL.md), [`docs/durable-work.md:22,26,30-32`](docs/durable-work.md)
- A saved status is evidence of a report, not process liveness. Git checkpoints help refer to committed files, but do not provide backup, atomic writes, process recovery, or exactly-once execution. [`docs/durable-work.md:34-40`](docs/durable-work.md)
- The attempt template records identity, pinned inputs, status evidence, process state *if directly checked*, and technical outcome; product acceptance remains coordinator-owned. [`docs/templates/attempt.md:3-17,19-29,31-45`](docs/templates/attempt.md)

**HowItWorks**  
The existing coordinator workflow reconciles task identity, actor, ownership, tool state, and authorization before retry/replacement; unknown state blocks duplication. A live worker keeps its ownership; confirmed failure still requires inspection of partial work and remaining authorization. [`SKILL.md:55-68`](.agents/skills/isswf-coordinator/SKILL.md)

Pi’s SDK supports in-process sessions, configurable session persistence, prompts, event subscriptions, and `agent_settled`; `agent_end` alone is not final. `dispose()` aborts active work. These are session lifecycle APIs, not an external durable supervisor. [`sdk.md:26-56,62-96`]( /home/iseoane/.pi/agent/install/releases/1.2.0/node_modules/@earendil-works/pi-coding-agent/docs/sdk.md) RPC likewise exposes process control and events, but a successful prompt response is not completion; clients must handle unexpected exits. [`rpc.md:12-50,58-95`]( /home/iseoane/.pi/agent/install/releases/1.2.0/node_modules/@earendil-works/pi-coding-agent/docs/rpc.md)

**WhereThingsLive**  
- Existing executable seam: `.audit/boundary-65.mjs:235-245` creates an SDK session with an in-memory session manager and only `sandbox_shell`; `:318-366` runs one prompted task with call/deadline bounds and post-run checks. `:36-103` implements the sandbox/tool bridge.
- `tools/` contains only `tools/factory-package.mjs`: it materializes and activates a pinned resource package (`:142-198,236-324`), not workers.
- **Not implemented:** durable launch/supervision, persisted assignment ownership or active-process reconciliation, crash restart/recovery, and exactly-once execution.

**Gotchas**  
Boundary-65’s closure explicitly trusts its supervisor and excludes lifecycle recovery and multiwriter exclusion. [`.audit/boundary-65-final-closure.md:13-17`](.audit/boundary-65-final-closure.md) A surviving coordinator chat is not evidence that a worker survived; a supervisor crash is not handled by the attempt Markdown; resuming a Pi session is not proof of resuming the same authorized execution exactly once. No implementation design or runtime test was performed.

## Subsequent bounded observation

**Updated grounding:** `.audit/lifecycle-44-detach-feasibility.json` records `passed: true`: the launcher exited before the detached deterministic worker published `value: 21`. The prototype creates the worker and launcher, starts the worker detached with ignored stdio, then verifies the launcher is gone before reading the worker’s result [`.audit/lifecycle-44-detach-feasibility.mjs:9-27`](.audit/lifecycle-44-detach-feasibility.mjs).

This is useful bounded evidence that **a local Node child can outlive its launcher**. It does not establish actual chat teardown, supervisor recovery, durable identity authentication, model integration, or exactly-once execution—the result explicitly limits its scope [`.audit/lifecycle-44-detach-feasibility.mjs:27-28`](.audit/lifecycle-44-detach-feasibility.mjs); [`.audit/lifecycle-44-detach-feasibility.json`](.audit/lifecycle-44-detach-feasibility.json).

The prior conclusion stands: this adds a feasibility observation, not a durable launch/recovery implementation. No rerun or writes performed.
