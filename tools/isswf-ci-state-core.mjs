// One read of a pull request's CI state for its exact head (docs/en/operations.md, "CI state"). It never waits or loops.

const USAGE = 'Usage: node tools/isswf-ci-state.mjs --pr <number> [--repo <owner/name>]';

const FIELDS = 'headRefOid,statusCheckRollup';
const SUCCESSFUL = new Set(['SUCCESS', 'NEUTRAL', 'SKIPPED']);
const PENDING_STATUS = new Set(['PENDING', 'EXPECTED', 'QUEUED', 'IN_PROGRESS', 'WAITING', 'REQUESTED']);
const unreadable = reason => new Error(`unreadable: ${reason}`);

export function parseArgs(argv) {
  const options = {};
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i];
    if (name !== '--pr' && name !== '--repo') throw new Error(`unknown argument ${name}. ${USAGE}`);
    const value = argv[i + 1];
    if (value === undefined || value.startsWith('--')) throw new Error(`${name} needs a value. ${USAGE}`);
    options[name.slice(2)] = value;
  }
  if (!/^[1-9]\d*$/u.test(options.pr ?? '')) throw new Error(USAGE);
  if (options.repo !== undefined && !/^[\w.-]+\/[\w.-]+$/u.test(options.repo)) throw new Error(`--repo must be <owner/name>. ${USAGE}`);
  return { pr: options.pr, repo: options.repo };
}

// A check run reports `status` and, once completed, `conclusion`; a commit status context reports only `state`.
function checkOf(entry) {
  const name = entry?.name ?? entry?.context;
  if (typeof name !== 'string') throw unreadable('a check has no name');
  const result = entry.conclusion || entry.state;
  if (typeof result !== 'string' && !PENDING_STATUS.has(entry.status)) throw unreadable(`check ${name} has no result`);
  const outcome = typeof result !== 'string' || PENDING_STATUS.has(result) ? 'pending' : SUCCESSFUL.has(result) ? 'success' : 'failure';
  return { name, conclusion: outcome === 'pending' ? 'pending' : result.toLowerCase(), outcome };
}

// The worst check decides: a failure outranks a pending check, and no check yet is pending, not a pass.
function summarize(view) {
  if (typeof view?.headRefOid !== 'string' || !/^[0-9a-f]{40}$/u.test(view.headRefOid) || !Array.isArray(view.statusCheckRollup)) throw unreadable('no head or check list');
  const checks = view.statusCheckRollup.map(checkOf);
  const state = checks.some(check => check.outcome === 'failure') ? 'failure' : checks.length === 0 || checks.some(check => check.outcome === 'pending') ? 'pending' : 'success';
  return { head: view.headRefOid, state, checks: checks.map(({ name, conclusion }) => ({ name, conclusion })) };
}

export const EXIT_CODES = { success: 0, failure: 1, pending: 2 };

// `gh` runs `gh <argv>` and resolves `{ exitCode, stdout }`; any way the read fails is `unreadable`.
export async function readCiState({ pr, repo, gh }) {
  const argv = ['pr', 'view', pr, '--json', FIELDS, ...(repo ? ['--repo', repo] : [])];
  let result;
  try {
    result = await gh(argv);
  } catch (error) {
    throw unreadable(`gh did not run (${error.message})`);
  }
  if (result.exitCode !== 0) throw unreadable(`gh exited ${result.exitCode}`);
  let view;
  try {
    view = JSON.parse(result.stdout);
  } catch {
    throw unreadable('gh did not return JSON');
  }
  return summarize(view);
}
