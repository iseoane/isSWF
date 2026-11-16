import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const { checkPlanCommit } = await import(pathToFileURL(join(source, 'tools/isswf-plan-commit-guard-core.mjs')));

const temp = realpathSync(mkdtempSync(join(tmpdir(), 'isswf-plan-commit-')));
const run = (cwd, ...args) => execFileSync('git', args, { cwd, encoding: 'utf8' });
const git = async (argv, cwd) => {
  try { return { exitCode: 0, stdout: execFileSync('git', argv, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) }; }
  catch (error) { return { exitCode: error.status ?? 1, stdout: String(error.stdout ?? '') }; }
};
const good = '# I0001: Synthetic\n\nType: bug\n\n## J001\n\n- Status: pending\n- Size: S\n- Objective: Something\n- Depends on: None\n- Brief: [brief-r1.md](jobs/J001/brief-r1.md)\n- Blocker: None.\n- Next step: Prepare.\n\n### Acceptance\n\n- Outcome\n\n### Evidence\n\n- None.\n';
const broken = good.replace('(jobs/J001/brief-r1.md)', '(jobs/J001/brief-r1.md) ');
const untitled = good.replace('# I0001: Synthetic', '# I0001:');
try {
  const repo = join(temp, 'repo');
  mkdirSync(join(repo, '.factory/initiatives/I0001'), { recursive: true });
  run(repo, 'init', '-q', '-b', 'main', '.');
  run(repo, 'config', 'user.email', 't@example.invalid');
  run(repo, 'config', 'user.name', 'T');
  const planPath = join(repo, '.factory/initiatives/I0001/plan.md');
  writeFileSync(planPath, good);
  writeFileSync(join(repo, 'README.md'), 'x\n');
  run(repo, 'add', '-A');
  run(repo, 'commit', '-qm', 'start');
  const check = command => checkPlanCommit({ command, cwd: repo, git, read: async path => readFileSync(path, 'utf8') });

  // A staged plan that parses passes; one the parser refuses is refused with its error and line.
  writeFileSync(planPath, good.replace('Prepare.', 'Dispatch.'));
  run(repo, 'add', '-A');
  assert.equal((await check('git commit -m ok')).deny, undefined);
  writeFileSync(planPath, broken);
  run(repo, 'add', '-A');
  const refused = await check('git commit -m bad');
  assert.match(refused.deny ?? '', /plan commit guard/u);
  assert.match(refused.deny, /\.factory\/initiatives\/I0001\/plan\.md/u);
  assert.match(refused.deny, /unsafe-brief-reference/u);
  // The index is what the commit records: a fixed working tree with the broken plan still staged is refused, and a fixed index passes.
  writeFileSync(planPath, good);
  assert.ok((await check('git commit -m bad')).deny);
  run(repo, 'add', '-A');
  assert.equal((await check('git commit -m ok')).deny, undefined);

  // With -a the working-tree plan is what the commit records.
  writeFileSync(planPath, broken);
  assert.equal((await check('git commit -m unstaged')).deny, undefined, 'an unstaged change is not committed');
  assert.ok((await check('git commit -qam all')).deny, '-am commits the working tree');
  assert.ok((await check('git commit --all -m all')).deny);
  writeFileSync(planPath, good);

  // The heading must carry a title, as isswf-status reads it.
  writeFileSync(planPath, untitled);
  run(repo, 'add', '-A');
  assert.match((await check('git commit -m t')).deny ?? '', /title/u);
  writeFileSync(planPath, good);
  run(repo, 'add', '-A');

  // Not a commit, another directory spelled out, a deleted plan, or a git fault: allowed.
  assert.equal((await check('git status')).deny, undefined);
  run(repo, 'rm', '-q', '.factory/initiatives/I0001/plan.md');
  assert.equal((await check('git commit -m removed')).deny, undefined);
  assert.equal((await checkPlanCommit({ command: 'git commit -m x', cwd: repo, git: async () => { throw Error('no git'); }, read: async () => '' })).deny, undefined);
  console.log('PASS plan commit guard');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
