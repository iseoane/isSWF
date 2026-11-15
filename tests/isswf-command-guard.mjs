import assert from 'node:assert/strict';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const load = name => import(pathToFileURL(join(source, name)));
const { tokenize, checkCommand, guardCommand } = await load('tools/isswf-command-core.mjs');
const { default: registerGuard } = await load('tools/isswf-command-guard-pi-extension.mjs');

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
  assert.equal(tokenize(String.raw`C:\tools\GH.exe pr checks`)[0].command, 'gh');
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
  assert.deepEqual(powershell.filter(segment => segment.command).map(segment => [segment.command, segment.loops.length > 0]), [['$true', true], ['start-sleep', true], ['gh', false]]);
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

// Package acquisition.
for (const command of [
  'npx --version',
  'npx -y some-package',
  'bunx cowsay hi',
  'uvx ruff check',
  'corepack enable',
  'corepack pnpm install',
  'npm install',
  'npm i left-pad',
  'npm add left-pad',
  'npm install -g typescript',
  'npm exec -- vite',
  'npm x vite',
  'npm ci',
  'npm ci left-pad --prefix tooling/quality --ignore-scripts',
  'npm ci --prefix tooling/quality',
  'npm ci --prefix tooling/other --ignore-scripts',
  'npm ci --prefix tooling/quality --ignore-scripts --registry https://example.test',
  'npm ci --prefix tooling/quality --ignore-scripts=false',
  'npm --prefix tooling/quality install left-pad',
  'pnpm dlx cowsay',
  'pnpm add left-pad',
  'pnpm install',
  'pnpm i',
  'pnpm exec vite',
  'yarn',
  'yarn --frozen-lockfile',
  'yarn dlx cowsay',
  'yarn add left-pad',
  'pip install requests',
  'pip3 install requests',
  'pip --quiet install requests',
  'python -m pip install requests',
  'python3 -m pip install --user requests',
  'py -3 -m pip install requests',
  'uv pip install requests',
  'uv tool install ruff',
  'bun add left-pad',
  'bun install',
  'bun x cowsay',
  'sudo npm install -g x',
  'env CI=1 npx x',
  'cd tooling && npx eslint .',
  'NODE_ENV=test npm i',
  'ls | xargs echo; npx x',
  'echo $(npx x)',
  '(npx x)',
  'C:\\Users\\me\\AppData\\Roaming\\npm\\npx.cmd x',
  'npx.cmd x',
  'NPX x',
  'if true; then npx x; fi',
  'while true; do npm install; done',
  'Start-Process; npx x',
  'pip3.exe install x',
]) refused(command, 'package-acquisition');
for (const command of [
  'npm ci --prefix tooling/quality --ignore-scripts',
  'npm ci --prefix tooling/host-tests --ignore-scripts',
  'npm ci --prefix tooling/quality --ignore-scripts --no-audit --no-fund',
  'npm ci --ignore-scripts --no-fund --no-audit --prefix tooling/host-tests',
  'npm ci --ignore-scripts --prefix=tooling/quality',
  'npm ci --prefix ./tooling/quality/ --ignore-scripts',
  'npm ci --prefix tooling\\quality --ignore-scripts',
  'node tools/check-quality.mjs',
  'node tooling/quality/node_modules/eslint/bin/eslint.js --config tooling/quality/eslint.config.mjs tools tests tooling/quality/*.mjs',
  'node tooling/quality/node_modules/knip/bin/knip.js --config tooling/quality/knip.json --no-progress',
  'node tests/isswf-command-guard.mjs .',
  'npm run build',
  'npm test',
  'npm run lint -- --fix',
  'npm --version',
  'npm ls',
  'npm pack --dry-run',
  'yarn --version',
  'yarn run build',
  'pnpm run build',
  'pnpm --version',
  'pip --version',
  'pip list',
  'python script.py',
  'python -m pytest',
  'python3 -m venv .venv',
  'py -3 -m pip --version',
  'uv --version',
  'uv run script.py',
  'bun run build',
  'bun test',
  'git commit -m "build: replace npx with node and drop npm install from the docs"',
  'git commit -m "x" && git log',
  "git commit -m 'pip install is refused'",
  'cat <<EOF > note.md\nnpm install left-pad\nnpx x\nEOF',
  'git commit -F - <<EOF\nfix: refuse npx\nEOF',
  'echo npx x',
  'grep -rn npx docs',
  'command -v npx',
  'which npx',
  'ls node_modules/.bin',
  'Get-Content npx.md',
  '# npx x',
]) allowed(command);

// A refusal names the installed local tools, the locked installs and that it is not a retry signal.
{
  const verdict = guardCommand('npx --version');
  for (const part of ['package-acquisition', 'tooling/quality/node_modules/eslint/bin/eslint.js', 'tooling/quality/node_modules/knip/bin/knip.js', 'npm ci --prefix tooling/quality --ignore-scripts', 'npm ci --prefix tooling/host-tests --ignore-scripts', 'not a retry signal']) assert.ok(verdict.deny?.includes(part), part);
}

// Pi: the `tool_call` handler blocks `bash` and `powershell` with the refusal text and leaves every other call alone.
{
  const handlers = [];
  registerGuard({ on: (name, handler) => handlers.push([name, handler]) });
  assert.deepEqual(handlers.map(([name]) => name), ['tool_call'], 'only the call event is used');
  const [[, handler]] = handlers;
  const call = (toolName, command) => handler({ toolName, input: { command } }, { cwd: '/work' });
  for (const toolName of ['bash', 'powershell']) {
    const blocked = await call(toolName, 'gh pr checks 1 --watch');
    assert.equal(blocked.block, true, toolName);
    assert.equal(blocked.reason, guardCommand('gh pr checks 1 --watch').deny, toolName);
    assert.match((await call(toolName, 'npx --version')).reason, /package-acquisition/u, toolName);
    assert.equal(await call(toolName, 'node --version'), undefined, toolName);
    assert.equal(await call(toolName, 'sleep 900 && gh pr checks 1'), undefined, toolName);
  }
  assert.equal(await call('read', 'npx --version'), undefined, 'only shell tools are guarded');
  assert.equal(await call('subagent', 'npx --version'), undefined);
  assert.equal(await handler({ toolName: 'bash', input: {} }, {}), undefined, 'a call without a command is left alone');
  assert.equal(await handler({ toolName: 'bash' }, {}), undefined, 'a call without input is left alone');
  assert.equal(await handler(undefined, {}), undefined, 'an unreadable event is left alone');
}

console.log('PASS command guard');
