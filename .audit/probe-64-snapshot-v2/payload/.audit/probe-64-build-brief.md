# Task64 disposable probe — build brief

## Authorization and write boundary

This is the operator-authorized, disposable Task64 probe, not an installer or runtime change. The checkout is `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a4024e2e5f5799b57`, baseline `5c9a516fa967a9f7b6fcbaf774a315b59a6cff94`. This worker may write exactly `.audit/probe-64.mjs` and `.audit/probe-64-build-brief.md` in that checkout. It may generate probe output only below its own unique `os.tmpdir()` directory named `isswf-probe64-*`, print the exact root, and retain it. No other repository edits, commits, agents, Python execution, network access, installs, global configuration changes, or cleanup are authorized. Run this probe only after code inspection. The parent must independently replay and review the actual script before integration.

## Grounding and objective

- `docs/next-operational-cut.md`: explicit project activation of a fixed shared source is separate from worker execution; the instrument must compare only what it proves and preserve unproven requirements as blocked/unknown.
- `docs/research/pi-isolation.md`: Bubblewrap is the historically tested mechanism, but this local run must recheck current preflight and cannot claim production security, lifecycle, or general resource enforcement. The old Python instrument is read-only background and is not run.
- `.audit/verify-project-package.mjs`: reference pattern for a shared package source, project settings, and real Pi RPC `get_commands` with `--approve` versus `--no-approve`; no provider/model call is needed.
- `docs/research/pi-runtime.md`: Pi RPC `bash` belongs to the client/control protocol; model tool allowlists are not a sandbox. Keep the RPC client and its authority outside worker reach.
- Pinned factory source is the actual Git archive at `5c9a516fa967a9f7b6fcbaf774a315b59a6cff94`, limited to `.agents`, `.factory`, and `docs`. Pin the object and archive it; do not require `HEAD` to equal that pin. The disposable Pi installation references one fixed staged source mounted read-only. Its archive digest and extracted-plus-synthetic-package tree hashes are distinct evidence; staged-tree stability is not archive equality.

## Acceptance cases

The Node-only script creates and prints a unique retained temp root; records the real archive digest and staged tree hashes; preflights the installed Bubblewrap, namespaces, Node, and actual Pi 1.2.0 bundle; and uses a single disposable project with one assumed fixture writer. It prepares pre-existing project settings with a custom field and a local package source/skill, plus pre-existing `AGENTS.md` and model settings. It records the actual pre-activation fixture, explicitly appends the fixed shared source to the local project's Pi package list, then proves Pi catalog discovery with `--approve` and omission with `--no-approve`. The project settings change intentionally; do not claim bytewise settings preservation across activation. Prove `AGENTS.md`, model settings, custom fields, and the existing local package entry remain unchanged/preserved as applicable.

The same actual Pi RPC process under Bubblewrap runs offline, with `--no-mcp`, no extensions, fake-only secret, isolated HOME, and no host auth/home mounts. Exercise a positive `/work` write, then verify exact content by reading the file back from the host at the project path before marking it PROVEN. Exercise source mutation, outside canary access, absolute symlink escape, subprocess access, and a host-local TCP canary. Verify the host-side TCP control first by connecting, accepting, receiving its payload, and closing within bounds; only then report the worker-side connection denial. A fake TCP endpoint is not MCP/authority evidence.

Every child-close path must be bounded, account for already-exited children, send SIGKILL on timeout, and wait again with a final bound. The script returns nonzero for `BLOCKED_OR_FAILED`, preserving the result and failures. `ENOENT` means the host path is absent in the worker namespace, not permission denial on an existing path; the source write's `EROFS` is a read-only mount result. No root/FD probes are added; list untested boundaries as unsupported, not proved.

`systemd-run` may only receive a bounded, nonpersistent user-mode availability preflight; it is not a fallback sandbox or isolation proof. No real LLM, provider, credentials, network integration, or authority-broker integration is allowed. The probe uses `--no-mcp`; it must say that offline MCP/authority behavior is unsupported, not tested. Exclusive fixture ownership is a precondition, not locking or a multiwriter proof. No lifecycle/recovery, production-security, or complete kernel/resource-boundary claim is in scope.

## Deliverable and verification

Only the two authorized repository files are deliverables. `.audit/probe-64.mjs` is a rerunnable audit instrument, not factory runtime. Execute only that script after inspection. Retain any failed preflight/result; never convert a failure or unobserved case into a PASS. Report checkout/baseline, exact paths, printed temp result path, evidence-backed case outcomes, limits, and the required independent parent replay/review. Task44 remains paused; this grant is not an installer authorization.
