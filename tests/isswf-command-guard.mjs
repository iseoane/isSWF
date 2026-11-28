import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '.');
const load = name => import(pathToFileURL(join(source, name)));
const { HEREDOC, QUOTED, tokenize, checkCommand, guardCommand } = await load('tools/isswf-command-core.mjs');
const { initRepository } = await load('tests/support/git-fixture.mjs');
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
  'watch -n 30 gh pr checks',
  'while true; do gh pr checks 1; sleep 30; done',
  'until gh pr checks 1; do sleep 10; done',
  'while ! gh pr checks 1 | grep -q pass; do sleep 10; done',
  'for i in 1 2 3; do sleep 60; gh pr checks; done',
  'while ($true) { gh pr checks 1; Start-Sleep -Seconds 30 }',
  'foreach ($i in 1..5) { Start-Sleep 60; gh pr checks }',
  'do { Start-Sleep 30; gh pr checks } while ($pending)',
  '1..5 | ForEach-Object { gh pr checks; Start-Sleep 5 }',
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
  'while (( i < 3 )); do sleep 1; gh pr checks; done',
  'while ($true)\n{ gh pr checks; Start-Sleep 5 }',
  'Get-Process | ForEach-Object Name; foreach ($i in 1..3) { Start-Sleep 60; gh pr checks 1 }',
  'sleep 901 && node tools/isswf-ci-state.mjs --pr 1',
  'Start-Sleep -Seconds 901; node tools/isswf-ci-state.mjs --pr 1',
  'while true; do node tools/isswf-ci-state.mjs --pr 1; sleep 30; done',
  'until node /f/tools/isswf-ci-state.mjs --pr 1; do sleep 10; done',
  'while ($true) { node tools/isswf-ci-state.mjs --pr 1; Start-Sleep -Seconds 30 }',
  'sleep 901 && node "C:/Program Files/x/tools/isswf-ci-state.mjs" --pr 1',
  String.raw`Start-Sleep -Seconds 901; node 'C:\Program Files\x\tools\isswf-ci-state.mjs' --pr 1`,
  'while true; do node "C:/Program Files/x/tools/isswf-ci-state.mjs" --pr 1; sleep 30; done',
  'watch -n 30 node "C:/Program Files/x/tools/isswf-ci-state.mjs" --pr 1',
  'watch -n 30 node tools/isswf-ci-state.mjs --pr 1',
  'sleep 600; node tools/isswf-ci-state.mjs --pr 1; sleep 600; node tools/isswf-ci-state.mjs --pr 1',
  String.raw`sleep 901; node C:\f\tools\isswf-ci-state.mjs --pr 1`,
]) refused(command, 'ci-waiting');
for (const command of [
  'gh pr checks 1',
  'gh pr checks 1 --json name,state',
  'sleep 900 && gh pr checks 1',
  'sleep 15m && gh pr checks 1',
  'node tools/isswf-ci-state.mjs --pr 1',
  'sleep 900 && node tools/isswf-ci-state.mjs --pr 1',
  'sleep 15m; node /f/tools/isswf-ci-state.mjs --pr 1 --repo a/b',
  'Start-Sleep -Seconds 900; node tools/isswf-ci-state.mjs --pr 1',
  String.raw`timeout /t 900; node tools\isswf-ci-state.mjs --pr 1`,
  'node tools/isswf-ci-state.mjs --pr 1; sleep 1000',
  'sleep 1000 && node tools/other.mjs',
  'sleep 900 && node "C:/Program Files/x/tools/isswf-ci-state.mjs" --pr 1',
  'node "C:/Program Files/x/tools/isswf-ci-state.mjs" --pr 1',
  'sleep 1000 && node "C:/Program Files/x/tools/other.mjs"',
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
  '1..5 | % { Start-Sleep 1 }; gh pr checks',
  'git commit -m "docs: mention gh pr checks --watch and gh run watch"',
  'git commit -m "x; gh run watch"',
  'cat <<EOF > note.md\nwhile true; do gh pr checks; sleep 30; done\nEOF',
  'echo gh run watch',
  'grep -r "gh pr checks --watch" docs',
  'gh pr checks 1 --help',
  'Get-Process | select Name; Start-Sleep 60; gh pr checks 1',
  'do { Start-Sleep 1 } while ($p); Start-Sleep 60; gh pr checks 1',
  '1..3 | % Name; Start-Sleep 60; gh pr checks 1',
  'Get-Process | ForEach-Object Name; Start-Sleep 60; gh pr checks 1',
  'for i in 1 2; do echo $i; done; sleep 60; gh pr checks 1',
  'timeout 30 make test',
  'gh pr checks 1 --watch',
  'gh pr checks --watch --repo a/b',
  'gh run watch 123',
  'gh pr checks 1 --watch | cat',
  'env GH_TOKEN=x gh pr checks --watch',
  'sudo gh run watch',
  '/usr/bin/gh.exe run watch 1',
  'cd tmp && gh pr checks 1 --watch',
  'timeout 600 gh pr checks 1 --watch',
  'timeout -k 5 600 gh run watch 1',
  'nohup gh run watch 1',
  'xargs -n 1 gh run watch',
]) allowed(command);

