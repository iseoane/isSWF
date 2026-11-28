# I0047 J001 research note

Read-only research at base 11a78534f9786e3e3d0d1112cea2e74dce13d12f; Pi 1.5.2 (`@earendil-works/pi-coding-agent`) inspected on Windows. Researcher run: claude agent=a536c9b1dc96b4c06 (haiku/high).

## Findings

- Pi 1.5.2 has no sidebar slot. The closest persistent surface is `ctx.ui.setWidget(key, string[] | factory, {placement: 'aboveEditor' | 'belowEditor'})` (dist/core/extensions/types.d.ts:111-115).
- String-array widgets are capped at 10 entries with a truncation marker (dist/modes/interactive/interactive-mode.js:1988-1993); a factory component has no cap but is TUI-only and ignored over RPC (dist/modes/rpc/rpc-mode.js:127-141).
- Reload and session switch clear widgets (interactive-mode.js:383, 2015-2030); `session_start` is re-emitted with reason reload, new, resume or fork (dist/core/agent-session.js:3130, dist/core/agent-session-runtime.js:141-299), and reload builds a new extension runner, so extension state starts over.
- Alternatives: `setFooter` replaces the built-in footer; a `custom` overlay anchored `right-center` is closer to a sidebar but resolves only on `done()`, is removed on reload and captures focus unless `nonCapturing`.
- Snapshot: `readSnapshot` in tools/isswf-snapshot.mjs (core tools/isswf-snapshot-core.mjs:326-346), already packaged.
- Activation: reuse the coordinator detection of tools/isswf-compaction-pi-extension.mjs:7-45 (`/skill:isswf-coordinator` input or a `read` of the skill), plus `ctx.mode === 'tui'`. That latch resets on every `session_start` (lines 26-31), so on its own the widget would stay hidden after reload or resume (review V001 F1). The extension must instead rebuild the latch on `session_start` from the session entries (`ctx.sessionManager`: an earlier coordinator skill input or read) and re-set the widget there.
- Refresh: `agent_settled`, mutating `tool_result`, 60 s fallback timer started on `session_start` and cleared on `session_shutdown`; file watch not recommended.
- Windows: Pi is best on Windows Terminal; classic conhost has known redraw issues (docs/windows.md:83-108). No live Linux Pi UI evidence exists.

## Recommendation

A new `tools/isswf-initiatives-pi-extension.mjs` sets a string-array widget of at most 9 short lines (one per active initiative with open, blocked and next job; one for unopened initiatives; when more initiatives exist than fit, the last line counts the rest), wired in package.json `pi.extensions` and in `nativePiResources` (tools/factory-package.mjs and tools/build-release.mjs; REVIEW.md requires a person's approval for those), with a fake-`pi` test and en/es docs (docs/en/installation.md:70 says Pi has no pane).

## Operator decisions

1. Accept an above- or below-editor widget (10-entry cap) instead of a sidebar, or the overlay with its risks.
2. Accept "same information" as a compact summary, not the Claude card layout.
3. Pi version floor: verify `setWidget` at 1.4.0 (.agents/hosts/pi.md:7) or raise the floor.
4. Whether reading project records checks `ctx.isProjectTrusted()`.

## Unverified

The `pi` on PATH, widget behavior while streaming, whether background children load `pi.extensions`, `fs.watch` behavior.

## Operator answers (2026-11-28)

1. Widget above or below the editor, compact summary.
2. Accepted as a compact summary (follows from 1).
3. Feature-detect `ctx.ui.setWidget`; keep the Pi 1.4.0 floor and show nothing when it is missing.
4. Read project records only when `ctx.isProjectTrusted()` is true.
