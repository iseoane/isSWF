// No Node imports, like isswf-branch-guard-core.mjs: the Claude hooks module passes `$.process` and `$.fs`, and Pi passes `execFile` and `readFile`.
import { targetDir } from './isswf-branch-guard-core.mjs';
import { tokenize } from './isswf-command-core.mjs';
import { parsePlan, planErrorDetail } from './isswf-plan-core.mjs';

const PLAN_PATH = /^(?:\.isswf|\.factory)\/initiatives\/(I\d+)\/plan\.md$/u;
const ALL_FLAG = arg => arg === '--all' || /^-[a-zA-Z]*a[a-zA-Z]*$/u.test(arg);

/** Reads a plan as isswf-status does: the parser accepts it and the heading names the initiative with a title. */
function readBack(text, initiative) {
  const heading = text.split(/\r?\n/u, 1)[0], prefix = `# ${initiative}: `;
  const title = heading.startsWith(prefix) ? heading.slice(prefix.length) : '';
  if (!title.trim() || title.length > 4000 || /[\x00-\x1f\x7f]/u.test(title)) return { code: 'invalid-title', line: 1 };
  try { parsePlan(text); return undefined; } catch (error) { return planErrorDetail(error); }
}

const describe = (path, { code, job, field, line }) => `${path}: ${code}${[job, field].filter(Boolean).length ? ` at ${[job, field].filter(Boolean).join(' ')}` : ''}${line === undefined ? '' : ` (line ${line})`}`;

/**
 * Refuses a `git commit` that would record a plan `isswf-status` cannot read back, before it runs: the staged plan, or the working-tree plan with `-a`.
 * It fails open: this guard enforces a process rule, not an authority, so a fault allows the command.
 * `git(argv, cwd)` resolves to `{ exitCode, stdout }`; `read(path)` resolves to a working-tree file's text.
 */
export async function checkPlanCommit({ command, cwd, git, read }) {
  try {
    const problems = [];
    for (const segment of tokenize(command)) {
      if (segment.git?.subcommand !== 'commit') continue;
      const dir = targetDir(cwd, segment);
      if (dir === undefined) continue;
      const all = segment.git.args.some(ALL_FLAG);
      const top = await git(['rev-parse', '--show-toplevel'], dir);
      if (top.exitCode !== 0) continue;
      const root = top.stdout.trim();
      // Paths the commit would record with content: staged, plus tracked working-tree changes with -a. Deletions are left out.
      const listed = await git(['diff', '--name-only', '-z', '--no-renames', '--diff-filter=d', ...(all ? ['HEAD'] : ['--cached'])], root);
      if (listed.exitCode !== 0) continue;
      for (const path of listed.stdout.split('\0')) {
        const match = PLAN_PATH.exec(path);
        if (!match) continue;
        const content = all ? { exitCode: 0, stdout: await read(`${root}/${path}`) } : await git(['show', `:${path}`], root);
        if (content.exitCode !== 0) continue;
        const problem = readBack(content.stdout, match[1]);
        if (problem) problems.push(describe(path, problem));
      }
    }
    if (!problems.length) return {};
    return { deny: `isSWF plan commit guard: git commit refused. isswf-status cannot read back ${problems.length === 1 ? 'this plan' : 'these plans'}:\n${problems.map(item => `- ${item}`).join('\n')}\nFix the plan with tools/isswf-plan-edit.mjs or by hand, stage it, and commit again. This is a process rule, not a retry signal: do not rephrase the command to get past it.` };
  } catch {
    return {};
  }
}
