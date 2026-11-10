import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export async function runClaudeCodeAdapterContract(packageRoot, { emit = true } = {}) {
  const root = resolve(packageRoot);
  const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  assert.equal(manifest.name, 'pi-subagents');
  assert.equal(manifest.version, '0.83.0');

  const fixtureRoot = await mkdtemp(join(tmpdir(), 'isswf-claude-adapter-contract-'));
  const previousAgentDir = process.env.PI_CODING_AGENT_DIR;
  const project = join(fixtureRoot, 'project');
  const projectConfig = join(project, '.pi');
  const projectAgents = join(projectConfig, 'agents');
  const userAgentDir = join(fixtureRoot, 'user-agent');
  process.env.PI_CODING_AGENT_DIR = userAgentDir;

  try {
    await mkdir(projectAgents, { recursive: true });
    const agentsModule = await import(pathToFileURL(join(root, 'src/agents/agents.js')).href);
    const adapter = await import(pathToFileURL(join(root, 'src/runs/shared/claude-code-adapter.js')).href);
    const runner = await import(pathToFileURL(join(root, 'src/runs/shared/external-cli-runner.js')).href);
    const externalContract = await import(pathToFileURL(join(root, 'src/runs/shared/external-cli-contract.js')).href);
    const builtin = await readFile(join(root, 'agents/claude-code.md'), 'utf8');
    const command = join(fixtureRoot, process.platform === 'win32' ? 'direct Claude.exe' : 'direct Claude');
    const commandLine = `  command: '${command}'\n`;
    assert.equal(builtin.split('  command: claude\n').length - 1, 1, 'The installed builtin profile shape changed');
    const customProfile = builtin.replace('  command: claude\n', commandLine);
    await writeFile(join(projectAgents, 'claude-code.md'), customProfile);

    const discover = () => agentsModule.discoverAgents(project, 'both', undefined, { globalNpmRoot: join(fixtureRoot, 'no-global-packages') });
    const discovered = discover();
    const agent = discovered.agents.find(item => item.name === 'claude-code');
    assert.ok(agent, 'The project profile should shadow the installed builtin');
    assert.equal(agent.source, 'project');
    assert.equal(agent.runner.type, 'external-cli');
    assert.equal(agent.runner.adapter, 'claude-code');
    assert.equal(agent.runner.command, command);
    assert.equal(agent.runner.promptDelivery, 'stdin');
    assert.match(agent.systemPrompt, /no-tools mode/u);

    const override = adapter.resolveClaudeCodeOverride({ model: 'opus:medium', agent, agentName: 'claude-code' });
    assert.deepEqual(override.args, ['--model', 'opus', '--effort', 'medium']);
    assert.equal(override.model, 'opus');
    assert.throws(
      () => adapter.resolveClaudeCodeOverride({ model: 'invalid model:medium', agent, agentName: 'claude-code' }),
      /Invalid Claude Code model/u,
    );
    assert.throws(
      () => adapter.resolveClaudeCodeOverride({ model: 'opus:high', thinkingCeiling: 'medium', agent, agentName: 'claude-code' }),
      /exceeds configured maximum/u,
    );
    assert.throws(
      () => adapter.assertClaudeCodeModelScope({ agent: 'claude-code', model: 'opus', scopes: [{ enforce: true, allow: ['claude-sonnet'] }] }),
      /outside the configured subagent model scope/u,
    );

    const launch = adapter.resolveClaudeCodeLaunch({
      adapter: agent.runner.adapter,
      command: agent.runner.command,
      overrideArgs: override.args,
    });
    assert.equal(launch.command, command);
    assert.equal(launch.args.includes('--strict-mcp-config'), true);
    assert.equal(launch.args[launch.args.indexOf('--tools') + 1], '');
    assert.equal(launch.args[launch.args.indexOf('--mcp-config') + 1], '{"mcpServers":{}}');
    assert.equal(launch.args[launch.args.indexOf('--setting-sources') + 1], 'user');
    assert.equal(launch.args[launch.args.indexOf('--output-format') + 1], 'stream-json');
    assert.equal(launch.args[launch.args.indexOf('--input-format') + 1], 'text');
    assert.ok(launch.args.includes('--no-session-persistence'));
    assert.deepEqual(launch.args.slice(-4), ['--model', 'opus', '--effort', 'medium']);
    for (const key of ['ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL', 'CLAUDE_CODE_OAUTH_TOKEN', 'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX']) {
      assert.ok(launch.environment.allowlist.includes(key), `${key} must remain visible as an inherited-route risk`);
    }
    assert.ok(!launch.environment.allowlist.includes('DISABLE_AUTOUPDATER'));
    const status = externalContract.resolveExternalCliRunnerStatus({ adapter: 'claude-code', command });
    assert.equal(status.adapter.executionMode, 'one-shot-stdin');
    assert.equal(status.safety.tools, 'none');
    assert.equal(status.capabilities.steer, false);
    assert.equal(status.capabilities.resume, false);
    assert.equal(status.capabilities.toolEvents, false);
    assert.equal(status.capabilities.extensionBindings, false);

    const runnerCwd = join(fixtureRoot, 'review cwd ñ');
    const prompt = runner.buildExternalCliPrompt('read-only review instructions', 'candidate diff with ñ');
    await mkdir(runnerCwd, { recursive: true });
    let timeoutHandle;
    const runResult = await runner.runExternalCli({
      command: process.execPath,
      args: ['-e', "let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',chunk=>input+=chunk);process.stdin.on('end',()=>process.stdout.write(JSON.stringify({type:'result',subtype:'success',is_error:false,result:JSON.stringify({cwd:process.cwd(),input})})+'\\n'))"],
      cwd: runnerCwd,
      prompt,
      asyncDir: join(fixtureRoot, 'runner-output'),
      stepIndex: 0,
      environment: { allowlist: ['PATH'] },
      parser: adapter.createClaudeCodeJsonlParser(),
      registerTimeout: callback => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        timeoutHandle = callback ? setTimeout(callback, 5000) : undefined;
      },
    });
    if (timeoutHandle) clearTimeout(timeoutHandle);
    assert.equal(runResult.error, undefined);
    assert.equal(runResult.exitCode, 0);
    assert.equal(runResult.parserTerminal.state, 'completed');
    assert.deepEqual(JSON.parse(runResult.output), { cwd: runnerCwd, input: prompt });

    const outputLimitResult = await runner.runExternalCli({
      command: process.execPath,
      args: ['-e', "process.stdout.write(JSON.stringify({type:'result',subtype:'success',is_error:false,result:'long terminal output'})+'\\n')"],
      cwd: runnerCwd,
      prompt,
      asyncDir: join(fixtureRoot, 'runner-limit-output'),
      stepIndex: 0,
      environment: { allowlist: ['PATH'] },
      parser: adapter.createClaudeCodeJsonlParser(),
      limits: { parserOutputBytes: 3 },
    });
    assert.match(outputLimitResult.error, /terminal output exceeded its byte limit/u);
    assert.notEqual(outputLimitResult.exitCode, 0);

    let stopTimer;
    const stopResult = await runner.runExternalCli({
      command: process.execPath,
      args: ['-e', 'process.stdin.resume();setInterval(()=>{},1000)'],
      cwd: runnerCwd,
      prompt,
      asyncDir: join(fixtureRoot, 'runner-stop-output'),
      stepIndex: 1,
      environment: { allowlist: ['PATH'] },
      registerStop: callback => {
        if (stopTimer) clearTimeout(stopTimer);
        stopTimer = callback ? setTimeout(callback, 50) : undefined;
      },
    });
    if (stopTimer) clearTimeout(stopTimer);
    assert.equal(stopResult.stopped, true);
    assert.match(stopResult.error, /stopped/i);
    assert.notEqual(stopResult.exitCode, 0);

    const badArgs = customProfile.replace(commandLine, `${commandLine}  args: ['--danger']\n`);
    await writeFile(join(projectAgents, 'claude-code.md'), badArgs);
    const argsDiscovery = discover();
    assert.ok(argsDiscovery.agentDiagnostics.some(item => /adapter owns its argv; runner args are not supported/u.test(item.error ?? item.message ?? '')),
      'The installed profile parser must reject adapter-owned argv widening');

    const nativeToolsProfile = customProfile.replace('\n---\n', '\ntools: read\n---\n');
    await writeFile(join(projectAgents, 'claude-code.md'), nativeToolsProfile);
    const toolDiscovery = discover();
    assert.ok(toolDiscovery.agentDiagnostics.some(item => /unsupported Pi-only fields: tools/u.test(item.error ?? item.message ?? '')),
      'The installed profile parser must reject Pi-native tool declarations on the external runner');

    await writeFile(join(projectConfig, 'settings.json'), JSON.stringify({ subagents: { agentOverrides: { 'claude-code': { runner: { command: '/untrusted/override' } } } } }));
    assert.throws(discover, /unknown field 'runner'/u, 'runner must not be configurable through agentOverrides');

    const parser = adapter.createClaudeCodeJsonlParser();
    assert.deepEqual(parser.parseLine(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: 'review complete' })), { phase: 'completed', eventCount: 1 });
    assert.deepEqual(parser.finish(), { state: 'completed', output: 'review complete' });
    const failedParser = adapter.createClaudeCodeJsonlParser();
    assert.equal(failedParser.parseLine(JSON.stringify({ type: 'result', subtype: 'error', is_error: true, result: 'provider failure' })).phase, 'failed');
    assert.equal(failedParser.finish().state, 'failed');
    const duplicateParser = adapter.createClaudeCodeJsonlParser();
    duplicateParser.parseLine(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: 'first' }));
    assert.throws(() => duplicateParser.parseLine(JSON.stringify({ type: 'result', subtype: 'success', is_error: false, result: 'second' })), /duplicate terminal result/u);
    assert.throws(() => adapter.createClaudeCodeJsonlParser().parseLine('{malformed'), /malformed JSONL/u);
    assert.equal(adapter.createClaudeCodeJsonlParser().finish(), undefined, 'EOF without a terminal result remains incomplete');

    const result = {
      status: 'PASS',
      packageVersion: manifest.version,
      cases: ['project custom profile discovery and direct command', 'Opus/medium argv translation, invalid model, ceiling, and scope refusals', 'no-tools/empty-MCP/user-settings launch contract', 'inherited provider-route visibility', 'adapter argv and Pi-only profile refusal', 'runner override refusal', 'UTF-8 stdin, cwd, terminal output and output-limit refusal through synthetic Node processes', 'stop result through a synthetic Node process', 'terminal success/failure/duplicate/malformed/missing parser states'],
      limits: 'Direct imports of public installed pi-subagents source; no plugin startup, Pi/Claude host process, model/provider call, or preflight. Bounded Node helper processes exercise runner transport and stop result. Descendant cessation and effective effort are not proven.'
    };
    if (emit) console.log(JSON.stringify(result));
    return result;
  } finally {
    if (previousAgentDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = previousAgentDir;
    await rm(fixtureRoot, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const source = resolve(process.argv[2] ?? '.');
  const packageRoot = resolve(process.env.ISSWF_PI_SUBAGENTS ?? join(source, 'tooling/host-tests/node_modules/pi-subagents'));
  await runClaudeCodeAdapterContract(packageRoot);
}
