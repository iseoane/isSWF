# Inspect work without starting agents

[Home](../../README.md) · [Documentation](index.md) · [Español de España](../es/operations.md)

Use the coordinator to understand the next step. The commands below inspect recorded work or open its local panel; they do not call a model. Replace example paths and initiative IDs with existing values. They do not initialise a repository or create a plan.

## Normal host-native work

New ordinary tasks use the host's delegation with shared isSWF roles: Pi with the separately installed `pi-subagents` extension, or Claude Code with native agents. See [host support](../host-portability.md) for the configuration example and boundaries. Configure model and effort in the selected host, not in the legacy executor's route file. A missing extension requires an installation decision, not a new supervisor.

The coordinator supplies scope, working directory, budget and checks, then verifies the actual change. For long work, a supported native background launch returns control while the operator continues the conversation; the coordinator reports the real run identity and consumes its completion/result before dependent actions. Long CI uses a verified completion event or one bounded deferred check, never continuous watching or model polling. Stale or duplicate results require reconciliation, not repeated actions. In Claude Code, directing a live child or continuing a finished one uses only the exact returned agent ID and the host's exposed eligibility, within the original authority and budgets; see [live direction and eligible continuation](../../.agents/hosts/claude-code.md#live-direction-and-eligible-continuation). No compiled factory executable, project runtime pin, external grant file or capacity store is required for this path. Windows and Linux are both targets; report actual host/platform evidence separately. Do not reinterpret existing interrupted runtime jobs as new tasks to bypass claims. The inspection commands below remain available for recorded legacy work.

## From a source checkout

Run from the isSWF repository root:

```bash
node tools/isswf-status.mjs --project /absolute/project --initiative I0001
node tools/isswf-panel.mjs --project /absolute/project --port 0
```

The first command reads an initiative's plan and supporting records. The second starts a foreground server on `127.0.0.1` and prints its URL. Stop it with Ctrl-C. It lists initiatives and lets you inspect their jobs, evidence, and recorded decisions.

The panel can record local notes when the displayed evidence still matches. A note is not automatically applied, authenticated operator acceptance, or permission to dispatch work. Do not expose the panel publicly or put secrets in its records.

## From a prepared installation

`RELEASE` below means the absolute directory of an already prepared, trusted package. It is not a download address. No public release is assumed.

Use `bin/isswf.exe` on Windows. For a retained legacy Node release, follow that release's installation guide and Node prerequisite. These commands do not establish native mutation or isolation support outside Linux.

```bash
RELEASE/bin/isswf inspect --project /absolute/project
RELEASE/bin/isswf locate --project /absolute/project
RELEASE/bin/isswf exec --project /absolute/project -- isswf-status --initiative I0001
RELEASE/bin/isswf exec --project /absolute/project -- isswf-panel --port 0
```

`inspect` shows installation and migration information without changing the project or store. `locate` verifies and locates the selected retained runtime. `exec` uses that project's pinned runtime, not automatically the newest globally installed package. Missing or damaged retained code blocks the operation.

## Create an offline token summary

`tools/token-report.mjs` reports only summaries you explicitly supply. It does not inspect host sessions, call a model, or estimate billing. Manually transcribed Pi and Claude summaries are labelled in the input. Keep input files sanitized and local.

Each JSON file has `version: 1`, `mode: "window"`, and `rows`. A row is one independent, nonoverlapping window and contains a bounded opaque `id`, `host` (`pi` or `claude`), `hostVersion`, `model`, `effort`, `taskClass`, `candidate`, `outcome`, nonnegative `accepted` count, provenance (`manual-pi`, `manual-claude`, `native-pi-summary`, or `native-claude-summary`), `scope` (`agent`, `unattributed`, or `tree`), `window`, and `counters` with `input`, `output`, `cacheRead`, and `cacheWrite`. IDs and metadata use 1–128 ASCII letters, digits, `.`, `_`, `:`, `+`, or `-`; use opaque identifiers, never paths or private text. Counters are nonnegative safe integers or JSON `null` for unknown. Categories must be disjoint. Rows sharing a window and outcome repeat the same candidate and acceptance count; the report counts that outcome once, not once per agent. Contradictory declarations for that group are rejected. Cumulative, reset, resumed, and event data must first be converted by the supplier to one bounded, nonoverlapping window; unsupported modes are rejected. Do not combine a tree row with other rows for the same window. Include an unattributed row when coverage is unknown; never invent actor shares. Unknown fields are refused and output contains only the allowlisted summary fields. Optional `durationSeconds`, `requests`, `turns`, `corrections`, and non-additive `reasoning` counters are separately labelled.

Provide a single summary or matched before/after files:

A minimal valid single-row summary is:

```json
{
  "version": 1,
  "mode": "window",
  "rows": [
    {
      "id": "agent1",
      "host": "pi",
      "hostVersion": "1.0",
      "model": "model1",
      "effort": "high",
      "taskClass": "task1",
      "candidate": "candidate1",
      "outcome": "outcome1",
      "accepted": 1,
      "provenance": "manual-pi",
      "scope": "agent",
      "window": "window1",
      "counters": { "input": 100, "output": 20, "cacheRead": 30, "cacheWrite": 5 }
    }
  ]
}
```

Run one summary or compare before/after files:

```bash
node tools/token-report.mjs --input "summary.json"
node tools/token-report.mjs --before "before.json" --after "after.json"
```

