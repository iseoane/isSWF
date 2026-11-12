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
node tools/isswf-snapshot.mjs --project /absolute/project
node tools/isswf-panel.mjs --project /absolute/project --port 0
```

The first command reads an initiative's plan and supporting records. The second prints a JSON snapshot of every open initiative; see [initiative snapshot](#initiative-snapshot). The third starts a foreground server on `127.0.0.1` and prints its URL. Stop it with Ctrl-C. It lists initiatives and lets you inspect their jobs, evidence, and recorded decisions.

The panel can record local notes when the displayed evidence still matches. A note is not automatically applied, authenticated operator acceptance, or permission to dispatch work. Do not expose the panel publicly or put secrets in its records.

## Initiative snapshot

`tools/isswf-snapshot.mjs` reads every initiative under the active state directory selected by `tools/project-state.mjs` and prints one JSON object with `schemaVersion: 1`, `project`, `stateDir`, `initiatives`, `unopened` and `skipped`. It is read-only and calls no model or network. Importers call `readSnapshot(project, fs)`; `fs` defaults to Node and may be any object with async `exists`, `list`, `stat` and `read`, which then governs record reads.

- Initiatives whose jobs are all `completed` are omitted. Those whose jobs are all `pending` without records appear in `unopened` with `id` and `title` only.
- Each other initiative has `id`, `title`, `type`, `status` (`parsed` or `unparsed`) and `jobs`. A plan rejected by the plan parser is `unparsed` with no jobs.
- Each job has `id`, `status`, `objective`, `dependsOn`, `issues` and `prs` (numbers cited in its next step, evidence or `delivery.md`), `recordCount` and `rounds`. Rounds follow `brief-r<n>.md` files; records go to the brief they cite, otherwise the latest round, otherwise round `unknown`.
- Each `A<nnn>`/`V<nnn>` record entry has `id`, `kind` (`attempt` or `review`), `role`, `model`, `modelSource` (`actual`, `requested`, `approved` or `stated`), `effort`, `verdict` (`passed`, `changes-requested` or `running`), `round` and `roundSource` (`stated` or `latest`). Values not stated explicitly in the record are `unknown`.
- Files over 1 MB or unreadable are listed in `skipped`; one bad record never aborts the snapshot. Both or no state directory, or a missing `initiatives` directory, is an error.

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

`tools/token-report.mjs` reports only bounded summaries you explicitly supply, including an automatically captured native Claude receipt after you convert it. It does not inspect host sessions, call a model, or estimate billing. Manually transcribed Pi and Claude summaries are labelled in the input. Keep input files sanitized and local.

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

`tools/token-native-pi.mjs` can be loaded as an explicitly enabled project extension. During authorized setup, resolve the trusted factory root separately from the target project and add its absolute `<trusted-factory-root>/tools/token-native-pi.mjs` path to the target project's `.pi/settings.json` `extensions` list; Pi resolves configured paths independently of the project root. Create `<selected-state>/native-usage.json` with an explicit enabled choice and `destination: "native-usage"` inside the existing `.isswf` or `.factory` state root. A new session or `/reload` is required; this does not hot-load the current extension instance. With capture disabled or its opt-in file absent/invalid, the extension makes no cost RPC requests and writes no capture data. When enabled, it takes a baseline at session start and replacement snapshots at Pi `agent_settled` and `subagent:async-complete` boundaries; it does not poll or ask a model to start a capture. The local `native-usage/<opaque-session-id>.json` file retains a baseline, latest snapshot and bounded event snapshots (up to 100 records/1 MiB); automatic failures show a generic Pi status and do not change product work. A per-session exclusive transaction claim serializes cooperating extension instances; a competing claim fails closed, and a claim left by abrupt termination is never automatically removed or recovered. Initial file creation is no-clobber. These are ordinary-writer safeguards, not OS isolation or power-loss guarantees. Counters are host-normalized, not provider-certified; unresolved child coverage is retained. The stored snapshot is not itself an accepted-outcome report: pass the capture file directly to `tools/token-native-summary.mjs --capture <capture-file>` with the actual window metadata, then pass the resulting window to `tools/token-report.mjs`. This source has mock lifecycle tests; Linux native automatic-workflow and Windows native tests are not claimed here.

### Read Claude Code session usage from local transcripts

This is the primary way to get Claude usage without extra tokens. `tools/token-native-claude-transcript.mjs` reads the local transcripts that Claude Code already writes for ordinary `claude` launches, so no helper, telemetry or daemon is needed. It reads only the selected project's directory under `--claude-dir`, `CLAUDE_CONFIG_DIR` or `~/.claude` and never writes there. It emits a `token-report.mjs` window with one `unattributed` row for the parent session and one `agent` row per subagent, plus a counts-only coverage record on stderr.

```bash
node tools/token-native-claude-transcript.mjs --project "/absolute/project" > "claude-session.json"
node tools/token-report.mjs --input "claude-session.json"
```

Use `--session <uuid>` for a session other than the most recent. Only numeric counters and bounded identifiers (model, effort, version, hashed session and agent IDs, safe agent type) are kept; message text, tool data and paths are never copied. Each request is counted once by `requestId`: a repeat with identical counters, in the same file or a later one, is counted once (later-file repeats appear as `crossFileDuplicates`), while a repeat with different counters makes that file invalid. Malformed lines, missing usage and size limits (64 MiB per file, 256 MiB total, 4 MiB per line in bytes, 200,000 entries) also make that file invalid. More than 99 subagent files, a missing parent transcript for `--session`, or no transcript for the project stop the run with a fixed error and no window. An invalid file becomes a row with unknown counters, so the report shows a `partial-subtotal` instead of a silent zero. A trailing incomplete line is tolerated and counted in coverage. The format is undocumented and was observed on Claude Code 2.1.312 on Linux; Windows path handling is covered by fixtures only. When a file fails a format check or the recorded version is not recognised, coverage recommends opening an issue at https://github.com/iseoane/isSWF/issues, through the isswf-issue workflow where available, with the Claude Code version (also recorded from invalid files when present) and failing check names only. Missing, unreadable or oversized files are reported without that recommendation. Totals are host-recorded counters, not billing. The OpenTelemetry capture below remains an optional secondary path.

### Capture Claude Code metrics during a session

Claude capture is opt-in and requires the setup-owned `<selected-state>/claude-native-usage.json` with `version: 1`, `enabled: true`, and a project-local `destination`. Setup instructions are in `isswf-setup`. Launch the installed CLI through the trusted helper to capture that process:

```bash
node /absolute/trusted-factory-root/tools/token-native-claude.mjs -- --model sonnet
```

The helper preserves interactive input/output, permissions, tools, model and auth arguments. It enables only process-local OTLP HTTP/JSON metrics, with logs/traces disabled, and stores bounded allowlisted numeric data on process exit. Sessions started as plain `claude` outside this helper are not captured. Conflicting OTEL/Claude telemetry environment settings fail closed; do not override managed policy. Policy compatibility is not inspected before launch: managed or server-managed settings can redirect exports. After the run the receipt records `exportStatus`: `export-observed` when the loopback receiver accepted at least one validated, authenticated export carrying native Claude token series, or `no-export-observed` when none arrived (cause unknown, for example an endpoint override or a missing final export; never zero usage). An observed export proves local delivery for that run only, not policy compliance or that no other destination received telemetry. The default export interval is the native 60 seconds; setup may set `exportIntervalMs` between 1000 and 60000. Requests with the wrong route or credentials are ignored and counted in `ignoredRequests`. A malformed, oversized (`request-too-large`), over-concurrent (`concurrency-limit`) or conflicting export invalidates the capture, reports its rejection code and retains no receipt. A receiver or child failure is reported separately from the Claude exit. The receipt does not contain prompts or tool output and does not establish per-agent identities. Unknown or absent query categories remain unknown; each native series (resource, instrumentation scope and every point attribute) keeps its own start and end; repeated cumulative exports replace the prior point for that series, an identical repeat is ignored, and a conflict, regression or changed start invalidates the capture.

Convert the retained receipt to an observed-series snapshot with explicit task metadata, then report it or compare it with an earlier snapshot:

```bash
node tools/token-native-summary.mjs --otel "claude-receipt.json" --effort unknown --task-class implementation --candidate current > "claude-snapshot.json"
node tools/token-report.mjs --input "claude-snapshot.json"
node tools/token-report.mjs --before "baseline-snapshot.json" --after "claude-snapshot.json"
```

The snapshot (`mode: "observed-snapshot"`) lists each observed series and per source/model/category values; `main`, `subagent`, and `auxiliary` are query-source categories, not individual agent IDs. Its `observedSubtotal` sums only observed values; `total` stays `null` with `totalStatus: "unknown-coverage"`, because this is not a process, session or workflow total, and no accepted-outcome ratio is computed. Comparison requires matching host, version, effort, task class and observed exports in both snapshots; it matches source/model/category values, lists unmatched ones explicitly, and is labelled `exploratory-coverage-limited`. Native capture and series IDs are provenance, not equality requirements. Plain Claude launch and actual Windows collection are not covered by this helper's capture. Never infer a zero for a missing counter.

## Understand the result

`awaiting-human` means a specific decision is needed, whether during definition, setup, acceptance or PR integration. The record should name the question and what answer allows work to resume; a definition question does not need a delivery first. `blocked` describes a technical condition needing resolution, not automatically a request for your approval. Notes in the panel do not apply either decision; the coordinator reconciles your actual instruction.

A plan status describes recorded work, not a heartbeat or a fresh GitHub query. Missing or inconsistent evidence remains unknown. A completed worker does not prove independent review, operator acceptance, publication, or merge.

Before retrying interrupted work, inspect the actual process identity and partial files. Do not free claims, change stores, or invent a new job ID to bypass an unresolved writer. Execution callers require their own exact inputs, model and budget checks, and current permission. The status command and this guide grant none of them.

For installation and recovery, read [installation](installation.md). The coordinator's detailed English execution resources remain [worker lifecycle](../local-worker-lifecycle.md), [model routing](../model-routing.md), [durable records](../durable-work.md), [dependency admission](../worker-admission.md), and [original review evidence](../review-original-evidence.md). These are implementation contracts, not a getting-started checklist or permission to reproduce old runs.
