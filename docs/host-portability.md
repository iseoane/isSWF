# Host portability: Pi and Claude Code

Pi is the existing supported execution host. Project activation, package resource allowlisting, model routing and the native SDK worker entry remain as implemented by `tools/factory-package.mjs`, `docs/model-routing.md` and `tools/isswf-job.mjs`. Use the existing Pi process; this plugin does not alter or replace it.

Claude Code support is static integration only, not live-model verified. On a trusted, fixed checkout, load the local plugin for one session without global installation:

```sh
claude --plugin-dir /absolute/path/to/trusted/isswf-checkout
```

Do not point this command at an untrusted checkout. Invoke the namespaced coordinator skill as `/isswf:isswf-coordinator`; its plugin entry reads the shared coordinator skill and Claude host guide. The native role definitions likewise read shared `.agents/roles` profiles. No roles are copied as independently maintained methodology.

Claude native delegation is not equivalent to the Pi SDK's sandbox, durable persistence or recovery. Agent tool declarations do not enforce factory grants; Bash can mutate and is not a sandbox guarantee. No silent Pi fallback or model substitution exists. Pi model routes do not configure Claude. Require explicit assignment approval for Claude and its inherited/selected model, and record observed model metadata before work. If that host/model capability is not approved or available, block dispatch.

## Reproducible live validation checklist (pending)

1. On an authorized, logged-in Claude Code environment, record `claude --version` and actual selected model metadata. Do not infer model identity from `inherit`.
2. From the trusted checkout, run `claude --plugin-dir <absolute-checkout>`; verify plugin loads and `/isswf:isswf-coordinator` is discoverable and reads shared source files.
3. With explicit operator approval and a small isolated candidate, ask the coordinator to delegate one implementation task to the worker agent. Record assignment/model approval and retained candidate identity; confirm no Pi SDK fallback.
4. Stop the writer before completion, retain its exact candidate (diff plus untracked file contents or immutable snapshot identity), and invoke an independent reviewer on precisely that candidate and base. Record model metadata, verdict and standards/spec findings separately.
5. Verify reviewer has only read-only tools, report any capability gaps, and do not treat plugin loading or model output as proof of sandboxing, durable recovery, factory authorization or product acceptance.

This environment's Claude executable version is reported as 2.1.299 but is not logged in. No Claude login/model invocation was performed here; all live checks above remain pending.
