# Claude Code bound reviewer launch

Read this from the [Claude Code host guide](claude-code.md#bound-identity-committed-diff-and-file-content-for-claude-reviewers) only when launching or checking a bound review. It is canonical for the bound launch; the host guide keeps the rest of the Claude mechanics.

## Bound identity, committed diff and file content for Claude reviewers

The plugin registers one local stdio server, `isswf_git_evidence`, that runs `tools/git-evidence-mcp.mjs`. It exposes `identity`, `diff` and `content` and calls the same public CLI, `tools/git-evidence.mjs`, with a fixed operation. The reviewer profile allows exactly `mcp__plugin_isswf_isswf_git_evidence__identity`, `mcp__plugin_isswf_isswf_git_evidence__diff` and `mcp__plugin_isswf_isswf_git_evidence__content` in addition to Read, Grep and Glob. The names were observed on pinned Claude Code 2.1.299 loaded with `--plugin-dir`; a marketplace-installed plugin is unverified. Identity takes no arguments. Content takes only `slot` (`base` or `candidate`) and an allowlisted `path`. Diff takes an optional `chunk` number. Extra arguments are rejected.

The binding uses the same three JSON namespaces, limits and meaning as the [Pi launch binding](pi.md#bound-identity-committed-diff-and-file-content-for-pi-reviewers). The server reads them once at start from the `ISSWF_GIT_EVIDENCE_BINDINGS` environment variable, a JSON object keyed by those namespaces. If the variable is missing, malformed or still the literal `${ISSWF_GIT_EVIDENCE_BINDINGS}`, every tool call fails closed. The plugin, the working directory, the repository and the model cannot supply or change a binding. Claude starts plugin servers with a minimal environment and passes this one variable through from the launching process.

The binding belongs to one Claude process, not to one subagent. An Agent-tool dispatch inside the coordinator's session shares that session's server, which starts without a review binding, so it is not a bound review. Launch each review as its own process and set the variables only in that process's environment:

```sh
ISSWF_GIT_EVIDENCE_BINDINGS='{"isswf.git-evidence/1":{...},"isswf.git-evidence.diff/1":{...},"isswf.git-evidence.content/1":{...}}' \
MAX_MCP_OUTPUT_TOKENS=100000 \
claude -p --agent isswf:isswf-reviewer --plugin-dir /absolute/factory-root \
  --model <approved-model> --effort <approved-effort> \
  --allowedTools "mcp__plugin_isswf_isswf_git_evidence__identity mcp__plugin_isswf_isswf_git_evidence__diff mcp__plugin_isswf_isswf_git_evidence__content" \
  < review-task.md
```

On Windows PowerShell, which has no inline environment prefix and rejects `<`, set the variables only for the one review and pipe the task on standard input:

```powershell
$env:ISSWF_GIT_EVIDENCE_BINDINGS = '{"isswf.git-evidence/1":{...},"isswf.git-evidence.diff/1":{...},"isswf.git-evidence.content/1":{...}}'
$env:MAX_MCP_OUTPUT_TOKENS = '100000'
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)  # Windows PowerShell 5.1 otherwise pipes ASCII
try {
  Get-Content -Raw -Encoding UTF8 review-task.md | claude -p --agent isswf:isswf-reviewer --plugin-dir C:\absolute\factory-root `
    --model <approved-model> --effort <approved-effort> `
    --allowedTools "mcp__plugin_isswf_isswf_git_evidence__identity mcp__plugin_isswf_isswf_git_evidence__diff mcp__plugin_isswf_isswf_git_evidence__content"
} finally {
  Remove-Item Env:ISSWF_GIT_EVIDENCE_BINDINGS, Env:MAX_MCP_OUTPUT_TOKENS -ErrorAction SilentlyContinue
}
```

`$env:` assignments last for the whole PowerShell session, not one command, so run the block in a dedicated `powershell -NoProfile` process, keep the `finally` removal and start no other Claude session from it while the variables are set.

Fill each namespace as in the Pi guide: full commit IDs, canonical repository, trusted Git executable, `timeoutMs`, `outputBytes` and, for content, `paths`. `repository` and `gitExecutable` must equal their own `realpath` exactly, or every tool refuses (`repository-binding-not-canonical`, `git-executable-not-canonical-regular-file`). On Windows this means an absolute path with the drive letter and every component in their on-disk case and backslash separators, with no forward slashes, `~`, 8.3 short names, junctions or symbolic links, for example `C:\Users\me\src\isswf` and `C:\Program Files\Git\mingw64\bin\git.exe` (in JSON each backslash is written `\\`). `repository` must also be an ordinary clone whose `.git` is a directory: a linked worktree (a `.git` file) is refused as `unsupported-gitdir-topology`. Derive both values with Node's realpath instead of typing them. `Get-Command` returns the first `git` on `PATH`, often the `cmd\git.exe` wrapper; confirm it is the Git executable you trust or pass that path instead:

```powershell
$repo = node -p "fs.realpathSync.native(process.argv[1])" (git -C C:\path\to\clone rev-parse --show-toplevel)
$git = node -p "fs.realpathSync.native(process.argv[1])" (Get-Command git -CommandType Application -TotalCount 1).Source
$id = [ordered]@{ version = 1; repository = $repo; baseSha = '<full-commit-sha>'; candidateSha = '<full-commit-sha>'; gitExecutable = $git; timeoutMs = 5000; outputBytes = 4096 }
$env:ISSWF_GIT_EVIDENCE_BINDINGS = [ordered]@{ 'isswf.git-evidence/1' = $id; 'isswf.git-evidence.diff/1' = <...>; 'isswf.git-evidence.content/1' = <...> } | ConvertTo-Json -Compress -Depth 5
```

`ConvertTo-Json` escapes the backslashes; keep an explicit `-Depth 5` so no nested value is ever cut off at the default depth of 2.

Do not export the variable in a shell that starts other Claude sessions: every session started from that shell would be bound to the same candidate. Setting it only for one command limits that exposure but it is still a coordinator-supplied input, not an operating-system boundary. Pass the review task (exact base/candidate and required checks) on standard input, as above: `--allowedTools` takes a variadic list, so a positional task after it is consumed as another tool name and the reviewer starts without a prompt. `--allowedTools` is for the non-interactive process to use those three tools without a prompt and is not a permission bypass.

Claude Code truncates MCP text beyond its token limit (default 25,000 tokens, `MAX_MCP_OUTPUT_TOKENS`) and appends an `[OUTPUT TRUNCATED` marker. The server cannot see that limit, so the no-partial-evidence guarantee requires the coordinator's `MAX_MCP_OUTPUT_TOKENS=100000` in the review process, as in the launch command above. Evidence with that marker is incomplete: treat it as a failure. The server refuses, instead of truncating, any result whose text exceeds 98,304 bytes. This usually limits content to about 40,000 raw bytes; choose a content `outputBytes` of 32,768 or less. A diff is returned in chunks of at most 24,576 bytes; every chunk states its number, the chunk count and the whole patch's byte count and SHA-256. Treat the patch as complete only when chunks 1 to `chunkCount` concatenate to that digest. Call `diff` once per chunk number. On Claude Code 2.1.312 the host may instead save a large tool result to a file and show the reviewer only a short preview with its path. The preview is not the evidence: the reviewer must read the saved file in full, and any truncation marker or incomplete read is a failure (the chunk digest rule above still decides completeness). This was observed on 2.1.312 only; other versions are unverified.

The server and the Pi invoker share one verifier. It checks provenance before returning anything (repository, base and candidate commits and binding digest for every operation; plus the Git executable for identity, the commit and path for content), canonical base64, byte count and SHA-256 for diff and content, and a refusal may omit provenance fields but must not contradict the binding. It exposes an exact UTF-8 view only when the bytes decode. A coordinator-supplied result or a synthetic fixture does not prove that the reviewer invoked a tool. The loading fixture, `tests/claude-reviewer-tools.mjs`, shows only that the host lists these three tools in the reviewer's context without a model call. Evidence tools run with Claude's host permissions and give no OS containment, as in Pi.
