#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
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
const LAUNCHER = /^(?:(?:npm|npx)(?:\.(?:cmd|bat|exe))?|.*\.(?:cmd|bat))$/iu;
// The basename is taken with both separators so the same argv is judged alike on every platform.
const isLauncher = command => LAUNCHER.test(command.split(/[\\/]/u).pop());

const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = (code, message) => Object.assign(new Error(message ?? code), { code });
const git = (cwd, args) => spawnSync('git', args, { cwd, encoding: 'buffer', maxBuffer: FILE_LIMIT, windowsHide: true, timeout: 30000, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } });
const gitText = (cwd, args) => {
  const result = git(cwd, args);
  return result.status === 0 ? result.stdout.toString('utf8').trim() : undefined;
};

function parseArguments(argv) {
  const options = {};
  const flags = new Set(['--project', '--base', '--tier', '--only', '--record']);
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
  if (options.tier === undefined && options.only === undefined && !options.stale && !options.table) throw fail('tier-required', 'pass --tier job|initiative, --only <id>, --stale or --table');
  if (options.record !== undefined) {
    if (options.tier !== 'initiative' || options.only !== undefined || options.stale || options.table || options['allow-stale']) throw fail('record-needs-initiative-tier', '--record needs --tier initiative, without --only, --stale, --allow-stale or --table');
    if (!/^I\d+$/u.test(options.record)) throw fail('invalid-initiative', '--record needs an initiative ID such as I0001');
  }
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
  if (!Array.isArray(file.derivedFrom) || !file.derivedFrom.every(entry => typeof entry?.path === 'string' && isCanonicalPath(entry.path) && /^[0-9a-f]{64}$/u.test(entry.sha256))) throw invalid('derivedFrom needs {path, sha256} entries');
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
  if (isLauncher(command)) return { status: 'refused', exitCode: null, message: `${command} needs a shell on Windows; call \`node <cli.js>\` instead` };
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
  return { project, candidate, base, path, blob, state };
}

