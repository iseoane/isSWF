# #65 model/tool boundary acceptance

Authorized cut: one real Luna-high task after parent inspection, with standard model runtime/auth in trusted supervisor and every model tool operation inside a fixed Bubblewrap profile. Audit only; no runtime44 installation.

Before model execution verify:

- Active model tools exactly sandbox_shell, no built-in host tools or dynamic tool activation.
- Fixed resource loader/system prompt with only authorized factory profile and synthetic task. No host context, extension, MCP or template discovery.
- In-memory settings/session, exact model/effort, retries/fallback/autocompaction disabled. No credential values inspected or persisted; normal runtime auth refresh may occur outside sandbox.
- Tool API validates input, supplies no caller-controlled mounts, environment, host cwd or bwrap options, bounds time/output and closes child processes.
- Same bridge has working allowed writes and technically enforced hidden-canary/readonly-source/network denials with real host controls. Bridge tests and model-selected tool calls remain separate evidence categories.

After real model execution verify:

- Runtime selected model/effort and exact active tools; completion/usage metadata without thought text, raw conversation or secrets.
- Actual tool invocations routed through bridge; real fixture code change with original immutable check retained, red before and green after, independently replayed by parent.
- Host canary/source/test hashes intact, no auth/home mount. Tool-output limits and timeouts observed by controlled self-tests, not claimed as exhaustive resource isolation.
- Provider failure remains failed/blocked; no retry with a different model to hide test failure. No PASS if model never executed.

Security limits remain explicit. Supervisor/provider runtime is trusted host code and has network/auth authority; only tool subprocesses are sandboxed. Authorized synthetic fixture/tool output enters provider context. No complete output confidentiality, hostile-kernel protection, production/client readiness, MCP broker, lifecycle/recovery or multiwriter exclusion is demonstrated.
