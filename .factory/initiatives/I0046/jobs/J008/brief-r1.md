# Job brief J008 / r1

## Identity and authorization

- Job: I0046 J008, brief r1, Size M. Actor ID: A001 (do not reuse). Role: isswf-worker.
- Operator start: "Adelante con j008 pero revisaré todo el mod antes de darlo por cerrado" (Claude Code session, 2026-11-12). The operator reviews the mod live before acceptance. Coordinator owns commits and the chained PR (base feat/i0046-j007-usd, never main).
- Workspace: worktree /home/iseoane/Work/isSWF-j008 (branch feat/i0046-j008-plugin-pane). Write only there plus `/home/iseoane/Work/isSWF/.factory/initiatives/I0046/jobs/J008/A001.md`. The prototype `/home/iseoane/Work/isswf-pane/` is read-only source. No commits, pushes, network or installs.

## Objective and acceptance

Plan I0046 J008 is canonical. Move the prototype pane into the isswf Claude plugin so it reads records through the packaged Node-free cores instead of the prototype reader:
- Add the hooks module to the plugin (`.claude-plugin/plugin.json` hooks / `hooks/hooks.json`, `types/index.d.ts` state contract), keeping the prototype's behaviour as accepted by the operator: activation on the isswf-coordinator skill, active/pinned initiatives, cards, rounds and pills, "No activas", `✓ N completados`, title with double rule, theme color keys, `/initiatives [pin|unpin <ID>]`, debounced refresh plus 60 s fallback, bilingual verdicts.
- Use `tools/isswf-snapshot-core.mjs` and `tools/isswf-run-usage-core.mjs` (relative import from the plugin root) through `$.fs`; hover details show model, effort, tokens, duration, USD cost (partial marked) and skill/`.agents` counts when usage resolves, `unknown` otherwise. Keep the usage cache in module memory; never block drawing on transcripts beyond the snapshot read.
- Opt-in: a `userConfig` boolean (default off). Off means no hooks do reads, timers, commands or UI.
- Windows: paths through the cores' string joining; no POSIX-only assumptions.
- Plugin tests (`*.test.tsx`, `claude plugin test`) for opt-in off/on, activation, active detection, grouping and a hover with usage; `claude plugin validate` passes. Reference: /tmp/claude-1000/bundled-skills/2.1.322/41799fd4829743f1a96bd5110803bc7c/plugin-authoring/reference.md and its types; the prototype's own tests.
- Packaging: the plugin's new files must be included by the package allowlist (`package.json` files / factory-package) at the plugin version; update their pinning tests.
- Docs: en/es user guide paragraph on enabling and using the pane (pick the existing guide that covers the Claude plugin).

## Checks and return

Only what the change affects: claude plugin validate/test on the worktree, the focused tests touched, check-docs, eslint, knip, git diff --check. Do not run the full check-quality (coordinator does it once). Add tests only for the behaviours listed; no mutation experiments. Stop and report if beyond ~500 lines excluding tests. Return changed paths, check outputs, limits.
