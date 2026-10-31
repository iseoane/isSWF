# J023: Claude reviewer route, then status

## Current assignment and base

Content slice integrated: PR116 merge `a88f4710194706748a3533ca1a761087ef0d9316` on `main` (head `2cd0e48` exact-head CI PASS incl. native Windows git-content, Pi invoker, host-native-delegation). Operator approved continuing remaining J023 work (brief-r17); feature-to-PR scope applies (commit, branch push, PR, exact-head CI). Integration is a separate operator approval. Pi actual-use remains a deferred J023 closure condition.

Remaining plan acceptance: identity, diff, content **and status** through validated operations; a native reviewer actually invokes the CLI on the exact bound candidate; Linux/Windows and Pi/Claude assessed.

## Units, in order

1. **Claude reviewer route (this brief).** A Claude `isswf-reviewer` launched by the coordinator can call bound identity, diff and content tools and nothing beyond Read/Grep/Glob. Unlocks actual reviewer use on a host with quota and gives the CLI a second native consumer before status adds surface.
2. **Status (next brief).** Working-tree/index status per brief-r2 slice 4, exposed through Pi and Claude in one unit.

## Unit 1 scope and acceptance

- Grounding (brief-r4): plugin manifest `mcpServers` supports local stdio with `node` and `${CLAUDE_PLUGIN_ROOT}`; plugin-agent frontmatter `mcpServers` is ignored; tools are `mcp__<server>__<tool>`; pinned Claude 2.1.299 probe exposed exactly `mcp__isswf_git_evidence__identity` in reviewer context via strict task-specific stdio config. Host-control `mcp_call` bypasses reviewer filtering; never acceptance evidence.
- Binding supplied per invocation by the coordinator outside model control, captured once at server start; missing/invalid binding fails closed. Plugin, cwd, repository or ambient env grant no authority.
- Thin stdio MCP server, no new runtime dependencies, spawns the existing public CLI with fixed operation and binding like the Pi invoker; no duplicated Git policy. Extract the Pi invoker's verification (provenance, base64, length, SHA-256, UTF-8 view, envelope) into a shared module instead of copying.
- Tools identity, diff, content with Pi-equivalent schemas; extra arguments rejected.
- `agents/isswf-reviewer.md` allows only the exact MCP tool names plus Read/Grep/Glob; no Bash, hooks or permission bypass.
- Coordinator launch recipe in `.agents/hosts/claude-code.md` and EN/ES guides as applicable.

Acceptance:
- Synthetic stdio MCP journey (initialize, exact tools/list, ok/refusal/missing binding/extra args/tampered CLI output, no-write, stalled stdin), in the native Windows/Linux CI matrix.
- Pinned Claude loading fixture: reviewer context lists exactly the three tools (no model call).
- Actual use: one fresh Claude `isswf-reviewer` (`opus`/`medium`) with a coordinator binding for this unit's own candidate invokes identity, diff and content and uses the output in its review; provenance retained.

## Methods and allocation

- TDD: behavioral RED per new contract before production code, retained. E2E: real stdio server process; native Claude loading fixture.
- Author: one Claude `isswf-worker` `sonnet`/`medium`, branch `feat/j023-claude-route` from `a88f471`, explicit-file commits, no push.
- Review: up to two `isswf-reviewer` `opus`/`medium` rounds; the actual-use reviewer may be one of them.
- Coordinator owns push, PR, CI.

## Reading map (base a88f471)

`tools/git-evidence.mjs`, `tools/git-evidence-pi-extension.mjs`, `tests/git-evidence-pi.mjs`, `tests/git-content.mjs`, `tests/host-native-delegation.mjs`, `agents/isswf-reviewer.md`, `.claude-plugin/`, `.agents/hosts/claude-code.md`, `.agents/hosts/pi.md`, `package.json`, `.github/workflows/quality.yml`, brief-r4, private `tooling/.local/j023-native-loading/receipt.json`.

Author resources: worker.md, claude-code.md, design-principles.md, verification-principles.md, code-quality.md, comments.md, isswf-tdd and isswf-e2e with required references, isswf-writing.
