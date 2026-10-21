# Host portability: Pi and Claude Code

Pi is the existing supported execution host. Project activation, package resource allowlisting, model routing and the native SDK worker entry remain as implemented by `tools/factory-package.mjs`, `docs/model-routing.md` and `tools/isswf-job.mjs`. Use the existing Pi process; this plugin does not alter or replace it.

Claude Code has a bounded live validation on version 2.1.299. In the [A003 fixture](../.factory/initiatives/I0004/jobs/J002/A003.md), the coordinator delegated to a worker that changed one permitted file and passed its test, then to a distinct read-only reviewer that reported Standards PASS and Spec PASS. This does not establish Pi-equivalent sandboxing, persistence or recovery.

On a trusted, fixed checkout, load the local plugin for one session without global installation:

```sh
claude --plugin-dir /absolute/path/to/trusted/isswf-checkout
```

Do not point this command at an untrusted checkout. Invoke the namespaced coordinator skill as `/isswf:isswf-coordinator`; its plugin entry reads the shared coordinator skill and Claude host guide. The native role definitions likewise read shared `.agents/roles` profiles. No roles are copied as independently maintained methodology.

Claude native delegation is not equivalent to the Pi SDK's sandbox, durable persistence or recovery. Agent tool declarations do not enforce factory grants; Bash can mutate and is not a sandbox guarantee. No silent Pi fallback or model substitution exists. Pi model routes do not configure Claude. Require explicit assignment approval for Claude and its inherited/selected model, and record observed model metadata before work. If that host/model capability is not approved or available, block dispatch.

## Reproduce the bounded live validation

1. On an authorized, logged-in Claude Code environment, record `claude --version` and actual selected model metadata. Do not infer model identity from `inherit`.
2. From the trusted checkout, run `claude --plugin-dir <absolute-checkout>`; verify plugin loads and `/isswf:isswf-coordinator` is discoverable and reads shared source files.
3. With explicit operator approval and a small isolated candidate, ask the coordinator to delegate one implementation task to the worker agent. Record assignment/model approval and retained candidate identity; confirm no Pi SDK fallback.
4. After the writer returns and stops writing, retain its exact candidate (diff plus untracked file contents or immutable snapshot identity), and invoke an independent reviewer on precisely that candidate and base. Record model metadata, verdict and standards/spec findings separately.
5. Verify reviewer has only read-only tools, report any capability gaps, and do not treat plugin loading or model output as proof of sandboxing, durable recovery, factory authorization or product acceptance.

A001 and A002 stopped on insufficient harness permissions; A003 passed after explicit project-specific command permissions were supplied. Those attempts remain separate records, not overwritten results. The successful fixture used the existing logged-in account and inherited model. Individual subagent model identities and effort were not independently established, and the full snapshot digest was retained by the parent after review. Repeat the checklist for the actual assigned project and account; this fixture is not general client-use approval.
