# I0059/J002 brief-r1: No MCP configuration error when the review binding is unset

## Identity and authorization

- Job and brief revision: I0059/J002, r1.
- Request mode: feature-to-PR start. The operator said on 2026-11-16 "coordinador, ponte con la I0059" after approving option B plus this MCP fix. The start covers implementation, checks, review, commits, push of `feat/i0059-team-guard`, PR and CI. It does not cover the merge.
- Operation ownership: the worker edits the paths below, commits on `feat/i0059-team-guard` and fills `jobs/J002/A001.md`. The coordinator owns the plan, this brief, reviews, push, PR and CI.
- Profile: `.agents/roles/worker.md`.

## Objective

- Outcome: an ordinary Claude Code session with the isSWF plugin and no `ISSWF_GIT_EVIDENCE_BINDINGS` in its environment logs no `Missing environment variables` warning and no `mcp-config-invalid` error for `isswf_git_evidence`. A bound review still receives its binding, and every evidence call without a binding still fails closed.
- Size: S, from the plan.

## Scope and acceptance

- Included: `.claude-plugin/plugin.json` (the server's `env`), `tools/git-evidence*.mjs` only if an empty value needs handling, `tests/claude-reviewer-tools.mjs` or a focused test, `.agents/hosts/claude-code-review-launch.md`, `docs/{en,es}/installation.md` line about the unset case if it changes.
- Excluded: the J001 mod changes; the bound review launch forms.
- Acceptance: the plan's J002 acceptance.
- Approach to verify first: Claude Code documents `${VAR:-default}` expansion for MCP configuration. Confirm from Claude Code's documentation or by a local run of the installed `claude` (version noted) that a plugin manifest's MCP `env` accepts `${ISSWF_GIT_EVIDENCE_BINDINGS:-}` and that the warning disappears with the variable unset (`claude --debug-file <tmp> -p "hi" --plugin-dir <this checkout>` is acceptable if it makes no more than one cheap model call; otherwise use `claude plugin validate` or `claude mcp` output). If the expansion is unsupported, stop and report the alternatives instead of inventing one.
- The server must treat an empty value exactly as a missing one (fail closed). Check `tools/git-evidence*.mjs` and add a test if that path is not covered.
- Checks: `node tests/claude-reviewer-tools.mjs .` (or the focused test you add), `node tooling/quality/check-docs.mjs`, `git diff --check`. Windows: state that it was not run and why; the manifest syntax is host-level, not OS-specific, but say so as an inference.
- Methodology considered: TDD selected for the empty-value fail-closed contract if a code change is needed; not selected for the manifest line (configuration). isswf-writing selected for the doc edits.

## Independent review

- Required: yes, one Agent-tool reviewer round (binding/authority surface). Budget: at most 2 review rounds and 1 correction cycle.

## Inputs and bases

- Target base: 48819253ba758b92784a1ce58562033a4f2f9fb5 (main). The document-input checkpoint is the commit that adds this brief.
- Plan: `.factory/initiatives/I0059/plan.md`, job J002. Evidence log is outside the repository and not needed.

## Execution

- Checkout: `/home/iseoane/Work/isSWF`, branch `feat/i0059-team-guard`, shared-sequential: one writer at a time, nobody else writes while you run.
- Model and effort: from `.factory/dispatch-selection.json` (worker sonnet/medium). One worker call, no retries.
- Do not push, open PRs or touch other branches.
