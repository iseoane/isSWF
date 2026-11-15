import assert from 'node:assert/strict';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const load = name => import(pathToFileURL(join(source, name)));
const { tokenize } = await load('tools/isswf-command-core.mjs');

// Git parsing: a segment whose command is `git` carries its global options and its subcommand, and every segment carries the
// directories that earlier `cd` and `pushd` segments of the same command moved to at the same depth.
const gitOf = command => tokenize(command).flatMap(segment => (segment.git ? [segment.git] : []));
const git = (subcommand, args = [], options = {}) => ({ dirs: [], config: [], gitDir: undefined, workTree: undefined, ...options, subcommand, args });

assert.deepEqual(gitOf('git commit -m x'), [git('commit', ['-m', 'x'])]);
assert.deepEqual(gitOf('git -C repo -c user.name=x --no-pager commit -m x'), [git('commit', ['-m', 'x'], { dirs: ['repo'], config: ['user.name=x'] })]);
assert.deepEqual(gitOf('git -C a -C b switch main'), [git('switch', ['main'], { dirs: ['a', 'b'] })]);
assert.deepEqual(gitOf('git --git-dir=a/.git --work-tree=a commit'), [git('commit', [], { gitDir: 'a/.git', workTree: 'a' })]);
assert.deepEqual(gitOf('git --git-dir a/.git --work-tree a commit'), [git('commit', [], { gitDir: 'a/.git', workTree: 'a' })]);
assert.deepEqual(gitOf('git -P -p --no-optional-locks status'), [git('status')]);
assert.deepEqual(gitOf('git --namespace ns --exec-path=/x checkout -b new'), [git('checkout', ['-b', 'new'])]);
assert.deepEqual(gitOf('git'), [git(undefined)]);
assert.deepEqual(gitOf('git --version'), [git(undefined)]);
assert.deepEqual(gitOf('sudo git -C /r commit'), [git('commit', [], { dirs: ['/r'] })]);
assert.deepEqual(gitOf('/usr/bin/git.exe commit -a'), [git('commit', ['-a'])]);
assert.deepEqual(gitOf('git commit -m x 2>&1 | tail -1'), [git('commit', ['-m', 'x'])]);
assert.deepEqual(gitOf('git add . && git commit -m x; git status').map(entry => entry.subcommand), ['add', 'commit', 'status']);

// Quoted text and heredocs that mention a git command are not git segments.
assert.deepEqual(gitOf('gh pr create --title "git commit" --body "run git commit now"'), []);
assert.deepEqual(gitOf("echo 'git commit -m x'"), []);
assert.deepEqual(gitOf('gh pr create --body-file - <<EOF\nthen git commit -m x\ngit switch main\nEOF'), []);
assert.deepEqual(gitOf('git commit -F - <<EOF\nfix: git switch main\nEOF').map(entry => entry.subcommand), ['commit']);
assert.deepEqual(gitOf('git commit -m "fix: git switch main && git checkout x"').map(entry => entry.subcommand), ['commit']);
assert.deepEqual(gitOf('echo git commit'), []);
assert.deepEqual(gitOf('# git commit'), []);

// Directory changes, as typed, per depth; `null` stands for a directory the command does not spell out.
const cdOf = command => tokenize(command).filter(segment => segment.git).map(segment => segment.cd);
assert.deepEqual(cdOf('git commit'), [[]]);
assert.deepEqual(cdOf('cd sub && git commit'), [['sub']]);
assert.deepEqual(cdOf('cd a && cd b && git commit'), [['a', 'b']]);
assert.deepEqual(cdOf('pushd x; git commit'), [['x']]);
assert.deepEqual(cdOf('cd /d C:/r && git commit'), [['C:/r']]);
assert.deepEqual(cdOf('Set-Location -Path r; git commit'), [['r']]);
assert.deepEqual(cdOf('(cd sub; git commit); git status'), [['sub'], []]);
assert.deepEqual(cdOf('cd a; (cd b; git commit); git status'), [['a', 'b'], ['a']]);
assert.deepEqual(cdOf('cd; git commit'), [[null]]);
assert.deepEqual(cdOf('cd - && git commit'), [[null]]);
assert.deepEqual(cdOf('cd $HOME && git commit'), [[null]]);
assert.deepEqual(cdOf('cd ~/repo && git commit'), [[null]]);
assert.deepEqual(cdOf('cd "my repo" && git commit'), [[null]]);
assert.deepEqual(cdOf('cd -- sub && git commit'), [['sub']]);

console.log('PASS branch guard');
