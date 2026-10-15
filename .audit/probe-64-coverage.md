I'll read the three authorized documents first.

**Basis:** `next-operational-cut.md`, `pi-isolation.md`, `setup-62-closure.md`. Python probe excluded; activation/install/runtime unproven.

**Separation rule:** a denial counts only when the same actor, same profile, and the same real Pi RPC commands yield (a) an authorized write that succeeds and (b) an OS errno at the denied operation. Refusal text, empty result, absent tool, or missing canary never count.

| # | Case | Positive control (same actor) | Denial signal | False-PASS guard |
|---|---|---|---|---|
| 1 | Destination write | Worker writes disposable candidate | — | If it fails, rows 2–4 are uninterpretable (pi-isolation defect 1) |
| 2 | Out-of-scope file/secret | Owner reads canary pre-run | ENOENT | Existence baseline required |
| 3 | Symlink/absolute escape | Control follows it | ENOENT | Both absolute+relative links |
| 4 | FD/env inherit | FD read; token readable in control | EBADF; token bytewise absent | Token not passed in argv as expectation |
| 5 | Network/host auth | Control reaches fictional listener/abstract socket | ECONNREFUSED | Listeners proven alive; no host auth.json; empty HOME ≠ broker proof |
| 6 | Source readonly/context fixed | — | EROFS | Source hash pinned; no AGENTS/extension/context injection |
| 7 | Activation preservation | — | — | AGENTS.md/settings/model-config hashes identical pre/post; global config+credentials untouched |
| 8 | MCP/authority channel | Attempt real channel | Technical refusal | "No MCP configured" is absence, **not** MCP-denial proof |

**Instrument guards (Node):** per-case declared success plus allowed errors; RPC correlation by `type:response`+id; PID1/namespace selected from the current bwrap tree; per-run fixture dirs.

**Classification advice**
- **Bounded PASS admissible** only for rows 1–7, in this fixture, under this actor, with positive controls intact.
- **Partial / unsupported — label, block, never degrade silently:** LLM broker/credentials (separated net + empty HOME blocks them today), MCP authority (row 8), cgroup/seccomp resource limits (none existed), multi-writer exclusion (deferred by design), Pi-with-children combined runs, client-supplied mounts, kernel-hostile code.
- **No all-requirements claim** while broker, MCP, resources, and multi-writer remain unproven; setup-62's isolation prerequisite stays blocking for real-project activation.

**Next checkpoint:** the Node instrument's erratum for row 1 and row 8 is the deciding artifact — without a successful permitted write and a real authority-channel refusal, call the result partial and stop.
