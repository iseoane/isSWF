import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { addJob, appendEvidence, newPlan, setField } from './isswf-plan-edit-core.mjs';
import { stateDirectory } from './project-state.mjs';

const planPath = (project, initiative) => join(resolve(project), stateDirectory(resolve(project)), 'initiatives', initiative, 'plan.md');

/** Applies `edit` (plan text to plan text) to the initiative's plan: a temporary file in the same directory, then a rename over the plan. */
export async function editPlanFile({ project, initiative, edit }) {
  const path = planPath(project, initiative);
  const next = edit(await readFile(path, 'utf8'));
  const temp = join(dirname(path), `.plan.md.${randomBytes(6).toString('hex')}.tmp`);
  await writeFile(temp, next, { flag: 'wx' });
  await rename(temp, path);
}

async function createPlanFile({ project, initiative, text }) {
  const path = planPath(project, initiative);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, text, { flag: 'wx' });
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
  if (!flags) throw Object.assign(Error('usage'), { code: 'usage' });
  const args = {};
  for (let i = 0; i < parts.length; i += 2) {
    const [flag, value] = [parts[i], parts[i + 1]];
    if (!flags.includes(flag) || value === undefined || (flag !== '--acceptance' && Object.hasOwn(args, flag))) throw Object.assign(Error('usage'), { code: 'usage' });
    if (flag === '--acceptance') (args[flag] ??= []).push(value); else args[flag] = value;
  }
  if (flags.some(flag => args[flag] === undefined)) throw Object.assign(Error('usage'), { code: 'usage' });
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
  catch (error) { console.log(JSON.stringify({ ok: false, code: error.code ?? error.message })); process.exitCode = 1; }
}
