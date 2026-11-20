#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { stateDirectory } from './project-state.mjs';

const COSTS = ['job', 'initiative', 'ci'];
// A tier runs the checks of its own cost and every cheaper one; `ci` checks run only in CI.
const TIER_COSTS = { job: ['job'], initiative: ['job', 'initiative'] };
const FILE_LIMIT = 1024 * 1024;
const TAIL_BYTES = 4096;
const OUTPUT_LIMIT = 16 * 1024 * 1024;
const ID = /^[a-z0-9][a-z0-9-]*$/u;
const REF = /^[^-\s][^\s]*$/u;
// Windows cannot start these without a shell, and a shell would make a check differ between platforms.
const LAUNCHER = /^(?:npm|npx)$|\.(?:cmd|bat)$/iu;

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = (code, message) => Object.assign(new Error(message ?? code), { code });
const git = (cwd, args) => spawnSync('git', args, { cwd, encoding: 'buffer', maxBuffer: FILE_LIMIT, windowsHide: true, timeout: 30000 });
const gitText = (cwd, args) => {
  const result = git(cwd, args);
  return result.status === 0 ? result.stdout.toString('utf8').trim() : undefined;
};

function parseArguments(argv) {
  const options = {};
  const flags = new Set(['--project', '--base', '--tier', '--only']);
  const switches = new Set(['--stale', '--allow-stale', '--table']);
  for (let index = 0; index < argv.length; index += 1) {
    if (switches.has(argv[index])) { options[argv[index].slice(2)] = true; continue; }
    if (!flags.has(argv[index]) || argv[index + 1] === undefined) throw fail('invalid-arguments', `unknown or incomplete argument: ${argv[index]}`);
    options[argv[index].slice(2)] = argv[index + 1];
    index += 1;
  }
  if (typeof options.project !== 'string' || !isAbsolute(options.project)) throw fail('invalid-project', '--project needs an absolute path');
  if (options.tier !== undefined && !Object.hasOwn(TIER_COSTS, options.tier)) throw fail('invalid-tier', '--tier is job or initiative');
  if (options.base !== undefined && !REF.test(options.base)) throw fail('invalid-base');
  if (options.tier === undefined && options.only === undefined && !options.stale && !options.table) throw fail('tier-required', 'pass --tier job|initiative, --only <id> or --table');
  return options;
}

// A project-relative path spelled one way, with `/` and no `.` or `..` segment, so equal paths compare equal.
const isCanonicalPath = path => !isAbsolute(path) && !/^[A-Za-z]:|\\/u.test(path) && path.split('/').every(segment => segment !== '' && segment !== '.' && segment !== '..');

const isStrings = value => Array.isArray(value) && value.every(item => typeof item === 'string');

/** Returns the `derivedFrom` entries and checks of an `isswf.verification` schemaVersion 1 file, or throws `verification-invalid` naming the first fault. */
function parseVerification(bytes) {
  const invalid = reason => fail('verification-invalid', `verification file is invalid: ${reason}`);
  let file;
  try { file = JSON.parse(bytes.toString('utf8')); } catch { throw invalid('not JSON'); }
  if (file?.schemaVersion !== 1) throw invalid('schemaVersion must be 1');
  if (!Array.isArray(file.derivedFrom) || !file.derivedFrom.every(entry => typeof entry?.path === 'string' && isCanonicalPath(entry.path) &&/^[0-9a-f]{64}$/u.test(entry.sha256))) throw invalid('derivedFrom needs {path, sha256} entries');
  if (!Array.isArray(file.checks)) throw invalid('checks must be an array');
  const seen = new Set();
  for (const entry of file.checks) {
    const id = entry?.id;
    if (typeof id !== 'string' || !ID.test(id) || seen.has(id)) throw invalid(`check id ${JSON.stringify(id)} is missing, malformed or repeated`);
    seen.add(id);
    if (!isStrings(entry.argv) || entry.argv[0] === undefined || entry.argv[0] === '') throw invalid(`${id}: argv must be an array of strings with a command first`);
    if (!isStrings(entry.platforms) || entry.platforms.length === 0) throw invalid(`${id}: platforms must be a non-empty array of process.platform names`);
    if (!COSTS.includes(entry.cost)) throw invalid(`${id}: cost must be one of ${COSTS.join(', ')}`);
    if (!isStrings(entry.covers)) throw invalid(`${id}: covers must be an array of paths`);
    if (!Number.isInteger(entry.timeoutSeconds) || entry.timeoutSeconds < 1 || entry.timeoutSeconds > 3600) throw invalid(`${id}: timeoutSeconds must be an integer from 1 to 3600`);
  }
  return file;
}

/** Hashes each `derivedFrom` path in the working tree; a changed or missing file is stale (`current: null` when missing). */
function staleEntries(derivedFrom, project) {
  const stale = [];
  for (const { path, sha256: recorded } of derivedFrom) {
    let current = null;
    try { current = sha256(readFileSync(resolve(project, path))); } catch (error) { if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw fail('derivedfrom-unreadable', `${path} cannot be read: ${error.code ?? error.message}`); }
    if (current !== recorded) stale.push({ path, recorded, current });
  }
  return stale;
}

const tail = bytes => (bytes ?? Buffer.alloc(0)).subarray(-TAIL_BYTES).toString('utf8');

