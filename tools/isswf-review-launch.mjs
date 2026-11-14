#!/usr/bin/env node
// Prepares, launches and reads a Claude bound review (`claude -p` with the isswf_git_evidence server)
// so the model, effort and base come from the approved preset and the candidate's real parent.
import { spawn, spawnSync } from 'node:child_process';
import { createReadStream, createWriteStream, statSync } from 'node:fs';
import { readFile, realpath, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGit } from './git-evidence.mjs';

const KIND = 'isswf.review-launch';
const GIT_TIMEOUT_MS = 10000;
const EVIDENCE_TOOLS = ['identity', 'diff', 'content'].map(name => `mcp__plugin_isswf_isswf_git_evidence__${name}`);
// The Claude display bound refuses content results above about 40,000 raw bytes (claude-code-review-launch.md).
const BINDING_LIMITS = { identity: 4096, diff: 192000, content: 32768 };
const fullSha = value => /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u.test(value);

function git(repository, gitExecutable, args) {
  const binding = { repository, gitExecutable, timeoutMs: GIT_TIMEOUT_MS };
  return runGit(binding, args, Date.now() + GIT_TIMEOUT_MS, 1 << 20).toString('utf8').trim();
}

async function trustedGit(given) {
  if (given) return realpath(given);
  const locator = process.platform === 'win32' ? 'where.exe' : 'which';
  const found = spawnSync(locator, ['git'], { encoding: 'utf8', windowsHide: true }).stdout?.trim().split(/\r?\n/u)[0];
  if (!found) throw Error('git-executable-not-found');
  return realpath(found);
}

const commit = (repository, gitExecutable, ref) => {
  try { return git(repository, gitExecutable, ['rev-parse', '--verify', `${ref}^{commit}`]); } catch { throw Error(`commit-not-found:${ref}`); }
};

// Base is the candidate's real parent on the main line, not wherever main is now; a delta review passes the previous candidate.
export async function prepare({ repository, candidate, base, main = 'origin/main', paths = [], git: gitPath }) {
  if (!repository || !isAbsolute(repository)) throw Error('absolute-repository-required');
  const repo = await realpath(repository);
  if (!statSync(join(repo, '.git')).isDirectory()) throw Error('linked-worktree-bind-the-primary-clone');
  const gitExecutable = await trustedGit(gitPath);
  if (!candidate) throw Error('candidate-required');
  const candidateSha = commit(repo, gitExecutable, candidate);
  const baseSha = base ? commit(repo, gitExecutable, base) : git(repo, gitExecutable, ['merge-base', commit(repo, gitExecutable, main), candidateSha]);
  if (!fullSha(baseSha) || !fullSha(candidateSha)) throw Error('full-sha-required');
  if (baseSha === candidateSha) throw Error('base-equals-candidate');
  const changed = git(repo, gitExecutable, ['-c', 'core.quotePath=false', 'diff', '--name-only', '--no-renames', '-z', baseSha, candidateSha]).split('\0').filter(Boolean);
  const allowlist = [...new Set([...changed, ...paths])];
  if (allowlist.length < 1 || allowlist.length > 64) throw Error('content-paths-must-be-1-to-64');
  const common = { version: 1, repository: repo, baseSha, candidateSha, gitExecutable, timeoutMs: 5000 };
  const bindings = {
    'isswf.git-evidence/1': { ...common, outputBytes: BINDING_LIMITS.identity },
    'isswf.git-evidence.diff/1': { ...common, outputBytes: BINDING_LIMITS.diff },
    'isswf.git-evidence.content/1': { ...common, outputBytes: BINDING_LIMITS.content, paths: allowlist },
  };
  return { baseSha, baseSource: base ? 'given' : `merge-base ${main}`, candidateSha, paths: allowlist, bindings };
}

// Reads the Reviewer row of the shipped preset table; model and effort are its Claude Code column.
export async function presetReviewer(factoryRoot) {
  const text = await readFile(join(factoryRoot, '.agents/skills/isswf-setup/SKILL.md'), 'utf8');
  const row = text.split(/\r?\n/u).find(line => /^\|\s*Reviewer\s*\|/u.test(line));
  const match = row?.split('|')[2]?.match(/^\s*`([^`]+)`\s*\/\s*`([^`]+)`\s*$/u);
  if (!match) throw Error('reviewer-preset-not-found');
  return { model: match[1], effort: match[2] };
}

export async function launch({ bindings, task, trace, factoryRoot, model, effort, claude = 'claude', claudePrefix = [] }) {
  if (!bindings || !task || !trace || !factoryRoot) throw Error('bindings-task-trace-and-factory-root-required');
  if (Boolean(model) !== Boolean(effort)) throw Error('pass-both-model-and-effort-or-neither');
  const selection = model ? { model, effort, source: 'operator' } : { ...await presetReviewer(factoryRoot), source: 'preset' };
  const bindingText = JSON.stringify(JSON.parse(await readFile(bindings, 'utf8')));
  // Flag order matters: --allowedTools is variadic and would swallow later arguments, so it comes last and the task goes on stdin.
  const args = ['-p', '--agent', 'isswf:isswf-reviewer', '--plugin-dir', factoryRoot, '--model', selection.model, '--effort', selection.effort,
    '--output-format', 'stream-json', '--verbose', '--allowedTools', EVIDENCE_TOOLS.join(' ')];
  // The binding lives only in this child's environment so no other Claude session inherits it.
  const env = { ...process.env, ISSWF_GIT_EVIDENCE_BINDINGS: bindingText, MAX_MCP_OUTPUT_TOKENS: '100000' };
  await writeFile(`${trace}.launch.json`, `${JSON.stringify({ version: 1, kind: KIND, ...selection }, null, 2)}\n`);
  const input = createReadStream(task);
  await new Promise((resolve, reject) => { input.once('open', resolve); input.once('error', reject); });
  const output = createWriteStream(trace);
  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(claude, [...claudePrefix, ...args], { env, shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'inherit'] });
    child.on('error', reject);
    output.on('error', reject);
    input.pipe(child.stdin);
    child.stdout.pipe(output);
    // Resolve once the child has exited and the trace is flushed, so a caller can read it right away; a signal counts as failed.
    const exited = new Promise(done => child.on('close', (status, signal) => done(status ?? (signal ? 1 : 0))));
    const flushed = new Promise(done => output.on('finish', done));
    Promise.all([exited, flushed]).then(([code]) => resolve(code));
  });
  return { ...selection, exitCode, trace };
}

