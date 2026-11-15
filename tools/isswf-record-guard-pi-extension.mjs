import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { guardRecord } from './isswf-record-guard-core.mjs';

const TOOLS = new Set(['edit', 'write']);

const list = async dir => (await readdir(dir, { withFileTypes: true })).map(entry => ({ name: entry.name, kind: entry.isDirectory() ? 'dir' : entry.isFile() ? 'file' : 'other' }));

// Appends the record check to a successful edit or write of a plan or record, and changes nothing else.
// Pi's `tool_result` patch replaces `content`, so `structuredContent` is passed along or it would be dropped.
export default function (pi) {
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
