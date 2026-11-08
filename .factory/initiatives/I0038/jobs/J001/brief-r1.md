# Job brief J001 / r1

## Identity and authorization

- Source: operator chat 2026-11-08 accepting the version notice and cleanup proposal.
- Authorization: preparation only. A researcher dispatch needs an explicit operator start.
- Profile: researcher (read-only). Target base: d3cae38ae33794efaf2f34c1babe1942066006c8.

## Objective

Establish where installed isSWF versions live and how to identify the running and latest installed version, per host and OS, before any deletion design.

## Questions

1. Claude Code: where are installed plugin versions kept (plugin cache, local marketplace folder), does `claude plugin` remove or update old versions, and how does a session read the active plugin version (`.claude-plugin/plugin.json`, `${CLAUDE_PLUGIN_ROOT}`)?
2. Pi: where does `pi install`/update keep package versions, does `pi remove` delete them, how is the loaded package version read?
3. Legacy runtime store `~/.local/share/isswf` (`ISSWF_STORE`, `tools/isswf.mjs`): layout, how pins reference releases, what update does.
4. Local release folders used as marketplace sources (`docs/installation.md:54-57`, `docs/en/installation.md:47-50`).
5. Windows equivalents of each path.

## Methodology considered

- researcher (facts about host managers beyond the target code): **selected**.
- verification-principles (claims need evidence beyond tests): **selected**; every claim cites code, official docs or an observed listing, unverified marked as such.
- design-principles: not selected: no contract is designed in this job; J002/J003 will select it.
- Other triggers do not apply.

## Sources

- `docs/installation.md` (store, receipts, retained runtimes, uninstall), `docs/en/installation.md` and `docs/es/installation.md`, `tools/isswf.mjs`, `tools/release-source.mjs`, `.agents/skills/isswf-setup/SKILL.md`, `.agents/hosts/pi.md`, `.agents/hosts/claude-code.md`; official Claude Code plugin docs and Pi package docs.
- Local observation allowed read-only: listing `~/.claude/plugins`, Pi package locations and `~/.local/share/isswf` on this Linux machine; no deletion, install or update.

## Exclusions

- No file changes outside the attempt record; no install, update, removal or provider calls.

## Return

Per question: answer, evidence (path/line, URL or observed listing), confidence, Windows status. Then the recommendation of what isSWF may delete itself versus delegate to the host manager.