const blocks = event => (Array.isArray(event.message?.content) ? event.message.content : []);
// The evidence server returns its JSON envelope as the first text part; a decoded view may follow as a second part.
// A large result may reach the model as a <persisted-output> preview; the event's tool_use_result keeps the full content.
const resultText = (block, event) => {
  const single = blocks(event).filter(other => other.type === 'tool_result').length === 1;
  const content = single && typeof block.content === 'string' && Array.isArray(event.tool_use_result) ? event.tool_use_result : block.content;
  return typeof content === 'string' ? content : content?.[0]?.text ?? '';
};

export async function record({ trace }) {
  const events = (await readFile(trace, 'utf8')).split(/\r?\n/u).filter(Boolean).map(line => JSON.parse(line));
  const launched = await readFile(`${trace}.launch.json`, 'utf8').then(JSON.parse, () => undefined);
  const init = events.find(event => event.type === 'system' && event.subtype === 'init');
  const uses = new Map();
  for (const event of events) for (const block of blocks(event)) if (block.type === 'tool_use') uses.set(block.id, block);
  const calls = { identity: 0, diff: 0, content: 0 };
  let chunkCount;
  const chunks = new Set();
  for (const event of events) {
    for (const block of blocks(event)) {
      const use = block.type === 'tool_result' && !block.is_error && uses.get(block.tool_use_id);
      const tool = use && EVIDENCE_TOOLS.indexOf(use.name);
      if (!use || tool < 0) continue;
      const name = ['identity', 'diff', 'content'][tool];
      let body;
      try { body = JSON.parse(resultText(block, event)); } catch { continue; }
      if (body.status !== 'ok') continue;
      calls[name] += 1;
      if (name === 'diff') { chunkCount = body.chunkCount ?? 1; chunks.add(body.chunk ?? use.input?.chunk ?? 1); }
    }
  }
  const final = events.findLast(event => event.type === 'result');
  const complete = Boolean(final && final.subtype === 'success' && !final.is_error);
  const diffComplete = chunkCount !== undefined && Array.from({ length: chunkCount }, (_, i) => i + 1).every(n => chunks.has(n));
  return {
    version: 1, kind: KIND, complete,
    run: init?.session_id ? `claude session=${init.session_id}` : undefined,
    observedModel: init?.model, requested: launched && { model: launched.model, effort: launched.effort, source: launched.source },
    evidenceCalls: calls, diff: { chunkCount, fetched: [...chunks].sort((a, b) => a - b), complete: diffComplete },
    costUsd: final?.total_cost_usd, report: complete ? final.result : undefined,
  };
}

function parse(args) {
  const options = { paths: [] };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/u, '').replace(/-([a-z])/gu, (_, c) => c.toUpperCase());
    if (!args[i]?.startsWith('--') || args[i + 1] === undefined) throw Error(`bad-argument:${args[i]}`);
    if (key === 'path') options.paths.push(args[i + 1]); else options[key] = args[i + 1];
  }
  return options;
}

const USAGE = `Usage:
  node tools/isswf-review-launch.mjs prepare --repository <primary-clone> --candidate <ref> [--base <ref> | --main <ref>] [--path <file>]... --out <bindings.json> [--git <exe>]
  node tools/isswf-review-launch.mjs launch --bindings <bindings.json> --task <task.md> --trace <trace.jsonl> --factory-root <dir> [--model <m> --effort <e>] [--claude <exe>]
  node tools/isswf-review-launch.mjs record --trace <trace.jsonl>
`;

async function main([command, ...rest]) {
  try {
    const options = parse(rest);
    let output;
    if (command === 'prepare') {
      if (!options.out) throw Error('out-required');
      const { bindings, ...summary } = await prepare(options);
      await writeFile(options.out, `${JSON.stringify(bindings)}\n`);
      output = { ...summary, out: options.out };
    } else if (command === 'launch') output = await launch(options);
    else if (command === 'record') output = await record(options);
    else { process.stderr.write(USAGE); return 2; }
    process.stdout.write(`${JSON.stringify({ version: 1, status: 'ok', kind: KIND, command, ...output }, null, 2)}\n`);
    return output.exitCode || (output.complete === false ? 1 : 0);
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ version: 1, status: 'error', kind: KIND, command, reason: error.message })}\n`);
    return 2;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === await realpath(process.argv[1]).catch(() => '')) process.exitCode = await main(process.argv.slice(2));
