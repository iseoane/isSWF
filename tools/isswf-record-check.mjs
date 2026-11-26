import { spawnSync } from 'node:child_process';
import { lstat, readdir, readFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { NOTE_DIR, parseNote } from './isswf-compaction-core.mjs';
import { checkRecord, reportedChecks } from './isswf-record-check-core.mjs';
import { attemptUsages, briefNote, commandNotes, compareBrief } from './isswf-run-usage-core.mjs';
import { RECORD_NAME } from './isswf-snapshot-core.mjs';
import { nodeFs } from './isswf-snapshot.mjs';

const MAX_BYTES = 1024 * 1024;

// A plan is checked against the files in each job directory next to it; a missing directory is no listing.
async function jobFilesFor(planPath) {
  const jobsDir = join(dirname(planPath), 'jobs');
  const jobFiles = {};
  let jobs = [];
  try { jobs = (await readdir(jobsDir, { withFileTypes: true })).filter(entry => entry.isDirectory()); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const { name } of jobs) jobFiles[name] = (await readdir(join(jobsDir, name), { withFileTypes: true })).filter(entry => entry.isFile()).map(entry => entry.name);
  return jobFiles;
}

// A record is new when the base commit has no file at its project-relative path (`./` resolves from the project, which may sit below the repository top level). A base that is not a commit refuses.
function newAt(project, base) {
  const git = (...args) => spawnSync('git', ['-C', project, ...args], { encoding: 'utf8', timeout: 15000, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } });
  if (git('rev-parse', '--verify', '--quiet', `${base}^{commit}`).status !== 0) throw Error(`--base is not a commit: ${base}`);
  return path => git('cat-file', '-e', `${base}:./${relative(project, path).split(sep).join('/')}`).status !== 0;
}

// Non-blocking notes for an attempt record: the methodology its brief names that its runs never read (only when it cites a brief; a failure
// to compare leaves no such note), and the checks it reports as run that its runs never ran (also when no transcript resolves).
async function notesFor(project, path, text) {
  if (!/^A\d{3}\.md$/u.test(basename(path))) return [];
  const checks = reportedChecks(text);
  const round = /^\W*brief\b.*brief-r(\d+)\.md/imu.exec(text)?.[1];
  if (!checks.length && !round) return [];
  try {
    const claudeDir = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
    const piDir = process.env.PI_CODING_AGENT_DIR || join(homedir(), '.pi', 'agent');
    const usages = await attemptUsages(text, { fs: nodeFs, claudeDir, piDir, project });
    const briefText = round ? await readFile(join(dirname(path), `brief-r${round}.md`), 'utf8').catch(() => undefined) : undefined;
    return [briefText === undefined ? undefined : briefNote(compareBrief(briefText, usages)), ...commandNotes(checks, usages)].filter(Boolean);
  } catch { return []; }
}

// The accepted dispatches every Claude session note holds; a missing directory is no launch. Pi keeps its dispatches in the running extension, so it has none here.
async function launchesFor() {
  const dir = join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), ...NOTE_DIR);
  const launches = [];
  try { for (const name of await readdir(dir)) launches.push(...(parseNote(await readFile(join(dir, name), 'utf8').catch(() => '')) ?? [])); } catch { /* no notes */ }
  return launches.filter(({ run }) => run);
}

// The other records of the job directory, read only when a launch could make this record's missing line matter.
async function siblingsOf(path) {
  const own = basename(path);
  const dir = dirname(path);
  try { return await Promise.all((await readdir(dir)).filter(name => RECORD_NAME.test(name) && name !== own).map(name => readFile(join(dir, name), 'utf8'))); } catch { return []; }
}

async function checkFile(project, file, isNew) {
  const path = resolve(file);
  const inside = relative(project, path);
  if (!isAbsolute(file) || inside === '' || inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) throw Error(`file must be an absolute path inside the project: ${file}`);
  const stat = await lstat(path);
  if (!stat.isFile() || stat.size > MAX_BYTES) throw Error(`file must be a regular file of at most ${MAX_BYTES} bytes: ${file}`);
  const jobFiles = basename(path) === 'plan.md' ? await jobFilesFor(path) : undefined;
  const text = await readFile(path, 'utf8');
  const notes = await notesFor(project, path, text);
  const launches = RECORD_NAME.test(basename(path)) ? await launchesFor() : [];
  return { file: path, ...checkRecord({ path, text, jobFiles, newRecord: isNew?.(path), ...(launches.length && { launches, siblings: await siblingsOf(path) }) }), ...(notes.length && { notes }) };
}

/** Parses `--project ABS [--base REV] --file ABS [--file ABS ...]`. */
function parseArgs(parts) {
  const args = { files: [] };
  for (let i = 0; i < parts.length; i += 2) {
    const [flag, value] = [parts[i], parts[i + 1]];
    if (!value || !['--project', '--file', '--base'].includes(flag) || (flag !== '--file' && args[flag.slice(2)])) throw Error('usage: --project ABS [--base REV] --file ABS [--file ABS ...]');
    if (flag === '--file') args.files.push(value);
    else args[flag.slice(2)] = value;
  }
  if (!args.project || !isAbsolute(args.project) || !args.files.length) throw Error('absolute --project and at least one --file required');
  return args;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { project, base, files } = parseArgs(process.argv.slice(2));
    const isNew = base === undefined ? undefined : newAt(resolve(project), base);
    const results = [];
    for (const file of files) results.push(await checkFile(resolve(project), file, isNew));
    console.log(JSON.stringify({ ok: results.every(({ ok }) => ok), files: results }, null, 2));
    if (results.some(({ ok }) => !ok)) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
