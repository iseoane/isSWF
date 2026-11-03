# Windows verification brief — I0024 and I0025

Operator-owned run on a native Windows machine (Windows 10/11, PowerShell). Prepared 2026-11-03 from branch `feat/i0025-auto-claude-capture`. Linux evidence is already retained; this brief collects the equivalent **Windows** outcomes. It grants no installation, publication or merge by itself: install prerequisites only as the operator decides.

Record every result (command, exit code, short output, Claude/Pi/Node versions) in `.factory/initiatives/I0025/jobs/J006/W001.md` and, for I0024, `.factory/initiatives/I0024/jobs/J004/W001.md`. Failures and inconclusive results stay visible; never paste transcript content, tokens or credentials.

## 0. Prerequisites and checkout

```powershell
node --version        # must be 24+
git --version
claude --version      # record exact version (Linux reference: 2.1.312)
pi --version          # record exact version (Linux reference: 1.5.0)
git clone https://github.com/iseoane/isSWF.git
cd isSWF
git checkout feat/i0025-auto-claude-capture
git log -1 --format=%H   # record the exact commit
npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund
```

## 1. Shared portable checks (both initiatives)

```powershell
node tools/check-quality.mjs
node tooling/quality/check-docs.mjs
node tooling/quality/node_modules/eslint/bin/eslint.js --config tooling/quality/eslint.config.mjs tools tests tooling/quality/*.mjs
node tooling/quality/node_modules/knip/bin/knip.js --config tooling/quality/knip.json --no-progress
```

Expected: all exit 0. `nativeHostDelegation` may report NOT_RUN; record it as such.

## 2. I0025 — Claude transcript reader (primary capture)

```powershell
node tests/token-native-claude-transcript.mjs
node tests/token-native-claude.mjs
node tests/token-report.mjs
node tests/token-native-usage.mjs
node tests/token-native-auto-pi.mjs
```

Real counts-only run (start and finish one short ordinary `claude` session in this checkout first, using a subagent once if possible, so a finished session exists):

```powershell
node tools/token-native-claude-transcript.mjs --project "$PWD" > summary.json
node tools/token-report.mjs summary.json
```

Check and record:
- the project directory under `%USERPROFILE%\.claude\projects\` was found (path encoding works on Windows, including drive letter);
- coverage: files present/parsed/invalid, requests, `versionRecognized`;
- one parent row plus one row per subagent; total status;
- if the format is reported invalid or unrecognised: record the check names and version and open an issue at https://github.com/iseoane/isSWF/issues as the tool recommends.

Delete `summary.json` afterwards; do not commit it.

## 3. I0025 — Pi automatic capture

With the Pi capture enabled by setup for this checkout (see `docs/en/operations.md`, token section), run one short Pi task with one subagent, then produce and record the Pi summary/report as documented. Confirm parent and child rows appear without manual JSON transfer.

## 4. I0024 — responsive coordination (live, both hosts)

Follow the unmet acceptance criteria in `.factory/initiatives/I0024/plan.md` (J001–J004). For each of **Pi** and **Claude Code** on Windows, observe and record:
1. Delegate a background agent and keep talking to the coordinator while it runs; the coordinator answers without waiting or spending model calls to poll.
2. Completion notification arrives and the result is consumed once (a duplicate/late notice causes no repeated action).
3. Cancel or interrupt a running agent; the coordinator reports the actual state and resumes or stops safely without redispatching automatically.
4. While CI or another long operation is pending, the coordinator stays available and reports truthful activity.

Record observed / not observed / failed per item and host. Claude Code requires the plugin loaded with `--plugin-dir <checkout>`.

## Return

Commit the W001 records on a branch and push, or paste the results to the coordinator. The coordinator reconciles them against the plans; full acceptance is not inferred from partial results.
