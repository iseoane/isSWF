import { spawnSync } from 'node:child_process';
import { lstat, readdir, readFile } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkRecord } from './isswf-record-check-core.mjs';

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

// A record is new when the base commit has no file at its project-relative path. A base that is not a commit refuses.
function newAt(project, base) {
  const git = (...args) => spawnSync('git', ['-C', project, ...args], { encoding: 'utf8', timeout: 15000 });
  if (git('rev-parse', '--verify', '--quiet', `${base}^{commit}`).status !== 0) throw Error(`--base is not a commit: ${base}`);
  return path => git('cat-file', '-e', `${base}:${relative(project, path).split(sep).join('/')}`).status !== 0;
}

async function checkFile(project, file, isNew) {
  const path = resolve(file);
  const inside = relative(project, path);
  if (!isAbsolute(file) || inside === '' || inside === '..' || inside.startsWith(`..${sep}`) || isAbsolute(inside)) throw Error(`file must be an absolute path inside the project: ${file}`);
  const stat = await lstat(path);
  if (!stat.isFile() || stat.size > MAX_BYTES) throw Error(`file must be a regular file of at most ${MAX_BYTES} bytes: ${file}`);
  const jobFiles = basename(path) === 'plan.md' ? await jobFilesFor(path) : undefined;
  return { file: path, ...checkRecord({ path, text: await readFile(path, 'utf8'), jobFiles, newRecord: isNew?.(path) }) };
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
