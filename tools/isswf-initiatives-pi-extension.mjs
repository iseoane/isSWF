import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import { isCoordinatorSkill } from './isswf-compaction-core.mjs';
import { stateDirectory } from './project-state.mjs';
import { readSnapshot } from './isswf-snapshot-core.mjs';

const KEY = 'isswf-initiatives';
const REFRESH_MS = 60_000;
/** Pi shows at most 10 entries of a string widget and replaces the rest with its own marker; this keeps one entry below that. */
export const MAX_LINES = 9;
const TITLE_MAX = 35;
const UNOPENED_IDS = 3;
const COORDINATOR_FILE = /(?:^|[\\/])isswf-coordinator[\\/]SKILL\.md$/u;
// Pi stores a `/skill:name` input as the expanded block `<skill name="..." location="...">`, never as the typed text.
const SKILL_BLOCK = /^<skill name="([^"]+)" location="/u;
// A refresh after one of these tool results would read the same records again.
const READ_ONLY_TOOLS = new Set(['read', 'grep', 'find', 'ls']);

const fs = {
  exists: async path => existsSync(path),
  list: async path => (await readdir(path, { withFileTypes: true })).map(entry => ({ name: entry.name, kind: entry.isFile() ? 'file' : entry.isDirectory() ? 'dir' : 'other' })),
  stat: async path => ({ size: (await stat(path)).size }),
  read: path => readFile(path, 'utf8'),
};

// Plan titles are untrusted text that reaches the terminal: control characters, including escape sequences, are dropped.
const clean = (text, max = TITLE_MAX) => {
  const plain = String(text ?? '').replace(/[\u0000-\u001f\u007f-\u009f]/gu, '').trim();
  return plain.length > max ? `${plain.slice(0, max - 1)}…` : plain;
};

// The counts follow the Claude pane: blocked jobs, and open jobs as those neither completed nor blocked.
function initiativeLine({ id, title, status, jobs }) {
  if (status === 'unparsed') return `${clean(id)} · plan unreadable`;
  const completed = new Set(jobs.filter(job => job.status === 'completed').map(job => job.id));
  const blocked = jobs.filter(job => job.status === 'blocked').length;
  const open = jobs.filter(job => job.status !== 'completed' && job.status !== 'blocked').length;
  const next = jobs.find(job => job.status === 'pending' && job.dependsOn.every(dependency => completed.has(dependency)));
  const parts = [blocked && `${blocked} blocked`, open && `${open} open`, next && `next ${clean(next.id)}`].filter(Boolean);
  return [`${clean(id)} ${clean(title)}`, ...parts].join(' · ');
}

/** The widget's lines for a snapshot: one per initiative, a count of the ones left out, and one for the unopened. */
export function renderLines({ initiatives, unopened }) {
  const slots = MAX_LINES - (unopened.length ? 1 : 0);
  const shown = initiatives.length > slots ? initiatives.slice(0, slots - 1) : initiatives;
  const lines = shown.map(initiativeLine);
  if (shown.length < initiatives.length) lines.push(`+${initiatives.length - shown.length} more initiatives`);
  if (unopened.length) lines.push(`○ ${unopened.length} unopened: ${unopened.slice(0, UNOPENED_IDS).map(item => clean(item.id)).join(' ')}${unopened.length > UNOPENED_IDS ? ` +${unopened.length - UNOPENED_IDS}` : ''}`);
  return lines;
}

const textOf = content => (typeof content === 'string' ? content : Array.isArray(content) ? content.map(block => (block?.type === 'text' ? block.text : '')).join('') : '');

/** Whether the session's current branch already loaded the coordinator skill: its expanded block in a user message or a `read` of its SKILL.md. */
export function latchFromBranch(entries) {
  if (!Array.isArray(entries)) return false;
  return entries.some(entry => {
    const message = entry?.type === 'message' ? entry.message : undefined;
    if (message?.role === 'user') return isCoordinatorSkill(SKILL_BLOCK.exec(textOf(message.content))?.[1]);
    if (message?.role === 'assistant' && Array.isArray(message.content)) return message.content.some(block => block?.type === 'toolCall' && block.name === 'read' && COORDINATOR_FILE.test(block.arguments?.path));
    return false;
  });
}

// A string widget under the editor shows a compact summary of the project's initiatives in a coordinator session of the TUI. The records are
// read only for a trusted project, no model call is made, and each handler fails open: a fault never reaches Pi. Pi clears widgets and builds a
// new runner on /reload and on a session switch, so `session_start` rebuilds the coordinator latch from the stored entries and draws again.
// `io.fs` replaces the file-system adapter; Pi passes only `pi`.
export default function (pi, io = {}) {
  let active = false;
  let timer;
  let last;
  let shownKey;
  let reading = false;
  let again;

  const eligible = ctx => active && ctx?.mode === 'tui' && ctx.isProjectTrusted?.() === true && typeof ctx.ui?.setWidget === 'function';

  async function draw(ctx) {
    let lines;
    try {
      stateDirectory(ctx.cwd);
      lines = renderLines(await readSnapshot(ctx.cwd, io.fs ?? fs));
    } catch {
      lines = [];
    }
    const key = lines.join('\n');
    if (lines.length ? key === shownKey : shownKey === undefined) return;
    ctx.ui.setWidget(KEY, lines.length ? lines : undefined, { placement: 'belowEditor' });
    shownKey = lines.length ? key : undefined;
  }

  // A refresh asked for during a read runs once more after it, with the newest context, so a change made meanwhile is not lost.
  async function refresh(ctx) {
    if (!eligible(ctx)) return;
    if (reading) {
      again = ctx;
      return;
    }
    reading = true;
    try {
      for (let next = ctx; next; next = again) {
        again = undefined;
        if (eligible(next)) await draw(next);
      }
    } catch {} finally {
      reading = false;
    }
  }

  const activate = async ctx => {
    if (active) return;
    active = true;
    await refresh(ctx);
  };

  pi.on('session_start', async (_event, ctx) => {
    try {
      clearInterval(timer);
      last = ctx;
      shownKey = undefined;
      active = latchFromBranch(ctx?.sessionManager?.getBranch?.());
      timer = setInterval(() => refresh(last), REFRESH_MS);
      timer.unref?.();
      await refresh(ctx);
    } catch {}
  });

  pi.on('session_shutdown', () => {
    clearInterval(timer);
    timer = undefined;
  });

  pi.on('input', async (event, ctx) => {
    try {
      last = ctx;
      if (isCoordinatorSkill(/^\/skill:(\S+)/u.exec(event?.text)?.[1])) await activate(ctx);
    } catch {}
    return undefined;
  });

  pi.on('tool_call', async (event, ctx) => {
    try {
      last = ctx;
      if (event?.toolName === 'read' && COORDINATOR_FILE.test(event.input?.path)) await activate(ctx);
    } catch {}
    return undefined;
  });

  pi.on('tool_result', (event, ctx) => {
    try {
      last = ctx;
      if (!READ_ONLY_TOOLS.has(event?.toolName)) void refresh(ctx);
    } catch {}
    return undefined;
  });

  pi.on('agent_settled', async (_event, ctx) => {
    try {
      last = ctx;
      await refresh(ctx);
    } catch {}
  });
}
