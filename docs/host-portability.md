# Host support: Pi and Claude Code

Pi is the reference execution host. `package.json` declares its setup and coordinator skills. The complete prepared package includes the runtime selected through `tools/isswf.mjs`; source-checkout activation is a separate compatibility path. Neither installation nor skill discovery authorises dispatch.

## Shared instructions and entry points

Both integrations read the shared `.agents/skills/` and `.agents/roles/` resources. Claude's `skills/`, `agents/`, and `.claude-plugin/` files are thin wrappers, not an independently maintained methodology.

On an explicitly authorised, trusted checkout, Claude's documented session-only loading command is:

```sh
claude --plugin-dir /absolute/path/to/trusted/isswf-checkout
```

The coordinator entry is `/isswf:isswf-coordinator`. Complete-package installation is described in [installation](installation.md). Documenting a command does not mean it has been run or that a release is publicly available.

## Host boundaries

Claude native delegation does not establish Pi-equivalent sandboxing, durable persistence, or recovery. Bash permissions are not a sandbox. Factory grant fields and tool declarations do not authenticate actors or enforce every host action.

Pi model routes do not configure Claude. Dispatch requires approval for the actual host and inherited or selected model, plus observed model metadata. An unavailable or unauthorised host blocks dispatch; it does not permit silent fallback to Pi or another model.

The caller must retain the exact candidate, establish that the writer stopped, and select the required independent review. Plugin loading or a successful model response proves none of these conditions and does not accept or publish the result.

## Verify the integration

`node tests/host-portability.mjs .` checks manifests, shared-wrapper references and documented boundaries without invoking Claude. It is a static contract check, not proof of live delegation, model identity, sandboxing, recovery or client readiness.

Any live host test needs its own current authorisation, isolated scope, observed model identity and retained candidate. Earlier demonstrations and consumed grants do not replace those requirements. Historical reports are archived separately and are not part of the current usage procedure.
