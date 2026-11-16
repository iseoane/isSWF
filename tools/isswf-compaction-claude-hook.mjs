#!/usr/bin/env node
// Claude Code `SessionStart` settings hook for source `compact`, declared in hooks/hooks.json. Where the built-in guard is
// seated, the mod's own `classic.SessionStart` hook never runs, but a plugin's settings hooks do. The mod writes a note for the
// session it activated (see hooks/register.tsx); this script prints the reminder only when that note exists.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { compactionReminder, noteFileName, NOTE_DIR, parseNote } from './isswf-compaction-core.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

try {
  const input = JSON.parse(await readStdin());
  const name = noteFileName(input?.session_id);
  // The same order the mod resolves the directory in: CLAUDE_CONFIG_DIR, then HOME, then USERPROFILE.
  const home = process.env.HOME || process.env.USERPROFILE;
  const claudeDir = process.env.CLAUDE_CONFIG_DIR || (home ? join(home, '.claude') : undefined);
  if (input?.source === 'compact' && name && claudeDir) {
    const assignments = parseNote(await readFile(join(claudeDir, ...NOTE_DIR, name), 'utf8'));
    if (assignments) {
      process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: compactionReminder({ host: 'claude', assignments }) } }));
    }
  }
} catch {
  // A missing or unreadable note, or input that is not JSON, leaves the start as the host would have run it.
}
