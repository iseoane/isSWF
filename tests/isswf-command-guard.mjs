import assert from 'node:assert/strict';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const load = name => import(pathToFileURL(join(source, name)));
const { tokenize, checkCommand, guardCommand } = await load('tools/isswf-command-core.mjs');

const refused = (command, rule) => assert.equal(checkCommand(command)?.rule, rule, `should refuse (${rule}): ${command}`);
const allowed = command => assert.equal(checkCommand(command), undefined, `should allow: ${command}`);
const commands = command => tokenize(command).map(segment => segment.command);

// Tokenizer: segments split on && || ; | and newlines, after heredoc and quoted text are set aside.
assert.deepEqual(commands('a && b || c; d | e\nf'), ['a', 'b', 'c', 'd', 'e', 'f']);
assert.deepEqual(commands('cat <<EOF\nnpx x\ngh run watch\nEOF\nls'), ['cat', 'ls']);
assert.deepEqual(commands('git commit -m "use npx; then gh run watch"'), ['git']);
assert.deepEqual(commands("git commit -m 'a && b'"), ['git']);
assert.deepEqual(commands('echo ok # npx x; gh run watch\nls'), ['echo', 'ls']);
{
  const [segment] = tokenize('FOO=1 BAR=2 sudo env X=1 command npx.cmd -y pkg');
  assert.equal(segment.command, 'npx');
  assert.deepEqual(segment.args, ['-y', 'pkg']);
  assert.equal(tokenize('C:\tools\GH.exe pr checks')[0].command, 'gh');
  assert.equal(tokenize('/usr/bin/gh run watch')[0].command, 'gh');
  assert.equal(tokenize('exec ./node_modules/.bin/npx.cmd x')[0].command, 'npx');
  assert.deepEqual(tokenize('npm "install" left-pad')[0].args, ['install', 'left-pad']);
  assert.equal(tokenize('command -v npx')[0].command, undefined, 'a lookup is not a call');
}
assert.deepEqual(tokenize('(npx a); echo $(npx b)').map(segment => [segment.command, segment.depth]), [['npx', 1], ['echo', 0], ['npx', 1]]);
{
  const bash = tokenize('while true; do sleep 1; done; ls');
  assert.deepEqual(bash.filter(segment => segment.command).map(segment => [segment.command, segment.loops.length > 0]), [['true', true], ['sleep', true], ['ls', false]]);
  const powershell = tokenize('while ($true) { Start-Sleep 1 }; gh pr checks');
  assert.deepEqual(powershell.filter(segment => segment.command).map(segment => [segment.command, segment.loops.length > 0]), [['start-sleep', true], ['gh', false]]);
  const nested = tokenize('for a in 1; do while x; do sleep 1; done; sleep 2; done; sleep 3');
  assert.deepEqual(nested.filter(segment => segment.command === 'sleep').map(segment => segment.loops.length), [2, 1, 0]);
}

// CI waiting.
for (const command of [
  'gh pr checks 1 --watch',
  'gh pr checks --watch --repo a/b',
  'gh run watch 123',
  'watch -n 30 gh pr checks',
  'gh pr checks 1 --watch | cat',
  'env GH_TOKEN=x gh pr checks --watch',
  'sudo gh run watch',
  '/usr/bin/gh.exe run watch 1',
  'cd tmp && gh pr checks 1 --watch',
  'while true; do gh pr checks 1; sleep 30; done',
  'until gh pr checks 1; do sleep 10; done',
  'while ! gh pr checks 1 | grep -q pass; do sleep 10; done',
  'for i in 1 2 3; do sleep 60; gh pr checks; done',
  'while ($true) { gh pr checks 1; Start-Sleep -Seconds 30 }',
  'foreach ($i in 1..5) { Start-Sleep 60; gh pr checks }',
  'do { Start-Sleep 30; gh pr checks } while ($pending)',
  'for ($i = 0; $i -lt 5; $i++) { gh pr checks; timeout /t 30 }',
  'sleep 901 && gh pr checks 1',
  'sleep 16m; gh pr checks',
  'sleep 1h && gh pr checks',
  'sleep infinity && gh pr checks',
  'sleep 600 && sleep 400; gh pr checks',
  'sleep 600; gh pr checks; sleep 600; gh pr checks',
  'Start-Sleep -Seconds 901; gh pr checks',
  'Start-Sleep -Milliseconds 901000; gh pr checks',
  'timeout /t 901 /nobreak; gh pr checks',
]) refused(command, 'ci-waiting');
for (const command of [
  'gh pr checks 1',
  'gh pr checks 1 --json name,state',
  'sleep 900 && gh pr checks 1',
  'sleep 15m && gh pr checks 1',
  'sleep 899.5; gh pr checks',
  'Start-Sleep -Seconds 900; gh pr checks',
  'Start-Sleep 900; gh pr checks',
  'Start-Sleep -Milliseconds 900000; gh pr checks',
  'timeout /t 900; gh pr checks',
  'gh pr view 1 --json statusCheckRollup',
  'sleep 60',
  'sleep 5000',
  'timeout 30 make test',
  'watch -n 5 ls',
  'gh pr checks 1; sleep 1000',
  'for f in a b; do sleep 1; echo $f; done',
  'while read line; do echo $line; done < list.txt',
  'foreach ($f in $files) { Write-Output $f }',
  'git commit -m "docs: mention gh pr checks --watch and gh run watch"',
  'git commit -m "x; gh run watch"',
  'cat <<EOF > note.md\nwhile true; do gh pr checks; sleep 30; done\nEOF',
  'echo gh run watch',
  'grep -r "gh pr checks --watch" docs',
  'gh pr checks 1 --help',
]) allowed(command);

// The refusal names the rule, the documented alternatives and that it is not a retry signal.
{
  const verdict = guardCommand('gh pr checks 1 --watch');
  assert.equal(typeof verdict.deny, 'string');
  for (const part of ['ci-waiting', 'native completion event', 'one bounded deferred check', 'pending', 'feature-delivery.md', 'not a retry signal']) assert.ok(verdict.deny.includes(part), part);
  assert.deepEqual(guardCommand('gh pr checks 1'), {});
}

console.log('PASS command guard');
