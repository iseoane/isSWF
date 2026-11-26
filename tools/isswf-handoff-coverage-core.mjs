// No Node imports and no `process` access: the Claude hook runtime and Pi extension load this module. The caller passes `git(argv)`, which resolves to `{ exitCode, stdout }` in the repository.
import { overrideCommitsOf, reviewBaseOf, reviewCandidateOf, uncoveredCommits } from './isswf-handoff-core.mjs';
import { isInitiativePath } from './isswf-snapshot-core.mjs';

const INITIATIVE_JOB = /^\.(?:isswf|factory)\/initiatives\/(I\d+)\/jobs\/([^/]+)\//u;
const UNJUDGED_MERGE = '(merge not judged)';
const MAIN_REF = 'refs/remotes/origin/main';

/** The review record IDs among `names`, sorted. */
export const reviewIds = names => [...names].filter(name => /^V\d{3}\.md$/u.test(name)).map(name => name.slice(0, 4)).sort();

/**
 * Reads, for every job whose records the range `base`..`head` changed, the commits outside its review chain's ranges that change more than records. A merge counts by what it adds beyond the automatic merge of its parents, so a clean merge adds nothing and a conflict resolution that adds code is listed.
 * `base` and `head` are commit SHAs the caller resolved. A git command that fails rejects, except where the code judges the failure.
 */
export async function reviewCoverage({ git, base, head, initiative, job }) {
  const out = async argv => {
    const result = await git(argv);
    if (result.exitCode !== 0) throw new Error('git-failed');
    return result.stdout;
  };
  const isAncestor = async (ancestor, descendant) => (await git(['merge-base', '--is-ancestor', ancestor, descendant])).exitCode === 0;

  // Every job whose records the range changes counts as a reviewer of the commits it names, even when initiative or job leaves it out of the report.
  const touched = new Map();
  for (const path of (await out(['diff', '--name-only', '-z', base, head])).split('\0')) {
    const match = INITIATIVE_JOB.exec(path);
    if (match) touched.set(match[0], { initiative: match[1], job: match[2], directory: match[0] });
  }
  // Each job's review chain: the latest review, then each earlier review whose candidate is the base of the review after it. A delta review carries the
  // earlier round forward, so the chain together reviewed its ranges; the first review that does not chain ends it. A base after the earlier candidate
  // still chains when the commits between them change only records, such as the earlier review's own record. Merges of main are allowed too: a merge whose other
  // parents are on main and whose own changes are records only, and the commits it brings in from main, change nothing the job branch needs reviewed.
  // A merge's own changes are its difference from the automatic merge of its two parents, with the conflicted files counted as changed so that their resolution
  // is reviewed. A merge of more than two parents, or one the automatic merge cannot be computed for, has unknown changes and counts as unreviewed.
  const ownPaths = async (commit, parents) => {
    if (parents.length < 2) return (await out(['diff-tree', '-r', '--root', '--name-only', '--no-commit-id', '-z', commit])).split('\0').filter(Boolean);
    if (parents.length > 2) return [UNJUDGED_MERGE];
    try {
      const auto = await git(['merge-tree', '--write-tree', '--name-only', '--no-messages', '-z', ...parents]);
      if (auto.exitCode !== 0 && auto.exitCode !== 1) return [UNJUDGED_MERGE];
      const [tree, ...conflicted] = auto.stdout.split('\0').filter(Boolean);
      return [...new Set([...conflicted, ...(await out(['diff', '--no-renames', '--name-only', '-z', tree, commit])).split('\0').filter(Boolean)])];
    } catch { return [UNJUDGED_MERGE]; }
  };
  const hasMain = (await git(['rev-parse', '--verify', '--quiet', `${MAIN_REF}^{commit}`])).exitCode === 0;
  const onlyRecordsOrMainMerges = async (candidate, laterBase) => {
    const lines = (await out(['rev-list', '--parents', `${candidate}..${laterBase}`, ...(hasMain ? ['--not', MAIN_REF] : [])])).split('\n').filter(Boolean);
    for (const line of lines) {
      const [commit, first, ...otherParents] = line.split(' ');
      if (otherParents.length) {
        for (const parent of otherParents) if (!hasMain || !(await isAncestor(parent, MAIN_REF))) return false;
      }
      if (!(await ownPaths(commit, first ? [first, ...otherParents] : [])).every(isInitiativePath)) return false;
    }
    return true;
  };
  const chainsTo = async (candidate, laterBase) => candidate !== undefined && laterBase !== undefined && (candidate === laterBase || (await isAncestor(candidate, laterBase)
    && await onlyRecordsOrMainMerges(candidate, laterBase)));
  const reviews = [];
  for (const entry of [...touched.values()].sort((a, b) => a.directory.localeCompare(b.directory))) {
    const listed = (await out(['ls-tree', '--name-only', '-z', head, '--', entry.directory])).split('\0').filter(Boolean).map(path => path.split('/').at(-1));
    const ids = reviewIds(listed);
    const chain = [];
    for (const id of ids.toReversed()) {
      const text = await out(['show', `${head}:${entry.directory}${id}.md`]);
      const link = { text, candidate: reviewCandidateOf(text), base: reviewBaseOf(text) };
      if (chain.length && !(await chainsTo(link.candidate, chain.at(-1).base))) break;
      chain.push(link);
    }
    reviews.push({ ...entry, record: ids.at(-1), candidate: chain[0]?.candidate, chain });
  }
  // A commit is covered when it lies in the base..candidate range of a review in some job's chain, so a later job's candidate does not cover an unreviewed
  // commit before its own base. A review whose candidate is outside this history, or whose base cannot be read, reviewed other code and covers nothing here.
  const covered = new Set();
  for (const { candidate, base: reviewBase } of reviews.flatMap(entry => entry.chain)) {
    if (candidate === undefined || reviewBase === undefined || !(await isAncestor(candidate, head))) continue;
    try {
      for (const commit of (await out(['rev-list', candidate, '--not', reviewBase])).split('\n').filter(Boolean)) covered.add(commit);
    } catch { /* a base that is not in this repository covers nothing */ }
  }
  // The override lines of every review in every chain apply to the one list of commits.
  const overrides = reviews.flatMap(entry => entry.chain.flatMap(link => overrideCommitsOf(link.text)));
  const commits = [];
  for (const [commit, ...parents] of (await out(['rev-list', '--reverse', '--parents', `${base}..${head}`])).split('\n').filter(Boolean).map(line => line.split(' '))) {
    if (covered.has(commit)) continue;
    const paths = [...new Set((await ownPaths(commit, parents)).filter(path => !isInitiativePath(path)))].sort();
    if (paths.length) commits.push({ commit, paths });
  }
  const jobs = [], skipped = [];
  for (const entry of reviews.filter(item => (!initiative || item.initiative === initiative) && (!job || item.job === job))) {
    if (!entry.record) skipped.push({ initiative: entry.initiative, job: entry.job, reason: 'no-review' });
    else jobs.push({ initiative: entry.initiative, job: entry.job, record: entry.record, candidate: entry.candidate, ...uncoveredCommits({ commits, overrides }) });
  }
  const failed = jobs.some(item => item.uncovered.length);
  return { ok: !failed, ...(failed && { code: 'unreviewed-commits' }), base, head, jobs, skipped };
}

/** The coverage function the integration gate takes, over the host's `git(argv, cwd)`: the commit SHAs of `head` above `base` that no recorded review covers. */
export const gateCoverage = git => async ({ root, head, base }) => {
  const report = await reviewCoverage({ git: argv => git(argv, root), base, head });
  return report.jobs.flatMap(job => job.uncovered.map(item => item.commit));
};
