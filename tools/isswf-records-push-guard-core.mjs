// No Node imports, like isswf-plan-commit-guard-core.mjs: the Claude hooks module passes `$.process` and `$.fs`, and Pi passes `execFile` and `readFile`.
import { targetDir } from './isswf-branch-guard-core.mjs';
import { tokenize } from './isswf-command-core.mjs';

const GRANT_LINE = /^- Records-only direct push: granted\s*$/mu;
const VALUE_OPTIONS = new Set(['--repo', '-o', '--push-option', '--receive-pack', '--exec']);
// These push no branch to the base: a delete, tags, or every branch (which the guard leaves alone).
const SKIPPED_OPTIONS = new Set(['-d', '--delete', '--tags', '--mirror', '--all', '--branches']);
const PR_PATH = 'open a pull request for this change, or ask the operator to grant records-only direct pushes in the selected state\'s project-setup.md';

/** The remote and the refspecs of a `git push`, or undefined when it is a delete, tags or a mass push. */
function parsePush(args) {
  const operands = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--') { operands.push(...args.slice(index + 1)); break; }
    if (SKIPPED_OPTIONS.has(arg)) return undefined;
    if (VALUE_OPTIONS.has(arg)) { index += 1; continue; }
    if (!arg.startsWith('-')) operands.push(arg);
  }
  return { remote: operands[0] ?? 'origin', refspecs: operands.slice(1) };
}

/** The sources of the refspecs that update `base`; an empty refspec list pushes the current branch, which is `HEAD`. */
function sourcesFor(refspecs, base, current) {
  if (!refspecs.length) return current === base ? ['HEAD'] : [];
  const sources = [];
  for (const refspec of refspecs) {
    const [from, to = from] = refspec.replace(/^\+/u, '').split(':');
    if (from && (to === base || to === `refs/heads/${base}`)) sources.push(from);
  }
  return sources;
}

/**
 * Refuses a `git push` to the base branch that carries anything but work records, before it runs: every path of `<remote>/<base>..<source>` must be
 * under the selected state's `initiatives/` directory, and the selected state's `project-setup.md` must record the records-only grant.
 * The state is `.isswf/` when its `project-setup.md` is readable, else the legacy `.factory/`; a missing setup record is no grant.
 * It fails open on a git or read fault: this guard enforces a process rule, not an authority.
 * `git(argv, cwd)` resolves to `{ exitCode, stdout }`; `read(path)` resolves to a working-tree file's text.
 */
export async function checkRecordsPush({ command, cwd, git, read }) {
  try {
    for (const segment of tokenize(command)) {
      if (segment.git?.subcommand !== 'push') continue;
      const push = parsePush(segment.git.args);
      const dir = targetDir(cwd, segment);
      if (push === undefined || dir === undefined) continue;
      const top = await git(['rev-parse', '--show-toplevel'], dir);
      if (top.exitCode !== 0) continue;
      const root = top.stdout.trim();
      const configured = await git(['config', '--get', 'isswf.baseBranch'], root);
      const base = configured.exitCode === 0 && configured.stdout.trim() ? configured.stdout.trim() : 'main';
      const head = await git(['symbolic-ref', '--short', '-q', 'HEAD'], root);
      const sources = sourcesFor(push.refspecs, base, head.exitCode === 0 ? head.stdout.trim() : undefined);
      for (const from of sources) {
        const listed = await git(['diff', '--name-only', '-z', '--no-renames', `${push.remote}/${base}..${from}`], root);
        if (listed.exitCode !== 0) continue;
        const setup = await readSetup(root, read);
        const offending = listed.stdout.split('\0').find(path => path && !path.startsWith(`${setup.state}/initiatives/`));
        if (offending !== undefined) return { deny: `isSWF records push guard: git push to ${base} refused. ${offending} is not a work record under ${setup.state}/initiatives/, so the change keeps the pull request path: ${PR_PATH}. This is a process rule, not a retry signal: do not rephrase the command to get past it.` };
        if (!setup.granted) return { deny: `isSWF records push guard: git push to ${base} refused. ${setup.state}/project-setup.md does not record the grant "- Records-only direct push: granted", so even a records-only change keeps the pull request path: ${PR_PATH}. This is a process rule, not a retry signal: do not rephrase the command to get past it.` };
      }
    }
    return {};
  } catch {
    return {};
  }
}

const readGrant = async (path, read) => {
  try {
    return GRANT_LINE.test(await read(path));
  } catch {
    return undefined;
  }
};

async function readSetup(root, read) {
  const modern = await readGrant(`${root}/.isswf/project-setup.md`, read);
  if (modern !== undefined) return { state: '.isswf', granted: modern };
  return { state: '.factory', granted: (await readGrant(`${root}/.factory/project-setup.md`, read)) === true };
}
