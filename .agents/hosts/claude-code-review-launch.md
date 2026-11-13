# Claude Code bound reviewer launch

Read this from the [Claude Code host guide](claude-code.md#bound-identity-committed-diff-and-file-content-for-claude-reviewers) only when launching or checking a bound review. It is canonical for the Claude launch; the shared [bound review evidence](bound-review-evidence.md) reference holds the binding namespaces, content path and range rules, repository topology, verifier, operational boundary and [candidate-bound checks](bound-review-evidence.md#supply-candidate-bound-checks). Read both in full before launching.

## Bound identity, committed diff and file content for Claude reviewers

The plugin registers one local stdio server, `isswf_git_evidence`, that runs `tools/git-evidence-mcp.mjs`. It exposes `identity`, `diff` and `content` and calls the same public CLI, `tools/git-evidence.mjs`, with a fixed operation. Identity takes no arguments. Diff takes an optional `chunk` number. Content takes `slot` (`base` or `candidate`), an allowlisted `path` and an optional `offset` and `length` given together. Extra arguments are rejected.

The reviewer profile allows exactly `mcp__plugin_isswf_isswf_git_evidence__identity`, `mcp__plugin_isswf_isswf_git_evidence__diff` and `mcp__plugin_isswf_isswf_git_evidence__content` in addition to Read, Grep and Glob. Observed: Claude Code 2.1.299, Linux, 2026-11-13, by `tests/claude-reviewer-tools.mjs` loading the plugin with `--plugin-dir`. A marketplace-installed plugin is unverified.

The server reads the three namespaces once at start from the `ISSWF_GIT_EVIDENCE_BINDINGS` environment variable, a JSON object keyed by namespace. If the variable is missing, malformed or still the literal `${ISSWF_GIT_EVIDENCE_BINDINGS}`, every tool call fails closed. The plugin, the working directory, the repository and the model cannot supply or change a binding. Claude starts plugin servers with a minimal environment and passes this one variable through from the launching process.

The binding belongs to one Claude process, not to one subagent. An Agent-tool child inside the coordinator's session shares that session's server, which starts without a review binding, so it is not a bound review. Launch each bound review (`claude -p`) as its own process, set the variables only in that process's environment, and capture its stream-json standard output to a trace file outside tracked records:

```sh
ISSWF_GIT_EVIDENCE_BINDINGS='{"isswf.git-evidence/1":{...},"isswf.git-evidence.diff/1":{...},"isswf.git-evidence.content/1":{...}}' \
MAX_MCP_OUTPUT_TOKENS=100000 \
claude -p --agent isswf:isswf-reviewer --plugin-dir /absolute/factory-root \
  --model <approved-model> --effort <approved-effort> \
  --output-format stream-json --verbose \
  --allowedTools "mcp__plugin_isswf_isswf_git_evidence__identity mcp__plugin_isswf_isswf_git_evidence__diff mcp__plugin_isswf_isswf_git_evidence__content" \
  < review-task.md > tooling/.local/<job>/review-trace.jsonl
```

On Windows PowerShell, which has no inline environment prefix and rejects `<`, set the variables only for the one review and pipe the task on standard input:

```powershell
$env:ISSWF_GIT_EVIDENCE_BINDINGS = '{"isswf.git-evidence/1":{...},"isswf.git-evidence.diff/1":{...},"isswf.git-evidence.content/1":{...}}'
$env:MAX_MCP_OUTPUT_TOKENS = '100000'
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)  # Windows PowerShell 5.1 otherwise pipes ASCII
try {
  Get-Content -Raw -Encoding UTF8 review-task.md | claude -p --agent isswf:isswf-reviewer --plugin-dir C:\absolute\factory-root `
    --model <approved-model> --effort <approved-effort> --output-format stream-json --verbose `
    --allowedTools "mcp__plugin_isswf_isswf_git_evidence__identity mcp__plugin_isswf_isswf_git_evidence__diff mcp__plugin_isswf_isswf_git_evidence__content" |
    Out-File -Encoding utf8 tooling/.local/<job>/review-trace.jsonl  # documented, unverified: 5.1 writes a UTF-8 BOM
} finally {
  Remove-Item Env:ISSWF_GIT_EVIDENCE_BINDINGS, Env:MAX_MCP_OUTPUT_TOKENS -ErrorAction SilentlyContinue
}
```

`$env:` assignments last for the whole PowerShell session, not one command, so run the block in a dedicated `powershell -NoProfile` process, keep the `finally` removal and start no other Claude session from it while the variables are set.

Place `--output-format stream-json --verbose` before `--allowedTools`: that flag takes a variadic list and would consume later arguments as tool names. Without an approved effort for the reviewer, omit `--effort` only when the host's default effort is approved; otherwise block the launch.

### Record the run from the trace

The trace is the child-call evidence; write it to an ignored local path such as `tooling/.local/<job>/` (in another project, its ignored scratch location), never to tracked records, and delete it or keep it private once the `Run:` line and observed calls are recorded. Windows PowerShell 5.1 may garble non-ASCII text in it; the session ID and tool names are ASCII. From it, record:

- **Run line.** Take the session id from the first `system` event with subtype `init` (documented, unverified) and write `Run: claude session=<id>` in the review record, as the shared [`Run:` line](../../docs/durable-work.md#record-the-launch-identity) defines.
- **Tool calls.** For each `identity`, `diff` and `content` call, find its `tool_use` block and the matching non-error `tool_result` in the trace, then mark it observed from the trace. For `diff`, the `chunk` arguments show whether every chunk 1 to `chunkCount` was fetched. A call claimed in the report but absent from the trace is self-reported, not observed.
- **Result.** Take the reviewer's final report from the terminal `result` event. A missing or error terminal event leaves the review incomplete.

### Fill the binding

Fill each namespace as the shared reference describes. On Windows, `C:\Users\me\src\isswf` and `C:\Program Files\Git\mingw64\bin\git.exe` are canonical examples (in JSON each backslash is written `\\`). If the candidate lives in a linked worktree, bind the primary clone as the shared reference describes. `Get-Command` returns the first `git` on `PATH`, often the `cmd\git.exe` wrapper; confirm it is the Git executable you trust or pass that path instead:

```powershell
$repo = node -p "fs.realpathSync.native(process.argv[1])" (git -C C:\path\to\clone rev-parse --show-toplevel)
$git = node -p "fs.realpathSync.native(process.argv[1])" (Get-Command git -CommandType Application -TotalCount 1).Source
$id = [ordered]@{ version = 1; repository = $repo; baseSha = '<full-commit-sha>'; candidateSha = '<full-commit-sha>'; gitExecutable = $git; timeoutMs = 5000; outputBytes = 4096 }
$env:ISSWF_GIT_EVIDENCE_BINDINGS = [ordered]@{ 'isswf.git-evidence/1' = $id; 'isswf.git-evidence.diff/1' = <...>; 'isswf.git-evidence.content/1' = <...> } | ConvertTo-Json -Compress -Depth 5
```

`ConvertTo-Json` escapes the backslashes; keep an explicit `-Depth 5` so no nested value is ever cut off at the default depth of 2.

Do not export the variable in a shell that starts other Claude sessions: every session started from that shell would be bound to the same candidate. Setting it only for one command limits that exposure but it is still a coordinator-supplied input, not an operating-system boundary. Pass the review task (exact base/candidate and required checks) on standard input, as above: `--allowedTools` takes a variadic list, so a positional task after it is consumed as another tool name and the reviewer starts without a prompt. `--allowedTools` is for the non-interactive process to use those three tools without a prompt and is not a permission bypass.

### Output limits

- **MCP token limit.** Claude Code truncates MCP text beyond its token limit (default 25,000 tokens, `MAX_MCP_OUTPUT_TOKENS`) and appends an `[OUTPUT TRUNCATED` marker. The server cannot see that limit, so the no-partial-evidence guarantee requires `MAX_MCP_OUTPUT_TOKENS=100000` in the review process, as in the launch forms above. Evidence with that marker is incomplete: treat it as a failure.
- **Display bound.** The server refuses, instead of truncating, any result whose text exceeds 98,304 bytes. This usually limits content to about 40,000 raw bytes, so set the Claude content `outputBytes` to 32,768 or less: the binding accepts up to 65,536 bytes on both hosts, but on Claude a larger result fails closed at this bound.
- **Diff chunks.** A diff is returned in chunks of at most 24,576 bytes; every chunk states its number, the chunk count and the whole patch's byte count and SHA-256. Call `diff` once per chunk number. Treat the patch as complete only when chunks 1 to `chunkCount` concatenate to that digest.
- **Saved large results.** The host may instead save a large tool result to a file and show the reviewer only a short preview with its path (observed: Claude Code 2.1.312, OS not recorded, recorded 2026-10-31; other versions unverified). The preview is not the evidence: the reviewer must read the saved file in full, and any truncation marker or incomplete read is a failure; the chunk digest rule still decides completeness.

The server and the Pi invoker share the [verifier](bound-review-evidence.md#verify-the-returned-evidence). The loading fixture, `tests/claude-reviewer-tools.mjs`, shows only that the host lists these three tools in the reviewer's context without a model call. Evidence tools run with Claude's host permissions and give no OS containment, as in Pi.
