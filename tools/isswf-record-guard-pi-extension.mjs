import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assignmentOf } from './isswf-branch-guard-core.mjs';
import { checkReferences } from './isswf-dispatch-guard-core.mjs';
import { checkRecordLocation, guardRecord } from './isswf-record-guard-core.mjs';

const TOOLS = new Set(['edit', 'write']);

const list = async dir => (await readdir(dir, { withFileTypes: true })).map(entry => ({ name: entry.name, kind: entry.isDirectory() ? 'dir' : entry.isFile() ? 'file' : 'other' }));

// Appends the record check to a successful edit or write of a plan or record, and refuses, before it runs, an edit or write of an attempt or review
// record outside the checkout the session's task assigns. Each session is one instance: the task's `checkout:` line, on a message that is an isSWF
// dispatch (as in tools/isswf-command-guard-pi-extension.mjs), binds a child; the main session has none unless such a message names one.
// Pi's `tool_result` patch replaces `content`, so `structuredContent` is passed along or it would be dropped.
export default function (pi) {
  let assignment;
  pi.on('session_start', () => {
    assignment = undefined;
  });
  pi.on('input', event => {
    try {
      if (assignment === undefined && typeof event?.text === 'string') {
        checkReferences(event.text);
        assignment = assignmentOf(event.text);
      }
    } catch {}
    return undefined;
  });
  pi.on('tool_call', (event, ctx) => {
    try {
      if (!TOOLS.has(event?.toolName) || typeof event.input?.path !== 'string') return undefined;
      const { deny } = checkRecordLocation({ path: typeof ctx?.cwd === 'string' ? resolve(ctx.cwd, event.input.path) : event.input.path, assignment });
      return deny === undefined ? undefined : { block: true, reason: deny };
    } catch {
      return undefined;
    }
  });
  pi.on('tool_result', async (event, ctx) => {
    try {
      if (!TOOLS.has(event?.toolName) || event.isError || typeof event.input?.path !== 'string') return undefined;
      const path = resolve(ctx.cwd, event.input.path);
      const text = await guardRecord({ path, read: file => readFile(file, 'utf8'), list });
      if (!text) return undefined;
      return { content: [...event.content, { type: 'text', text }], ...(event.structuredContent !== undefined && { structuredContent: event.structuredContent }) };
    } catch {
      return undefined;
    }
  });
}
