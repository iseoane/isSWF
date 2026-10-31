#!/usr/bin/env node
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { captureBinding, checkArguments, diffChunkParameters, invokeEvidence } from './git-evidence-invoke.mjs';

// Thin stdio MCP server for the Claude reviewer route. The launching process supplies the trusted binding in
// ISSWF_GIT_EVIDENCE_BINDINGS (the three Pi namespaces); it is captured once here and never re-read.
const cli = join(dirname(fileURLToPath(import.meta.url)), 'git-evidence.mjs');
const missing = 'trusted launch binding is missing';
const bindings = Object.fromEntries(['identity', 'diff', 'content'].map(operation => [operation, captureBinding(process.env.ISSWF_GIT_EVIDENCE_BINDINGS, operation, missing)]));
delete process.env.ISSWF_GIT_EVIDENCE_BINDINGS;

const maxFrameBytes = 65536;
// Claude Code truncates MCP text beyond MAX_MCP_OUTPUT_TOKENS (default 25,000 tokens), which the coordinator raises for the
// review process. This server refuses any result above this bound whole; it cannot see or enforce the host's limit.
const displayBoundBytes = 98304;
const diffChunkBytes = 24576;
const protocolVersions = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];
const noArguments = { type: 'object', properties: {}, additionalProperties: false };
const tools = [
  { name: 'identity', description: 'Return only the coordinator-bound repository, base commit, candidate commit, observed HEAD, and bounded identity errors. No arguments are accepted.', inputSchema: noArguments },
  { name: 'diff', description: `Return the exact committed patch between the coordinator-bound commits as numbered chunks of at most ${diffChunkBytes} bytes. Every chunk repeats the whole-patch byte count and SHA-256 and states its chunk number and count; the patch is complete only when chunks 1..chunkCount concatenate to that digest. Optional argument: chunk (default 1).`, inputSchema: { type: 'object', properties: { ...diffChunkParameters }, additionalProperties: false } },
  { name: 'content', description: 'Return exact bytes for one allowlisted regular file from the coordinator-bound base or candidate commit. Select only a bound path and slot; no repository or revision can be supplied. A result beyond the display bound is refused whole.', inputSchema: { type: 'object', properties: { slot: { type: 'string', enum: ['base', 'candidate'] }, path: { type: 'string' } }, required: ['slot', 'path'], additionalProperties: false } },
];
const unavailable = { identity: 'Identity evidence unavailable', diff: 'Diff evidence unavailable', content: 'Committed content unavailable' };

function callTool(name, args) {
  try {
    checkArguments(name, args, { chunked: true });
    const captured = bindings[name];
    if (!captured.binding) throw Error(`${unavailable[name]}: ${captured.error}`);
    const result = invokeEvidence({ ...args, cli, operation: name, binding: captured.binding, chunkBytes: diffChunkBytes });
    if (result.content.reduce((sum, block) => sum + Buffer.byteLength(block.text), 0) > displayBoundBytes) throw Error('Result exceeds the display bound for this host; no partial evidence is returned. Use a smaller bound or chunk.');
    return { content: result.content, ...(result.isError ? { isError: true } : {}) };
  } catch (error) {
    return { content: [{ type: 'text', text: typeof error?.message === 'string' ? error.message.slice(0, 240) : 'Evidence tool failed.' }], isError: true };
  }
}

const send = message => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...message }) + '\n');
const reply = (id, result) => send({ id, result });
const fail = (id, code, message) => send({ id, error: { code, message } });

function handle(line) {
  let request;
  try { request = JSON.parse(line); } catch { return fail(null, -32700, 'Parse error'); }
  if (!request || typeof request !== 'object' || Array.isArray(request) || typeof request.method !== 'string') return fail(request?.id ?? null, -32600, 'Invalid request');
  if (request.id === undefined) return;
  const { id, params } = request;
  if (request.method === 'initialize') {
    const requested = params?.protocolVersion;
    return reply(id, { protocolVersion: protocolVersions.includes(requested) ? requested : protocolVersions[0], capabilities: { tools: {} }, serverInfo: { name: 'isswf-git-evidence', version: '1' } });
  }
  if (request.method === 'ping') return reply(id, {});
  if (request.method === 'tools/list') return reply(id, { tools });
  if (request.method === 'tools/call') {
    if (!params || typeof params.name !== 'string' || !tools.some(tool => tool.name === params.name)) return fail(id, -32602, 'Unknown tool');
    return reply(id, callTool(params.name, params.arguments));
  }
  return fail(id, -32601, 'Method not found');
}

let buffer = Buffer.alloc(0);
const refuseOversized = () => {
  fail(null, -32600, 'Frame exceeds the size bound');
  process.exitCode = 1;
  process.stdin.destroy();
};
process.stdin.on('data', chunk => {
  buffer = Buffer.concat([buffer, chunk]);
  let index;
  while ((index = buffer.indexOf(10)) >= 0) {
    if (index > maxFrameBytes) return refuseOversized();
    const line = buffer.subarray(0, index).toString('utf8').replace(/\r$/u, '').trim();
    buffer = buffer.subarray(index + 1);
    if (line) handle(line);
  }
  if (buffer.length > maxFrameBytes) refuseOversized();
});
