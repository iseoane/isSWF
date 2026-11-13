#!/usr/bin/env node
// Runs coordinator-supplied check commands on the exact candidate checkout and
// prints a checks block bound to that commit, for a bound reviewer's handoff.
import { spawn } from 'node:child_process';
import { readFile, realpath } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGit } from './git-evidence.mjs';

const KIND = 'isswf.review-checks';
const GIT_TIMEOUT_MS = 10000;
const fullSha = value => typeof value === 'string' && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u.test(value);
const absolute = value => typeof value === 'string' && isAbsolute(value) && !value.includes('\0');

export function validateSpec(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1) throw Error('invalid-spec-shape');
  const allowed = new Set(['version', 'repository', 'gitExecutable', 'candidateSha', 'commands', 'timeoutMs', 'tailBytes']);
  if (Object.keys(value).some(key => !allowed.has(key))) throw Error('invalid-spec-shape');
  if (!absolute(value.repository)) throw Error('invalid-repository');
  if (!absolute(value.gitExecutable)) throw Error('absolute-git-executable-required');
  if (!fullSha(value.candidateSha)) throw Error('full-candidate-sha-required');
  const { commands } = value;
  if (!Array.isArray(commands) || commands.length < 1 || commands.length > 32) throw Error('invalid-commands');
  for (const argv of commands) {
    if (!Array.isArray(argv) || argv.length < 1 || !argv[0] || argv.some(part => typeof part !== 'string' || part.includes('\0'))) throw Error('invalid-commands');
  }
  const timeoutMs = value.timeoutMs ?? 600000;
  const tailBytes = value.tailBytes ?? 2048;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 3600000) throw Error('invalid-timeout');
  if (!Number.isSafeInteger(tailBytes) || tailBytes < 256 || tailBytes > 65536) throw Error('invalid-tail-bytes');
  return { repository: value.repository, gitExecutable: value.gitExecutable, candidateSha: value.candidateSha, commands, timeoutMs, tailBytes };
}

function git(spec, args) {
  const binding = { repository: spec.repository, gitExecutable: spec.gitExecutable, timeoutMs: GIT_TIMEOUT_MS };
  return runGit(binding, args, Date.now() + GIT_TIMEOUT_MS, 1 << 20).toString('utf8');
}

const head = spec => git(spec, ['rev-parse', '--verify', 'HEAD^{commit}']).trim();
// Untracked files count as changes; ignored files (installed tooling) do not.
const clean = spec => git(spec, ['status', '--porcelain', '--untracked-files=all']).trim() === '';

function tail(limit) {
  let bytes = 0;
  let kept = Buffer.alloc(0);
  return {
    add(chunk) {
      bytes += chunk.length;
      kept = Buffer.concat([kept, chunk]);
      if (kept.length > limit) kept = kept.subarray(kept.length - limit);
    },
    result: () => ({ bytes, truncated: bytes > kept.length, tail: kept.toString('utf8') }),
  };
}

function runCommand(spec, argv) {
  // `node` resolves to the running Node so checks do not depend on PATH lookup.
  const file = argv[0] === 'node' ? process.execPath : argv[0];
  const out = tail(spec.tailBytes);
  const err = tail(spec.tailBytes);
  const outcome = (fields) => ({ argv, exitCode: null, signal: null, timedOut: false, ...fields, stdout: out.result(), stderr: err.result() });
  return new Promise(resolve => {
    let child;
    try {
      child = spawn(file, argv.slice(1), { cwd: spec.repository, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      resolve(outcome({ error: error.code ?? 'spawn-failed' }));
      return;
    }
    let timedOut = false;
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, spec.timeoutMs);
    child.stdout.on('data', chunk => out.add(chunk));
    child.stderr.on('data', chunk => err.add(chunk));
    child.on('error', error => { clearTimeout(timer); resolve(outcome({ timedOut, error: error.code ?? 'spawn-failed' })); });
    child.on('close', (exitCode, signal) => { clearTimeout(timer); resolve(outcome({ exitCode, signal, timedOut })); });
  });
}

const failed = check => check.exitCode !== 0 || check.timedOut || Boolean(check.error);

export async function runReviewChecks(input) {
  const spec = validateSpec(input);
  if (await realpath(spec.repository) !== spec.repository) throw Error('repository-not-canonical');
  if (head(spec) !== spec.candidateSha) throw Error('checkout-not-at-candidate');
  if (!clean(spec)) throw Error('checkout-not-clean');
  const checks = [];
  for (const argv of spec.commands) checks.push(await runCommand(spec, argv));
  if (head(spec) !== spec.candidateSha) throw Error('checkout-moved-during-checks');
  return {
    version: 1, status: 'ok', kind: KIND, candidateSha: spec.candidateSha, repository: spec.repository,
    cleanAfterChecks: clean(spec), passed: !checks.some(failed), checks,
  };
}

async function main(args) {
  if (args.length !== 2 || args[0] !== '--input') {
    process.stderr.write('Usage: node tools/review-checks.mjs --input <spec.json>\n');
    return 2;
  }
  try {
    const block = await runReviewChecks(JSON.parse(await readFile(args[1], 'utf8')));
    process.stdout.write(`${JSON.stringify(block, null, 2)}\n`);
    return block.passed ? 0 : 1;
  } catch (error) {
    process.stdout.write(`${JSON.stringify({ version: 1, status: 'error', kind: KIND, reason: error.message })}\n`);
    return 2;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === await realpath(process.argv[1]).catch(() => '')) process.exitCode = await main(process.argv.slice(2));
