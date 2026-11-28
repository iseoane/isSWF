# I0047 J001 research note

Read-only research at base 11a78534f9786e3e3d0d1112cea2e74dce13d12f; Pi 1.5.2 (`@earendil-works/pi-coding-agent`) inspected on Windows. Researcher run: claude agent=a536c9b1dc96b4c06 (haiku/high).

## Findings

- Pi 1.5.2 has no sidebar slot. The closest persistent surface is `ctx.ui.setWidget(key, string[] | factory, {placement: 'aboveEditor' | 'belowEditor'})` (dist/core/extensions/types.d.ts:111-115).
- String-array widgets are capped at 10 entries with a truncation marker (dist/modes/interactive/interactive-mode.js:1988-1993); a factory component has no cap but is TUI-only and ignored over RPC (dist/modes/rpc/rpc-mode.js:127-141).
- Reload and session switch clear widgets; `session_start` is re-emitted, so the widget is re-registered there (interactive-mode.js:2015-2031).
- Alternatives: `setFooter` replaces the built-in footer; a `custom` overlay anchored `right-center` is closer to a sidebar but resolves only on `done()`, is removed on reload and captures focus unless `nonCapturing`.
- Snapshot: `readSnapshot` in tools/isswf-snapshot.mjs (core tools/isswf-snapshot-core.mjs:326-346), already packaged.
- Activation: reuse the coordinator latch of tools/isswf-compaction-pi-extension.mjs:7-45 (`/skill:isswf-coordinator` input or a `read` of the skill), plus `ctx.mode === 'tui'`.
- Refresh: `agent_settled`, mutating `tool_result`, 60 s fallback timer started on `session_start` and cleared on `session_shutdown`; file watch not recommended.
- Windows: Pi is best on Windows Terminal; classic conhost has known redraw issues (docs/windows.md:83-108). No live Linux Pi UI evidence exists.

## Recommendation

A new `tools/isswf-initiatives-pi-extension.mjs` sets a string-array widget of at most 9 short lines (one per active initiative with open, blocked and next job; one for unopened initiatives), wired in package.json `pi.extensions` and `nativePiResources`, with a fake-`pi` test and en/es docs (docs/en/installation.md:70 says Pi has no pane).

## Operator decisions

1. Accept an above- or below-editor widget (10-entry cap) instead of a sidebar, or the overlay with its risks.
2. Accept "same information" as a compact summary, not the Claude card layout.
3. Pi version floor: verify `setWidget` at 1.4.0 (.agents/hosts/pi.md:7) or raise the floor.
4. Whether reading project records checks `ctx.isProjectTrusted()`.

## Unverified

The `pi` on PATH, widget behavior while streaming, whether background children load `pi.extensions`, `fs.watch` behavior.
