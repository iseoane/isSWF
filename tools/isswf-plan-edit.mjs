import { randomBytes } from 'node:crypto';
import { lstat, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { planErrorDetail } from './isswf-plan-core.mjs';
import { addJob, appendEvidence, isIdentifier, newPlan, setField } from './isswf-plan-edit-core.mjs';
import { stateDirectory } from './project-state.mjs';

const MAX_BYTES = 1024 * 1024;
const fail = code => Object.assign(Error(code), { code });

function planPath(project, initiative) {
  if (!isAbsolute(project)) throw fail('invalid-project');
  if (!isIdentifier(initiative)) throw fail('invalid-initiative');
  return join(resolve(project), stateDirectory(resolve(project)), 'initiatives', initiative, 'plan.md');
}

/** Applies `edit` (plan text to plan text) to the initiative's plan: a temporary file in the same directory, then a rename over the plan. */
export async function editPlanFile({ project, initiative, edit }) {
  const path = planPath(project, initiative);
  const stat = await lstat(path).catch(error => { throw error.code === 'ENOENT' ? fail('plan-not-found') : error; });
  if (!stat.isFile() || stat.size > MAX_BYTES) throw fail('unsafe-plan');
  const original = await readFile(path);
  const text = original.toString('utf8');
  // Bytes that are not UTF-8 would not survive the round trip, so the edit would change lines it never touched.
  if (!Buffer.from(text).equals(original)) throw fail('unsafe-plan');
  const next = edit(text);
  const temp = join(dirname(path), `.plan.md.${randomBytes(6).toString('hex')}.tmp`);
  try {
    await writeFile(temp, next, { flag: 'wx' });
    await rename(temp, path);
  } catch (error) { await unlink(temp).catch(() => {}); throw error; }
}

async function createPlanFile({ project, initiative, text }) {
  const path = planPath(project, initiative);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, { flag: 'wx' }).catch(error => { throw error.code === 'EEXIST' ? fail('plan-exists') : error; });
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
