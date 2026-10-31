# J023: Committed content — Claude-host continuation

## Current assignment

Operator resumes the interrupted Pi session in Claude Code and requests Claude models/efforts from the approved portable preset. Scope, acceptance and exclusions of brief-r13 remain unchanged except actor routing below. Base `52483cf82fcca2ea826878af609cb7509594e974`; author commit `55e04c0eb111e1b8d84fc3fab194fd1d63f7348b` on exclusive `feat/j023-git-content`. Uncommitted `tests/host-native-delegation.mjs` adds `isswf_git_content` to the synthetic reviewer tool override; it is part of this unit. Unrelated dirty plan and untracked J027–J032 stay unstaged.

## Routing and allocation

- Corrections: one Claude `isswf-worker`, `sonnet` / `medium` (explicit delegation parameters; per-role effort persistence unverified), max 1 call per correction, this checkout, explicit-file commits only, no push.
- Review: up to two Claude `isswf-reviewer` rounds, `opus` / `medium`, Read/Grep/Glob only, on the exact retained candidate.
- The brief-r13 gate "actual fresh Pi reviewer invokes `isswf_git_content`" is **not** satisfied by Claude review. Operator decision: review first, decide the gate afterwards. It stays pending and blocks integration.
- No live Pi/provider calls, installation, push, PR or integration under this brief.

## Observed environment limit

`tests/host-native-delegation.mjs` fails locally before any case: `tooling/host-tests/node_modules/pi-subagents/bundle/index.js` is missing (host-test dependencies not installed). This is an environment gap, not candidate evidence either way.

## Checkpoint for the next session

- The `isswf` plugin is disabled in this checkout's tracked `.claude/settings.json` by design. Start the next Claude session with `claude --plugin-dir /home/iseoane/Work/isSWF` so that the native `isswf-worker`/`isswf-reviewer` agents and `/isswf:isswf-coordinator` load from source. Do not enable the installed `isswf@isswf`.
- Correction 1/1: generic native agent standing in for the worker (plugin not loaded), `sonnet`/`medium` requested, actual effort unverified. It committed `716aabf` (test-only, parent `55e04c0`). It read worker.md and claude-code.md but not brief-r13/r14. Checks: git-content, git-evidence, git-evidence-pi, check-docs, ESLint and diff-check PASS. host-native-delegation FAIL from the missing bundle; its new assertions are not yet observed passing.
- **Candidate for review: `52483cf..716aabf`**. No reviewer has been launched yet (0/2 used).
- Next step: one `isswf-reviewer` `opus`/`medium` reads brief-r13 + r14, reviewer.md and the review/security skills, and reviews the exact candidate. Record V006. Then the operator decides the Pi actual-use gate. After that come push, PR and native CI. Integration requires a separate grant.
