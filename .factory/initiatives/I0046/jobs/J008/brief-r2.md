# Job brief J008 / r2

- Same job, scope and authorization as [brief-r1.md](brief-r1.md). Actor ID: A002 (do not reuse). A001 was stopped by accident by the operator mid-work; its uncommitted changes in /home/iseoane/Work/isSWF-j008 are your starting point: inspect them, keep what is correct, finish the rest. Do not discard them.
- Operator additions (2026-11-12), part of this job:
  1. Title `isSWF v<version> · <repo folder>`, version from the isswf plugin's own `.claude-plugin/plugin.json` read through `$.fs`; `unknown` if unreadable; keep the full-width double rule.
  2. An initiative with no started work is never an active card merely because its records were touched; it stays in "No activas" unless pinned. Touched initiatives with started work stay active.
  3. Under `✓ N completados`, the 2 most recently completed jobs (state the order used, e.g. plan order) appear collapsed, one line each; click expands to rounds and pills with hover details, click again collapses; expansion kept in `$.state`.
  4. Slash command renamed `/isswf-initiatives` (pin/unpin usage, tests, docs). Confirm per file that every new plugin file ships in the package allowlist at the plugin version.
- Tests only for the brief r1 behaviours and these four. Same checks and return as r1. Write the attempt record `/home/iseoane/Work/isSWF/.factory/initiatives/I0046/jobs/J008/A002.md`.
