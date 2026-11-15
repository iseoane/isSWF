import { spawnSync } from 'node:child_process';
import { lstat, readdir, realpath } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runGit } from './git-evidence.mjs';
import { planErrorDetail } from './isswf-plan-core.mjs';
import { isIdentifier } from './isswf-plan-edit-core.mjs';
import { nextRecordId, recordError } from './isswf-record-new-core.mjs';
import { stateDirectory } from './project-state.mjs';

const GIT_TIMEOUT_MS = 20000;
const GIT_MAX_BUFFER = 16 * 1024 * 1024;

async function locateGit() {
  const locator = process.platform === 'win32' ? 'where.exe' : 'which';
  const found = spawnSync(locator, ['git'], { encoding: 'utf8', windowsHide: true }).stdout?.trim().split(/\r?\n/u)[0];
  if (!found) throw recordError('git-not-found');
  return realpath(found);
}

/** Runs Git in `project` through the shared runner with literal pathspecs and returns its stdout as text. */
async function gitIn(project) {
  const binding = { repository: project, gitExecutable: await locateGit(), timeoutMs: GIT_TIMEOUT_MS };
  return args => runGit(binding, args, Date.now() + GIT_TIMEOUT_MS, GIT_MAX_BUFFER, { GIT_LITERAL_PATHSPECS: '1' }).toString('utf8');
}

async function jobTarget({ project, initiative, job }) {
  if (typeof project !== 'string' || !isAbsolute(project)) throw recordError('invalid-project');
  if (!/^I\d+$/u.test(initiative ?? '')) throw recordError('invalid-initiative');
  if (!isIdentifier(job ?? '')) throw recordError('invalid-job');
  const root = resolve(project), state = stateDirectory(root);
  // A mistyped project must not be mistaken for a project whose job has no records yet.
  if (!(await lstat(join(root, state)).catch(() => undefined))?.isDirectory()) throw recordError('state-not-found');
  return { root, relative: `${state}/initiatives/${initiative}/jobs/${job}` };
}

const childNames = (output, prefix) => output.split('\0').filter(path => path.startsWith(prefix) && !path.slice(prefix.length).includes('/')).map(path => path.slice(prefix.length));

/** Every file name the job directory has in the working tree, the index, HEAD and each local and remote-tracking branch. */
async function recordNames({ root, relative }) {
  const git = await gitIn(root);
  const directory = `${relative}/`;
  const names = new Set((await readdir(join(root, relative)).catch(() => [])));
  for (const name of childNames(git(['ls-files', '-z', '--', directory]), directory)) names.add(name);
  const tips = new Set(git(['for-each-ref', '--format=%(objectname)%00', 'refs/heads', 'refs/remotes']).split('\0').map(line => line.trim()).filter(Boolean));
  // HEAD may be unborn, and a detached HEAD is on no branch.
  try { tips.add(git(['rev-parse', '--verify', '-q', 'HEAD^{commit}']).trim()); } catch { /* no commit yet */ }
  for (const tip of tips) for (const name of childNames(git(['ls-tree', '-z', '--name-only', tip, '--', directory]), directory)) names.add(name);
  return names;
}

/** The next unused record ID of `kind` for the job. */
export async function nextId({ project, initiative, job, kind }) {
  const target = await jobTarget({ project, initiative, job });
  return nextRecordId(kind, await recordNames(target));
}

const commands = {
  next: ['--project', '--initiative', '--job', '--kind'],
};

/** Parses `<command> --flag VALUE ...`; every flag is required and none repeats. */
function parseArgs([command, ...parts]) {
  const flags = commands[command];
  if (!flags) throw recordError('usage');
  const args = {};
  for (let i = 0; i < parts.length; i += 2) {
    const [flag, value] = [parts[i], parts[i + 1]];
    if (!flags.includes(flag) || value === undefined || Object.hasOwn(args, flag)) throw recordError('usage');
    args[flag] = value;
  }
  if (flags.some(flag => args[flag] === undefined)) throw recordError('usage');
  return { command, args };
}

async function run(argv) {
  const { args } = parseArgs(argv);
  const id = await nextId({ project: args['--project'], initiative: args['--initiative'], job: args['--job'], kind: args['--kind'] });
  return { ok: true, initiative: args['--initiative'], job: args['--job'], kind: args['--kind'], id };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await run(process.argv.slice(2)))); }
  catch (error) { console.log(JSON.stringify({ ok: false, ...planErrorDetail(error) })); process.exitCode = 1; }
}