// The refusal names the rule, the documented alternatives and that it is not a retry signal.
{
  const verdict = guardCommand('watch -n 30 gh pr checks');
  assert.equal(typeof verdict.deny, 'string');
  for (const part of ['ci-waiting', 'native completion event', 'gh run watch', 'one bounded deferred check', 'pending', 'feature-delivery.md', 'not a retry signal']) assert.ok(verdict.deny.includes(part), part);
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
  'nohup npx x',
  'xargs npx x',
  'xargs -n 1 npx x',
  'nice npx x',
  'nice -n 5 npx x',
  'cmd /c npx x',
  'cmd.exe /C npx x',
  'timeout 600 npx x',
  'timeout -k 5 600 npx x',
  'pnpm -C dir install',
  'npm -C dir install',
  'pnpm --filter pkg add x',
  'npm ci --prefix other/dir --ignore-scripts',
  'npm ci --prefix ../tooling/quality --ignore-scripts',
  'npm ci --prefix /x/tooling/quality-extra --ignore-scripts',
  'npm ci --prefix tooling/quality --ignore-scripts left-pad 2>&1',
  'yarn 2>&1',
  'yarn > log',
  'npm 2>&1 install x',
  'npm install x 2>&1',
  'npm ci --prefix C:/repo/tooling/quality/../../x/tooling/quality --ignore-scripts',
  'npm ci --prefix /x/./tooling/quality --ignore-scripts',
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
  'pnpm exec tsc --noEmit',
  'pnpm exec vitest run',
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
  'npm ci --prefix tooling/quality --ignore-scripts 2>&1 | tail -5',
  'npm ci --prefix tooling/quality --ignore-scripts > ci.log',
  'npm ci --prefix tooling/quality --ignore-scripts >ci.log 2>&1',
  'npm ci --prefix tooling/host-tests --ignore-scripts 2>/dev/null',
  'npm ci --ignore-scripts --prefix tooling/quality *> x',
  'npm ci --prefix /home/me/repo/tooling/quality --ignore-scripts',
  'npm ci --prefix=/home/me/repo/tooling/host-tests/ --ignore-scripts',
  'npm ci --prefix C:\\Users\\me\\repo\\tooling\\quality --ignore-scripts',
  'npm ci --prefix=C:/Users/me/repo/tooling/host-tests --ignore-scripts',
  'sleep 60; gh pr checks 1 2>&1',
  'nice make',
  'cmd /c dir',
  'xargs echo',
  'timeout /t 30',
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
  assert.deepEqual(handlers.map(([name]) => name).sort(), ['input', 'session_start', 'tool_call', 'tool_result'], 'the input, call, result and start events are used');
  const handler = handlers.find(([name]) => name === 'tool_call')[1];
  // The guard applies only in a Git checkout with a state directory; a checkout without one, or no checkout, is left alone.
  const repository = async prefix => { const dir = await mkdtemp(join(tmpdir(), prefix)); await initRepository(dir); return dir; };
  const isswf = await repository('isswf-guard-');
  await mkdir(join(isswf, '.isswf'));
  const plain = await repository('plain-guard-');
  const outside = await mkdtemp(join(tmpdir(), 'nogit-guard-'));
  for (const cwd of [plain, outside]) {
    assert.equal(await handler({ toolName: 'bash', input: { command: 'npx --version' } }, { cwd }), undefined, `no isSWF: ${cwd}`);
    assert.equal(await handler({ toolName: 'bash', input: { command: 'watch -n 30 gh pr checks' } }, { cwd }), undefined, `no isSWF: ${cwd}`);
  }
  const call = (toolName, command) => handler({ toolName, input: { command } }, { cwd: isswf });
  for (const toolName of ['bash', 'powershell']) {
    const blocked = await call(toolName, 'watch -n 30 gh pr checks');
    assert.equal(blocked.block, true, toolName);
    assert.equal(blocked.reason, guardCommand('watch -n 30 gh pr checks').deny, toolName);
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

// Fail open: a fault inside a rule allows the command, and an input that is not text is not a command.
assert.deepEqual(guardCommand('npx x', [() => { throw new Error('rule fault'); }]), {});
assert.deepEqual(guardCommand('npx x', [() => ({ rule: 'late', reason: 'after a fault' })]), { deny: 'isSWF command guard (late): after a fault' });
for (const input of [undefined, null, 42, {}, ['npx x']]) assert.deepEqual(guardCommand(input), {}, String(input));
assert.deepEqual(guardCommand(''), {});

// Claude: the one `tool.call` hook refuses `Bash` and `PowerShell` before `next(e)`, whatever the pane option is.
// The event carries the command in `command`, for the main session and for a child (`agentId`).
// register.tsx has no runner, so the hook is a source check; the live check covers the host.
const hooks = await readFile(join(source, 'hooks/register.tsx'), 'utf8');
const hook = hooks.slice(hooks.indexOf("on('tool.call'"));
const coreImport = /import \{([^}]*)\} from '\.\.\/tools\/isswf-command-core\.mjs'/u.exec(hooks)?.[1] ?? '';
assert.ok(/\bguardCommand\b/u.test(coreImport), 'the hook imports the shared core');
const shellAt = hook.indexOf('guardCommand(');
assert.ok(hook.slice(0, shellAt).includes('branches.usesIsswf('), 'the command guard applies only where isSWF is used');
assert.ok(shellAt > 0 && shellAt < hook.indexOf('await next(e)'), 'the guard runs before the tool is called');
assert.ok(hook.slice(0, shellAt).includes("e.tool === 'Bash'") && hook.slice(0, shellAt).includes("e.tool === 'PowerShell'"), 'both shell tools are guarded');
assert.ok(hook.slice(shellAt, hook.indexOf('await next(e)')).includes('return { deny:'), 'a refusal is a deny');
assert.ok(!hook.slice(0, shellAt).includes('agentId'), 'children and the main session are guarded alike');
for (const event of [{ tool: 'Bash', command: 'npx --version' }, { tool: 'PowerShell', command: 'npx --version' }, { tool: 'Bash', command: 'npx --version', agentId: 'a1b2c3' }]) {
  assert.match(guardCommand(event.command).deny, /package-acquisition/u, JSON.stringify(event));
}
assert.deepEqual(guardCommand('node --version'), {});

// The pane's heredoc and quoted-text handling uses the same patterns, moved unchanged.
assert.ok(/\bHEREDOC\b/u.test(coreImport) && /\bQUOTED\b/u.test(coreImport), 'the pane imports the patterns from the core');
assert.ok(!/^const (?:HEREDOC|QUOTED) =/mu.test(hooks), 'the patterns live in the core only');
assert.equal(HEREDOC.source, String.raw`<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?(?:\n\s*\2\s*(?:\n|$)|$)`);
assert.equal(QUOTED.source, String.raw`(["'])(?:(?!\1)[\s\S])*\1`);
assert.equal(HEREDOC.flags + QUOTED.flags, 'gg');
const paneText = raw => raw.replace(HEREDOC, '$3\n').replace(QUOTED, quoted => (/\s/.test(quoted) ? '""' : quoted));
assert.equal(paneText('git commit -F - <<EOF > out.txt\n.factory/initiatives/I0001/plan.md\nEOF\ncat "a b" ".factory/x"'), 'git commit -F -  > out.txt\ncat "" ".factory/x"');

// Packaging: the package extension covers the main session; the worker is the only profile with `bash`, so only it declares the guard
// for its child. `subagentOnlyExtensions` takes a comma-separated list, so the worker keeps its record guard next to it.
const extension = 'tools/isswf-command-guard-pi-extension.mjs';
const manifest = JSON.parse(await readFile(join(source, 'package.json'), 'utf8'));
assert.deepEqual(manifest.pi.extensions, ['./tools/isswf-record-guard-pi-extension.mjs', './tools/isswf-dispatch-guard-pi-extension.mjs', `./${extension}`, './tools/isswf-compaction-pi-extension.mjs', './tools/isswf-initiatives-pi-extension.mjs']);
for (const [role, shell] of [['worker', true], ['planner', false], ['researcher', false], ['reviewer', false]]) {
  const profile = await readFile(join(source, `.agents/hosts/pi/agents/isswf-${role}.md`), 'utf8');
  const tools = /^tools: (.*)$/mu.exec(profile)[1].split(',').map(tool => tool.trim());
  const declared = (/^subagentOnlyExtensions: (.*)$/mu.exec(profile)?.[1] ?? '').split(',').map(entry => entry.trim());
  assert.equal(tools.includes('bash'), shell, `${role} shell tool`);
  assert.equal(declared.includes(`../../../../${extension}`), shell, `${role} declares the command guard`);
}
assert.match(await readFile(join(source, '.agents/hosts/pi/agents/isswf-worker.md'), 'utf8'), /^subagentOnlyExtensions: \.\.\/\.\.\/\.\.\/\.\.\/tools\/isswf-record-guard-pi-extension\.mjs, \.\.\/\.\.\/\.\.\/\.\.\/tools\/isswf-command-guard-pi-extension\.mjs$/mu, 'the worker keeps its record guard');

console.log('PASS command guard');
