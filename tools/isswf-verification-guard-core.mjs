// No Node imports, like isswf-plan-commit-guard-core.mjs: the caller passes a `git` runner.
import { targetDir } from './isswf-branch-guard-core.mjs';
import { tokenize } from './isswf-command-core.mjs';
import { readsWorkingTree } from './isswf-plan-commit-guard-core.mjs';

const STATE_DIRECTORIES = ['.isswf', '.factory'];

/**
 * Refuses a `git commit` that changes a path the committed `verification.json` derives from without also changing that file, before it runs.
 * It reads the manifest at HEAD and fails open: this guard enforces a process rule, not an authority, so a missing file or a fault allows the command.
 * `git(argv, cwd)` resolves to `{ exitCode, stdout }`.
 */
export async function checkVerificationCommit({ command, cwd, git }) {
  try {
    const problems = [];
    for (const [position, segment] of tokenize(command).entries()) {
      if (segment.git?.subcommand !== 'commit') continue;
      const dir = targetDir(cwd, segment);
      if (dir === undefined) continue;
      // An earlier segment (a `git add`, an edit) has not changed the index yet, so read the working tree then too.
      const all = position > 0 || readsWorkingTree(segment.git.args);
      const top = await git(['rev-parse', '--show-toplevel'], dir);
      if (top.exitCode !== 0) continue;
      const root = top.stdout.trim();
      const listed = await git(['diff', '--name-only', '-z', '--no-renames', ...(all ? ['HEAD'] : ['--cached'])], root);
      if (listed.exitCode !== 0) continue;
      const changed = new Set(listed.stdout.split('\0').filter(Boolean));
      for (const state of STATE_DIRECTORIES) {
        const manifest = `${state}/verification.json`;
        const blob = await git(['show', `HEAD:${manifest}`], root);
        if (blob.exitCode !== 0 || changed.has(manifest)) continue;
        let derivedFrom;
        try { derivedFrom = JSON.parse(blob.stdout).derivedFrom; } catch { continue; }
        if (!Array.isArray(derivedFrom)) continue;
        for (const entry of derivedFrom) {
          if (typeof entry?.path === 'string' && changed.has(entry.path)) problems.push({ manifest, path: entry.path });
        }
      }
    }
    if (!problems.length) return {};
    return { deny: `isSWF verification commit guard: git commit refused. ${problems.map(({ manifest, path }) => `${path} changes without ${manifest}`).join('; ')}.\nThe verification file derives its checks from ${problems.length === 1 ? 'that file' : 'those files'}. Run \`node tools/isswf-verify.mjs --project <project> --stale\`, update the manifest's checks and derivedFrom hashes, stage it, and commit again. This is a process rule, not a retry signal: do not rephrase the command to get past it.` };
  } catch {
    return {};
  }
}