The accepted count covers the supplied window, including failed, review, and correction work. The report shows known components, a complete processed total or labelled partial subtotal, cache-read share only when its denominator is known and positive, and tokens per accepted outcome only when all components and a positive acceptance count are known. The report labels tree-only data `aggregate-only`, individual rows `individual`, and missing attribution `unattributed` or `partial`; it does not describe an inclusive tree total as agent attribution. Comparisons match each row by window, actor ID, and outcome identity, then require matching host/version, model/effort, task class, scopes, acceptance counts and category availability. Candidate may differ between the before and after runs. A positive known baseline is required for differences. Otherwise differences are explicitly incomparable or undefined. A lower cache-read share or total alone is not a quality or savings claim. Input is capped at 1 MiB combined and 100 rows; each row is capped at 4 KiB and output at 64 KiB. This is offline arithmetic, not measured live host behavior or billing.

### Normalize supported native summaries

`tools/token-native-summary.mjs` accepts one explicit Pi receipt from the optional source extension or one explicitly supplied Claude final-result JSON. It reads at most 1 MiB combined and emits bounded normalized JSON; it never searches session stores or reads transcripts. A standalone receipt/result is emitted with `mode: "snapshot"`, which the unchanged `token-report.mjs` rejects. Snapshots are cumulative and cannot be used as accepted-outcome windows.

For a Pi report window, supply both cumulative snapshots. The converter requires the same opaque session identity and host version, a start-branch prefix of the end branch, monotone parent/child counters, stable existing child identities and no removed rows or unresolved async children. New child rows contribute their reported attempt counters. If lineage is not established, retain the labelled snapshot or refuse the window; do not add snapshots together.

Claude accepts a window only from two explicit final-result summaries for the same `session_id`, identical model identities and a known caller-declared host version (an `unknown` version is refused). Counters are compared per model and must be monotone; a reset/session change or model-set change is refused. If either boundary lacks a category, its window delta remains unknown. The emitted report contains one inclusive tree row, never additive model/agent rows. A single result—including a resumed cumulative result—remains a snapshot and is rejected by `token-report.mjs`.

Claude tree summaries use only `modelUsage`; they never promote main-loop `usage` or add thinking tokens. Model identities are represented by a stable hash, not names. An optional explicitly supplied `{ "agentOutput": ... }` completed AgentOutput summary is separately normalized as an individual snapshot; each absent numeric category stays unknown, nullable cache fields stay unknown, and malformed present values or asynchronous launches are refused. Prompt, content, worktree and raw agent IDs are filtered or hashed. Individual snapshots remain separate from tree windows. That adapter is grounded in the locked local `@anthropic-ai/claude-code` 2.1.299 declaration only; it does not establish installed Claude 2.1.312 output compatibility or live availability. Neither individual snapshots nor a tree snapshot alone can claim a report window or accepted-outcome efficiency.

```bash
node tools/token-native-summary.mjs --input "pi-receipt.json" --host pi > "pi-snapshot.json"
node tools/token-native-summary.mjs --input "pi-end.json" --start "pi-start.json" --host pi --id task --window task-window --host-version unknown --effort high --task-class implementation --candidate current --outcome task --accepted 1 > "native-window.json"
node tools/token-report.mjs --input "native-window.json"
node tools/token-native-summary.mjs --input "claude-final-result.json" --host claude --host-version 2.1.312 > "claude-snapshot.json"
node tools/token-native-summary.mjs --input "claude-end.json" --start "claude-start.json" --host claude --host-version 2.1.312 --id task --window task-window --effort unknown --task-class implementation --candidate current --outcome task --accepted 1 > "claude-window.json"
node tools/token-report.mjs --input "claude-window.json"
node tools/token-native-summary.mjs --input "claude-agent-output.json" --host claude --host-version 2.1.312 > "claude-agent-snapshot.json"
```

`tools/token-native-pi.mjs` is optional source code, not autoloaded or registered. From the repository root, a user can explicitly load it with `pi -e ./tools/token-native-pi.mjs` and invoke `/token-native-snapshot --out <new-file>`. It checks the `pi-subagents` event-bus `ping` capability, then requests its documented `cost` RPC once. It writes only allowlisted normalized counters and opaque identities, records Pi host version as `unknown` because the supported API does not expose it, uses exclusive file creation, and fails without exposing RPC errors or private paths. Supply an independently observed version to the converter when known. This source implementation has fixture coverage only: it is not live host activation or proof of installed-version/platform behavior. Do not enable it without reviewing the code and choosing the destination.

## Understand the result

`awaiting-human` means a specific decision is needed, whether during definition, setup, acceptance or PR integration. The record should name the question and what answer allows work to resume; a definition question does not need a delivery first. `blocked` describes a technical condition needing resolution, not automatically a request for your approval. Notes in the panel do not apply either decision; the coordinator reconciles your actual instruction.

A plan status describes recorded work, not a heartbeat or a fresh GitHub query. Missing or inconsistent evidence remains unknown. A completed worker does not prove independent review, operator acceptance, publication, or merge.

Before retrying interrupted work, inspect the actual process identity and partial files. Do not free claims, change stores, or invent a new job ID to bypass an unresolved writer. Execution callers require their own exact inputs, model and budget checks, and current permission. The status command and this guide grant none of them.

For installation and recovery, read [installation](installation.md). The coordinator's detailed English execution resources remain [worker lifecycle](../local-worker-lifecycle.md), [model routing](../model-routing.md), [durable records](../durable-work.md), [dependency admission](../worker-admission.md), and [original review evidence](../review-original-evidence.md). These are implementation contracts, not a getting-started checklist or permission to reproduce old runs.