// First matching class wins, so a cover path counts for one row; a path matching none is code.
const PATH_CLASSES = [
  ['E2E harness', path => /(?:^|\/)e2e(?:\/|-|\.|$)/iu.test(path)],
  ['packaging or CI', path => /^(?:\.github\/|package(?:-lock)?\.json$|\.claude-plugin\/)/u.test(path)],
  ['docs or records only', path => /^(?:docs\/|[^/]+\.md$|\.factory\/|\.isswf\/)/u.test(path)],
  ['tests', path => /^tests?\//u.test(path)],
  ['code', () => true],
];

/** Renders the checks as a Markdown table keyed by path class; the initiative-close row lists every check, because `--record` runs the `ci` ones too. */
function renderTable(checks) {
  const label = check => `${check.id} (${check.cost})`;
  const rowFor = (name, chosen) => `| ${name} | ${chosen.length ? chosen.map(label).join(', ') : 'none'} |`;
  const rows = PATH_CLASSES.map(([name], index) => rowFor(name, checks.filter(check => check.covers.some(path => PATH_CLASSES.findIndex(([, matches]) => matches(path)) === index))));
  rows.push(rowFor('initiative close', checks));
  return ['| Path class | Checks (cost) |', '| --- | --- |', ...rows].join('\n');
}

const RECORD_SCHEMA = 'isswf.close-verification';

/**
 * Records that this head passed the checks of its tier, in the store under the common git directory that every worktree of the repository shares; the integration gate reads it.
 * Nothing is written for a dirty or unknown tree, a stale manifest or a check that failed or did not run where it should have (a platform skip is fine), so a stamp
 * means the whole tier ran clean at exactly this commit. A write fault is reported on stderr and never changes the run's result.
 */
function writeStamp({ project, candidate, tier, costs, selected, results, verificationSha256 }) {
  const ran = selected.every((check, index) => !costs.includes(check.cost) || !check.platforms.includes(process.platform) || results[index].status === 'passed');
  const common = gitText(project, ['rev-parse', '--git-common-dir']);
  const tree = gitText(project, ['rev-parse', 'HEAD^{tree}']);
  if (!ran || common === undefined || tree === undefined) return;
  const directory = join(resolve(project, common), 'isswf', 'verification-stamps');
  try {
    mkdirSync(directory, { recursive: true });
    const stamp = { candidate, tree, platform: process.platform, tier, verificationSha256, checks: results.map(({ checkId, status }) => ({ id: checkId, status })) };
    writeFileSync(join(directory, `${candidate}.json`), `${JSON.stringify(stamp, null, 2)}
`);
  } catch (error) {
    console.error(`could not write the verification stamp: ${error.message}`);
  }
}

/** The initiative's record directory, or a refusal when it is missing or the tree outside the initiatives is not clean at the verified head. */
function closeRecordTarget(options, project, state) {
  const directory = `${state}/initiatives/${options.record}`;
  let found = false;
  try { found = statSync(resolve(project, directory)).isDirectory(); } catch { /* reported below */ }
  if (!found) throw fail('initiative-not-found', `${directory} does not exist`);
  // Records are the one place a run may leave changes; a tracked change elsewhere would make the verified head differ from the tree that ran. Untracked files are the operator's and are ignored.
  const outside = gitText(project, ['status', '--porcelain', '--untracked-files=no', '--', '.', `:(exclude)${state}/initiatives`]);
  if (outside !== '') throw fail('dirty-tree', 'commit or stash tracked changes outside the initiatives directory before recording a close verification');
  return `${directory}/close-verification.json`;
}

/**
 * The up-front warning for an initiative-tier run on Windows: the checks of these costs that are not approved for this platform will be "not run", and the close gate refuses a record that lists them.
 * Returns undefined when nothing is skipped, so other platforms and the job tier stay silent.
 */
export function platformNotice({ selected, costs, platform }) {
  if (platform !== 'win32') return undefined;
  const skipped = selected.filter(check => costs.includes(check.cost) && check.cost !== 'job' && !check.platforms.includes(platform));
  if (!skipped.length) return undefined;
  return `on win32 these checks will be "not run": ${skipped.map(check => check.id).join(', ')}; the close gate refuses a record that lists them. Record a passing CI run instead: write <state directory>/initiatives/<ID>/close-verification.json with the same fields as a local record (schema "isswf.close-verification", schemaVersion 1, initiative, head, verificationSha256, checks as {id, status} all passed) but source "ci", plus the run's runUrl and its head SHA, then commit it and the plan.`;
}

/** Runs the checks the base ref approved for this platform and returns one stamp-ready result per check. With `record`, runs every cost and writes the initiative's close record. */
function verify(options) {
  const { project, candidate, base, path, blob, state } = readApproved(options);
  const { checks } = parseVerification(blob.stdout);
  // Staleness compares the candidate's own derivedFrom, so a branch that refreshes the file is fresh; the base file falls back when the candidate has none.
  let candidateFile;
  try { candidateFile = readFileSync(resolve(project, path)); } catch (error) { if (error.code !== 'ENOENT') throw fail('verification-invalid', `${path} cannot be read: ${error.code ?? error.message}`); }
  const { derivedFrom } = candidateFile === undefined ? parseVerification(blob.stdout) : parseVerification(candidateFile);
  const stale = staleEntries(derivedFrom, project);
  if (options.stale) return { ok: stale.length === 0, ...(stale.length ? { code: 'stale' } : {}), base, stale, results: [] };
  if (options.only !== undefined && !checks.some(entry => entry.id === options.only)) throw fail('check-not-found', `no check ${options.only}`);
  // A status that fails or overflows is unknown, so the stamp says `null` rather than claiming a clean tree.
  const status = gitText(project, ['status', '--porcelain']);
  const dirty = status === undefined ? null : status !== '';
  const verificationSha256 = sha256(blob.stdout);
  const recordPath = options.record === undefined ? undefined : closeRecordTarget(options, project, state);
  // A stale manifest means the approved checks may not match the project, so a record run stops before it spends any check.
  if (recordPath !== undefined && stale.length > 0) return { ok: false, code: 'stale', message: 'verification.json is stale; refresh it from its derivedFrom files before recording', base, tier: options.tier, stale, results: [] };
  const costs = options.record === undefined ? TIER_COSTS[options.tier] : COSTS;
  const selected = options.only === undefined ? checks : checks.filter(entry => entry.id === options.only);
  const notice = options.tier === 'initiative' ? platformNotice({ selected, costs, platform: process.platform }) : undefined;
  if (notice) console.error(notice);
  const results = selected.map(check => {
    const stamp = { checkId: check.id, platform: process.platform, argvSha256: sha256(JSON.stringify(check.argv)), candidate, dirty, verificationSha256 };
    const applies = check.platforms.includes(process.platform) && (options.only !== undefined || costs.includes(check.cost));
    return { ...stamp, ...(applies ? execute(check, project) : { status: 'not run', exitCode: null }) };
  });
  const refused = stale.length > 0 && !options['allow-stale'];
  if (recordPath !== undefined && !refused) {
    const record = { schema: RECORD_SCHEMA, schemaVersion: 1, source: 'local', initiative: options.record, head: candidate, verificationSha256, checks: results.map(({ checkId, status }) => ({ id: checkId, status })) };
    writeFileSync(resolve(project, recordPath), `${JSON.stringify(record, null, 2)}\n`);
  }
  if (!refused && dirty === false && options.tier !== undefined && options.only === undefined && stale.length === 0) writeStamp({ project, candidate, tier: options.tier, costs, selected, results, verificationSha256 });
  return { ok: !refused, ...(refused ? { code: 'stale', message: 'verification.json is stale; refresh it from its derivedFrom files or pass --allow-stale' } : {}), base, tier: options.tier ?? null, ...(recordPath !== undefined && !refused ? { record: recordPath } : {}), stale, results };
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
      // 1 for a failed check, or for a recorded check that did not run (the close gate refuses that record), 2 for staleness alone.
      const unrun = report.record === undefined ? [] : report.results.filter(result => result.status === 'not run');
      if (unrun.length) console.error(`the close record lists checks that did not run: ${unrun.map(result => result.checkId).join(', ')}; the close gate refuses it until a passing CI run or a run on a platform where they run is recorded`);
      process.exitCode = report.results.some(result => FAILURES.has(result.status)) || unrun.length ? 1 : report.ok ? 0 : 2;
    }
  } catch (error) {
    if (!error.code) throw error;
    console.log(JSON.stringify({ ok: false, code: error.code, message: error.message }, null, 2));
    process.exitCode = 1;
  }
}
