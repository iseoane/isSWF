import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Loads the source plugin in the pinned real Claude Code and asks the host which tools the isswf-reviewer context holds.
// No prompt is sent: no model call, no credentials. This verifies manifest registration, tool naming and the agent allowlist,
// not that a model invokes the tools.
const source = resolve(process.argv[2] ?? '.');
const claudeVersion = '2.1.299';
const claude = join(source, 'tooling/host-tests/node_modules/@anthropic-ai/claude-code-' + process.platform + '-' + process.arch, process.platform === 'win32' ? 'claude.exe' : 'claude');
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-claude-tools-')));
const inherited = Object.fromEntries(Object.entries(process.env).filter(([key]) => ['PATH', 'PATHEXT', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'TEMP', 'TMP', 'PROGRAMFILES', 'PROGRAMFILES(X86)', 'PROGRAMW6432', 'CLAUDE_CODE_GIT_BASH_PATH'].includes(key.toUpperCase())));
const environment = home => ({ ...inherited, HOME: home, USERPROFILE: home, APPDATA: join(home, 'AppData/Roaming'), LOCALAPPDATA: join(home, 'AppData/Local'), XDG_CONFIG_HOME: join(home, 'config'), XDG_DATA_HOME: join(home, 'data'), CLAUDE_CONFIG_DIR: join(home, 'claude'), DISABLE_AUTOUPDATER: '1', DISABLE_TELEMETRY: '1', DISABLE_ERROR_REPORTING: '1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', ISSWF_GIT_EVIDENCE_BINDINGS: '{}' });

async function reviewerContext(label, pluginDir) {
  const home = join(root, label);
  await mkdir(home, { recursive: true });
  const child = spawn(claude, ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose', '--plugin-dir', pluginDir, '--agent', 'isswf:isswf-reviewer'], { cwd: home, env: environment(home), stdio: ['pipe', 'pipe', 'pipe'] });
  let buffer = '';
  let stderr = '';
  const responses = new Map();
  child.stderr.on('data', chunk => { stderr += chunk; });
  child.stdin.on('error', () => {});
  child.stdout.on('data', chunk => {
    buffer += chunk;
    let index;
    while ((index = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      try { const message = JSON.parse(line); if (message.type === 'control_response') responses.set(message.response.request_id, message.response); } catch { /* non-JSON diagnostics are ignored */ }
    }
  });
  const send = request_id => child.stdin.write(JSON.stringify({ type: 'control_request', request_id, request: request_id === 'init' ? { subtype: 'initialize' } : { subtype: 'get_context_usage' } }) + '\n');
  try {
    send('init');
    const deadline = Date.now() + 60000;
    // The plugin's MCP server connects asynchronously: poll the host until its tools are present or the bound expires.
    for (let attempt = 0; Date.now() < deadline; attempt += 1) {
      const id = `context-${attempt}`;
      send(id);
      const until = Date.now() + 1500;
      while (!responses.has(id) && Date.now() < until) await new Promise(done => setTimeout(done, 50));
      const usage = responses.get(id)?.response;
      if (usage?.mcpTools?.length) return usage;
      if (usage && Date.now() + 1500 >= deadline) return usage;
      await new Promise(done => setTimeout(done, 500));
    }
    throw Error(`no context usage from the host\n${stderr.slice(0, 500)}`);
  } finally {
    child.kill();
    await new Promise(done => child.once('close', done));
  }
}

try {
  const version = spawn(claude, ['--version'], { env: environment(root) });
  let output = '';
  version.stdout.on('data', chunk => { output += chunk; });
  await new Promise(done => version.once('close', done));
  assert.ok(output.startsWith(claudeVersion + ' '), `pinned Claude ${claudeVersion} expected, got ${output.trim()}`);

  const usage = await reviewerContext('real', source);
  assert.deepEqual(usage.mcpTools.map(tool => tool.name).sort(), ['mcp__plugin_isswf_isswf_git_evidence__content', 'mcp__plugin_isswf_isswf_git_evidence__diff', 'mcp__plugin_isswf_isswf_git_evidence__identity']);
  for (const tool of usage.mcpTools) assert.equal(tool.serverName, 'plugin_isswf_isswf_git_evidence');
  assert.equal(usage.apiUsage, null, 'no model call occurred');
  assert.equal(usage.messageBreakdown.userMessageTokens + usage.messageBreakdown.toolCallTokens + usage.messageBreakdown.toolResultTokens, 0);
  assert.ok(usage.agents.some(agent => agent.agentType === 'isswf:isswf-reviewer'));

  // Negative control: the same plugin with a one-tool allowlist must surface exactly that tool, proving the list is the agent's filter.
  const narrowed = join(root, 'narrowed-plugin');
  await mkdir(narrowed);
  for (const entry of ['.claude-plugin', 'agents', 'skills', 'tools']) await cp(join(source, entry), join(narrowed, entry), { recursive: true });
  const profile = join(narrowed, 'agents/isswf-reviewer.md');
  const original = await readFile(profile, 'utf8');
  const reduced = original.replace(/^tools: .*$/mu, 'tools: Read, Grep, Glob, mcp__plugin_isswf_isswf_git_evidence__identity');
  assert.notEqual(reduced, original);
  await writeFile(profile, reduced);
  const narrow = await reviewerContext('narrowed', narrowed);
  assert.deepEqual(narrow.mcpTools.map(tool => tool.name), ['mcp__plugin_isswf_isswf_git_evidence__identity']);
  console.log(JSON.stringify({ status: 'PASS', platform: process.platform, claudeVersion, reviewerMcpTools: usage.mcpTools.map(tool => tool.name).sort(), negativeControl: narrow.mcpTools.map(tool => tool.name), limits: 'Host-reported context only: no model call, no tool invocation, no credentials.' }));
} finally {
  await rm(root, { recursive: true, force: true });
}
