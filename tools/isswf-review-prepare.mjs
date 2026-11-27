import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { reviewHandoff } from './isswf-handoff.mjs';
import { planErrorDetail } from './isswf-plan-core.mjs';
import { recordError } from './isswf-record-new-core.mjs';
import { briefOf, createRecord, gitIn, jobTarget, knownRun, nextId, recordNames } from './isswf-record-new.mjs';
import { reviewIds } from './isswf-handoff-coverage-core.mjs';

/**
 * Prepares one review dispatch: the handoff, the next review record and the prompt lines the dispatch guard reads.
 * The prior reviews come from the job's existing `V` records and feed both the handoff and the record, so the two agree on the round.
 * Everything that can refuse runs before the record is created, so a refusal leaves no record; the handoff files are write-once and a rerun finds the same bytes.
 */
export async function prepareReview({ project, initiative, job, brief, checkpoint, base, candidate, out, host, run }) {
  if (run !== undefined && !knownRun(run)) throw recordError('invalid-run');
  const target = await jobTarget({ project, initiative, job });
  const prior = reviewIds(await recordNames(target, await gitIn(target.root)));
  const { handoff, envelope, promptLines } = await reviewHandoff({ project, initiative, job, brief, checkpoint, base, candidate, prior, out, host });
  const id = await nextId({ project, initiative, job, kind: 'review' });
  const { path: record } = await createRecord({
    project, initiative, job, kind: 'review', id, role: 'reviewer', brief, checkpoint, base, candidate,
    model: envelope.reviewer.model, effort: envelope.reviewer.effort, run, round: String(prior.length + 1),
  });
  return {
    ok: true, initiative, job, id, record, handoff, round: prior.length + 1, priorReviews: prior,
    promptLines: [`brief: ${briefOf(brief, target).path}`, `checkpoint ${checkpoint}`, `base ${base}`, ...promptLines, `review-record: ${record}`],
  };
}

const REQUIRED = ['--project', '--initiative', '--job', '--brief', '--checkpoint', '--base', '--candidate'];
const OPTIONAL = ['--out', '--host', '--run'];

/** Parses `prepare --flag VALUE ...`: every required flag once, each optional flag at most once. */
function parseArgs([command, ...parts]) {
  if (command !== 'prepare') throw recordError('usage');
  const args = {};
  for (let i = 0; i < parts.length; i += 2) {
    const [flag, value] = [parts[i], parts[i + 1]];
    if (![...REQUIRED, ...OPTIONAL].includes(flag) || value === undefined || Object.hasOwn(args, flag)) throw recordError('usage');
    args[flag] = value;
  }
  if (REQUIRED.some(flag => args[flag] === undefined)) throw recordError('usage');
  return args;
}

async function run(argv) {
  const args = parseArgs(argv);
  const [project, initiative, job, brief, checkpoint, base, candidate, out, host, launch] = [...REQUIRED, ...OPTIONAL].map(flag => args[flag]);
  return prepareReview({ project, initiative, job, brief, checkpoint, base, candidate, out, host, run: launch });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(JSON.stringify(await run(process.argv.slice(2))));
  } catch (error) {
    console.log(JSON.stringify({ ok: false, ...planErrorDetail(error), ...(error.field && { field: error.field }), ...(error.expected && { expected: error.expected }), ...(error.planError && { planError: error.planError }), ...(error.violations && { violations: error.violations }) }));
    process.exitCode = 1;
  }
}
