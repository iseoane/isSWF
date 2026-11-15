import { createHash, randomBytes } from 'node:crypto';
import { link, lstat, mkdir, open, readFile, rename, unlink } from 'node:fs/promises';
import { basename, dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planErrorDetail } from './isswf-plan-core.mjs';
import { addJob, appendEvidence, isIdentifier, newPlan, setField } from './isswf-plan-edit-core.mjs';
import { stateDirectory } from './project-state.mjs';

const MAX_BYTES = 1024 * 1024;
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const fail = code => Object.assign(Error(code), { code });

async function writeSynced(path, text) {
  const file = await open(path, 'wx');
  try { await file.writeFile(text); await file.sync(); } finally { await file.close(); }
}

async function syncDirectory(path) {
  // Windows rejects directory-handle sync; regular-file sync remains mandatory.
  if (process.platform === 'win32') return;
  const directory = await open(path, 'r');
  try { await directory.sync(); } finally { await directory.close(); }
}

async function planPath(project, initiative) {
  if (!isAbsolute(project)) throw fail('invalid-project');
  if (!isIdentifier(initiative)) throw fail('invalid-initiative');
  const root = resolve(project), state = stateDirectory(root);
  // A mistyped project or an uninitialised one must not grow a new tree, so the state directory has to exist already.
  if (!(await lstat(join(root, state)).catch(() => undefined))?.isDirectory()) throw fail('state-not-found');
  return join(root, state, 'initiatives', initiative, 'plan.md');
}

/**
 * Applies `edit` (plan text to plan text) to the initiative's plan: a temporary file in the same directory, then a rename over the plan.
 * The rename is refused when the plan's SHA-256 is no longer the one read. `beforeRename` lets a test act in that window; a writer that
 * lands between the check and the rename is still not detected, because the filesystem offers no compare-and-rename.
 */
export async function editPlanFile({ project, initiative, edit, beforeRename }) {
  const path = await planPath(project, initiative);
  const stat = await lstat(path).catch(error => { throw error.code === 'ENOENT' ? fail('plan-not-found') : error; });
  if (!stat.isFile() || stat.size > MAX_BYTES) throw fail('unsafe-plan');
  const original = await readFile(path);
  const text = original.toString('utf8');
  // Bytes that are not UTF-8 would not survive the round trip, so the edit would change lines it never touched.
  if (!Buffer.from(text).equals(original)) throw fail('unsafe-plan');
  const next = edit(text);
  const temp = join(dirname(path), `.plan.md.${randomBytes(6).toString('hex')}.tmp`);
  try {
    await writeSynced(temp, next);
    await beforeRename?.();
    const now = await readFile(path).catch(() => undefined);
    if (!now || sha256(now) !== sha256(original)) throw fail('plan-changed');
    await rename(temp, path);
  } catch (error) { await unlink(temp).catch(() => {}); throw error; }
  await syncDirectory(dirname(path));
}

/** Creates a file that must not exist: the whole text goes to a temporary file, and `link` publishes it only if nothing is at `path`; an existing file fails with `existsCode`. */
export async function createExclusive({ path, text, existsCode, beforeLink }) {
  const temp = join(dirname(path), `.${basename(path)}.${randomBytes(6).toString('hex')}.tmp`);
  try {
    await writeSynced(temp, text);
    await beforeLink?.();
    await link(temp, path).catch(error => { throw error.code === 'EEXIST' ? fail(existsCode) : error; });
  } finally { await unlink(temp).catch(() => {}); }
  await syncDirectory(dirname(path));
}

/** Creates a plan that must not exist. */
export async function createPlanFile({ project, initiative, text, beforeLink }) {
  const path = await planPath(project, initiative);
  await mkdir(dirname(path), { recursive: true });
  await createExclusive({ path, text, existsCode: 'plan-exists', beforeLink });
}

const common = ['--project', '--initiative'];
const jobFlags = ['--job', '--objective', '--depends-on', '--size', '--next-step', '--acceptance'];
const commands = {
  set: [...common, '--job', '--field', '--value'],
  'append-evidence': [...common, '--job', '--value'],
  'add-job': [...common, ...jobFlags],
  'new-plan': [...common, '--title', '--type', ...jobFlags],
};

/** Parses `<command> --flag VALUE ...`; every flag is required and only `--acceptance` repeats. */
function parseArgs([command, ...parts]) {
  const flags = commands[command];
  if (!flags) throw fail('usage');
  const args = {};
  for (let i = 0; i < parts.length; i += 2) {
    const [flag, value] = [parts[i], parts[i + 1]];
    if (!flags.includes(flag) || value === undefined || (flag !== '--acceptance' && Object.hasOwn(args, flag))) throw fail('usage');
    if (flag === '--acceptance') (args[flag] ??= []).push(value); else args[flag] = value;
  }
  if (flags.some(flag => args[flag] === undefined)) throw fail('usage');
  return { command, args };
}

const jobSpec = args => ({ job: args['--job'], objective: args['--objective'], dependsOn: args['--depends-on'] === 'None' ? [] : args['--depends-on'].split(',').map(dep => dep.trim()), size: args['--size'], nextStep: args['--next-step'], acceptance: args['--acceptance'] });

async function run(argv) {
  const { command, args } = parseArgs(argv);
  const target = { project: args['--project'], initiative: args['--initiative'] };
  if (command === 'set') await editPlanFile({ ...target, edit: text => setField(text, { job: args['--job'], field: args['--field'], value: args['--value'] }) });
  else if (command === 'append-evidence') await editPlanFile({ ...target, edit: text => appendEvidence(text, { job: args['--job'], value: args['--value'] }) });
  else if (command === 'add-job') await editPlanFile({ ...target, edit: text => addJob(text, jobSpec(args)) });
  else await createPlanFile({ ...target, text: newPlan({ initiative: target.initiative, title: args['--title'], type: args['--type'], ...jobSpec(args) }) });
  return { ok: true, initiative: target.initiative, job: args['--job'], action: command };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { console.log(JSON.stringify(await run(process.argv.slice(2)))); }
  catch (error) { console.log(JSON.stringify({ ok: false, ...planErrorDetail(error), ...(error.planError && { planError: error.planError }) })); process.exitCode = 1; }
}