function execute(check, project) {
  const [command, ...args] = check.argv;
  if (LAUNCHER.test(command)) return { status: 'refused', exitCode: null, message: `${command} needs a shell on Windows; call \`node <cli.js>\` instead` };
  const started = Date.now();
  const result = spawnSync(command === 'node' ? process.execPath : command, args, {
    cwd: project, shell: false, windowsHide: true, encoding: 'buffer', maxBuffer: OUTPUT_LIMIT, timeout: check.timeoutSeconds * 1000, stdio: ['ignore', 'pipe', 'pipe'],
  });
  const outcome = { exitCode: result.status, durationMs: Date.now() - started, stdoutTail: tail(result.stdout), stderrTail: tail(result.stderr) };
  if (result.error?.code === 'ENOENT') return { ...outcome, status: 'unavailable', message: `${command} was not found` };
  if (result.error?.code === 'ETIMEDOUT') return { ...outcome, status: 'timeout', message: `stopped after ${check.timeoutSeconds} s` };
  if (result.error) return { ...outcome, status: 'failed', message: result.error.message };
  return { ...outcome, status: result.status === 0 ? 'passed' : 'failed' };
}

/** Resolves the candidate and base commits and reads the approved verification file at the base. */
function readApproved(options) {
  const project = resolve(options.project);
  const candidate = gitText(project, ['rev-parse', '--verify', 'HEAD^{commit}']);
  if (candidate === undefined) throw fail('not-a-repository');
  const base = options.base === undefined
    ? gitText(project, ['merge-base', 'HEAD', 'refs/remotes/origin/main'])
    : gitText(project, ['rev-parse', '--verify', `${options.base}^{commit}`]);
  if (base === undefined || base === '') throw fail('base-not-found', 'the base ref does not resolve; pass --base <ref>');
  // The checks are read at the base, so the candidate cannot rewrite the checks that judge it.
  let state;
  try { state = stateDirectory(project); } catch (error) { throw fail('state-not-found', error.message); }
  const path = `${state}/verification.json`;
  const blob = git(project, ['show', `${base}:${path}`]);
  if (blob.status !== 0) throw fail('verification-not-found', `${path} is not committed at the base`);
  return { project, candidate, base, path, blob };
}

// First matching class wins, so a cover path counts for one row; a path matching none is code.
const PATH_CLASSES = [
  ['E2E harness', path => /(?:^|\/)e2e(?:\/|-|\.|$)/iu.test(path)],
  ['packaging or CI', path => /^(?:\.github\/|package(?:-lock)?\.json$|\.claude-plugin\/)/u.test(path)],
  ['docs or records only', path => /^(?:docs\/|[^/]+\.md$|\.factory\/|\.isswf\/)/u.test(path)],
  ['tests', path => /^tests?\//u.test(path)],
  ['code', () => true],
];

/** Renders the checks as a Markdown table keyed by path class; the initiative-close row lists the initiative tier, and `ci` checks run only in CI. */
function renderTable(checks) {
  const label = check => `${check.id} (${check.cost})`;
  const rowFor = (name, chosen) => `| ${name} | ${chosen.length ? chosen.map(label).join(', ') : 'none'} |`;
  const rows = PATH_CLASSES.map(([name], index) => rowFor(name, checks.filter(check => check.covers.some(path => PATH_CLASSES.findIndex(([, matches]) => matches(path)) === index))));
  rows.push(rowFor('initiative close', checks.filter(check => TIER_COSTS.initiative.includes(check.cost))));
  return ['| Path class | Checks (cost) |', '| --- | --- |', ...rows].join('\n');
}

/** Runs the checks the base ref approved for this platform and returns one stamp-ready result per check. */
function verify(options) {
  const { project, candidate, base, path, blob } = readApproved(options);
  const { checks } = parseVerification(blob.stdout);
  // Staleness compares the candidate's own derivedFrom, so a branch that refreshes the file is fresh; the base file falls back when the candidate has none.
  let candidateFile;
  try { candidateFile = readFileSync(resolve(project, path)); } catch (error) { if (error.code !== 'ENOENT') throw fail('verification-invalid', `${path} cannot be read: ${error.code ?? error.message}`); }
  const { derivedFrom } = candidateFile === undefined ? parseVerification(blob.stdout) : parseVerification(candidateFile);
  const stale = staleEntries(derivedFrom, project);
  if (options.stale) return { ok: stale.length === 0, ...(stale.length ? { code: 'stale' } : {}), base, stale, results: [] };
  if (options.only !== undefined && !checks.some(entry => entry.id === options.only)) throw fail('check-not-found', `no check ${options.only}`);
  const dirty = (gitText(project, ['status', '--porcelain']) ?? '') !== '';
  const verificationSha256 = sha256(blob.stdout);
  const selected = options.only === undefined ? checks : checks.filter(entry => entry.id === options.only);
  const results = selected.map(check => {
    const stamp = { checkId: check.id, platform: process.platform, argvSha256: sha256(JSON.stringify(check.argv)), candidate, dirty, verificationSha256 };
    const applies = check.platforms.includes(process.platform) && (options.only !== undefined || TIER_COSTS[options.tier].includes(check.cost));
    return { ...stamp, ...(applies ? execute(check, project) : { status: 'not run', exitCode: null }) };
  });
  const refused = stale.length > 0 && !options['allow-stale'];
  return { ok: !refused, ...(refused ? { code: 'stale', message: 'verification.json is stale; refresh it from its derivedFrom files or pass --allow-stale' } : {}), base, tier: options.tier ?? null, stale, results };
}

const FAILURES = new Set(['failed', 'timeout', 'refused', 'unavailable']);

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.table) {
      console.log(renderTable(parseVerification(readApproved(options).blob.stdout).checks));
    } else {
      const report = verify(options);
      console.log(JSON.stringify(report, null, 2));
      // 1 for a failed check, 2 for staleness alone.
      process.exitCode = report.results.some(result => FAILURES.has(result.status)) ? 1 : report.ok ? 0 : 2;
    }
  } catch (error) {
    if (!error.code) throw error;
    console.log(JSON.stringify({ ok: false, code: error.code, message: error.message }, null, 2));
    process.exitCode = 1;
  }
}
