# Task64 disposable probe — build brief

## Authorization and write boundary

This is the operator-authorized, disposable Task64 probe, not an installer or runtime change. The checkout is `/home/iseoane/Work/isSWF/.claude/worktrees/agent-a4024e2e5f5799b57`, baseline `5c9a516fa967a9f7b6fcbaf774a315b59a6cff94`. This worker may write exactly `.audit/probe-64.mjs` and `.audit/probe-64-build-brief.md` in that checkout. It may generate probe output only below its own unique `os.tmpdir()` directory named `isswf-probe64-*`, print the exact root, and retain it. No other repository edits, commits, agents, Python execution, network access, installs, global configuration changes, or cleanup are authorized. Run this probe only after code inspection. The parent must independently replay and review the actual script before integration.

## Grounding and objective

- `docs/next-operational-cut.md`: explicit project activation of a fixed shared source is separate from worker execution; the instrument must compare only what it proves and preserve unproven requirements as blocked/unknown.
- `docs/research/pi-isolation.md`: Bubblewrap is the historically tested mechanism, but this local run must recheck current preflight and cannot claim production security, lifecycle, or general resource enforcement. The old Python instrument is read-only background and is not run.
- `.audit/verify-project-package.mjs`: reference pattern for a shared package source, isolated project settings, and real Pi RPC `get_commands` with `--approve` versus `--no-approve`; no provider/model call is needed.
- `docs/research/pi-runtime.md`: Pi RPC `bash` belongs to the client/control protocol; model tool allowlists are not a sandbox. Keep the RPC client and its authority outside worker reach.
- Pinned factory source is the actual Git archive at `5c9a516fa967a9f7b6fcbaf774a315b59a6cff94`, limited to `.agents`, `.factory`, and `docs`. The disposable Pi installation references one fixed staged source mounted read-only; it does not recopy the factory per project.

## Acceptance cases

The Node-only script must create and print a unique retained temp root; capture the real archive digest and staged tree hashes; preflight the installed Bubblewrap, namespaces, Node, and actual Pi 1.2.0 bundle; use a single disposable project and one assumed fixture writer; preserve hashes of pre-existing fixture `AGENTS.md`, Pi settings, and model markers; start the actual Pi RPC process under Bubblewrap with offline mode, `--no-mcp`, no extensions, a fake-only secret, isolated HOME, and no host auth/home mounts; check the real RPC command catalog for `isswf-setup` present only with explicit approval; and exercise a positive `/work` write plus expected technical denials for source mutation, host canary read/write, absolute symlink escape, subprocess access, and a live host-local network canary. Record expected/actual evidence and case statuses. Check that canaries are actually present/live before relying on denials. Keep the source and target identities distinct.

`systemd-run` may only receive a bounded, nonpersistent user-mode availability preflight; it is not a fallback sandbox or isolation proof. No real LLM, provider, credentials, network integration, or authority-broker integration is allowed. The probe uses `--no-mcp`; it must say that offline MCP/authority behavior is unsupported, not claim it was tested. An exclusive fixture owner is a precondition, not locking or a multiwriter proof. No lifecycle/recovery, production-security, or complete kernel/resource-boundary claim is in scope.

## Deliverable and verification

Only the two authorized repository files are deliverables. `.audit/probe-64.mjs` is a rerunnable audit instrument, not factory runtime. Execute only that script after inspection. Retain any failed preflight/result; never convert a failure or unobserved case into a PASS. Report checkout/baseline, exact paths, printed temp result path, evidence-backed case outcomes, limits, and the required independent parent replay/review. Task44 remains paused; this grant is not an installer authorization.
