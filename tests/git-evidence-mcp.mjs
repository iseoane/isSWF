import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, readdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Journeys through the real stdio MCP server process that the Claude reviewer route launches.
const source = resolve(process.argv[2] ?? '.');
const server = join(source, 'tools/git-evidence-mcp.mjs');
const envName = 'ISSWF_GIT_EVIDENCE_BINDINGS';
const root = await realpath(await mkdtemp(join(tmpdir(), 'isswf-git-mcp-')));
const workspace = join(root, 'repo');
const gitPath = spawnSync(process.platform === 'win32' ? 'where.exe' : 'which', ['git'], { encoding: 'utf8' }).stdout.trim().split(/\r?\n/u)[0];
assert.ok(gitPath, 'Git executable must be locatable');
const git = await realpath(gitPath);
// Fixture commits must keep CRLF/BOM bytes even when CI sets core.autocrlf=true.
const noEolConversion = ['-c', 'core.autocrlf=false', '-c', 'core.eol=lf', '-c', 'core.safecrlf=false'];
const gitRun = args => {
  const result = spawnSync(git, [...noEolConversion, ...args], { cwd: workspace, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${args.join(' ')}\n${result.stderr}`);
  return result.stdout.trim();
};
const commit = message => gitRun(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', message]);
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

class Client {
  constructor(entry, bindings, { raw = bindings === undefined ? undefined : JSON.stringify(bindings) } = {}) {
    const env = { PATH: dirname(process.execPath), ...(raw === undefined ? {} : { [envName]: raw }) };
    this.child = spawn(process.execPath, [entry], { cwd: workspace, env, stdio: ['pipe', 'pipe', 'pipe'] });
    this.pending = new Map();
    this.unsolicited = [];
    this.stdout = '';
    this.stderr = '';
    this.exit = new Promise(done => this.child.once('close', (code, signal) => done({ code, signal })));
    this.child.stdin.on('error', () => {});
    this.child.stderr.on('data', chunk => { this.stderr += chunk; });
    this.child.stdout.on('data', chunk => {
      this.stdout += chunk;
      let index;
      while ((index = this.stdout.indexOf('\n')) >= 0) {
        const line = this.stdout.slice(0, index);
        this.stdout = this.stdout.slice(index + 1);
        const message = JSON.parse(line);
        const waiter = this.pending.get(message.id);
        if (waiter) { this.pending.delete(message.id); waiter(message); } else this.unsolicited.push(message);
      }
    });
    this.nextId = 1;
  }
  frame(message, eol = '\n') { this.child.stdin.write(JSON.stringify({ jsonrpc: '2.0', ...message }) + eol); }
  request(method, params, eol = '\n') {
    const id = this.nextId++;
    const reply = new Promise((done, reject) => {
      const timer = setTimeout(() => reject(new Error(`no response to ${method}`)), 15000);
      this.pending.set(id, message => { clearTimeout(timer); done(message); });
    });
    this.frame({ id, method, ...(params === undefined ? {} : { params }) }, eol);
    return reply;
  }
  async call(name, args) {
    const reply = await this.request('tools/call', { name, arguments: args });
    assert.equal(reply.error, undefined, JSON.stringify(reply));
    return reply.result;
  }
  async start() {
    const reply = await this.request('initialize', { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'journey', version: '1' } });
    this.frame({ method: 'notifications/initialized' });
    return reply;
  }
  async close() {
    this.child.stdin.end();
    const guard = setTimeout(() => this.child.kill('SIGKILL'), 5000);
    const result = await this.exit;
    clearTimeout(guard);
    return result;
  }
}

const failures = [];
const passed = [];
async function check(name, run) {
  try { await run(); passed.push(name); } catch (error) { failures.push({ name, message: String(error?.message ?? error).split('\n').slice(0, 6).join(' | ') }); }
}
const withClient = async (bindings, run, options) => {
  const client = new Client(server, bindings, options);
  try { await client.start(); await run(client); } finally { await client.close(); }
};
const textOf = result => result.content.map(block => block.text);
const snapshot = async directory => {
  const entries = new Map();
  const walk = async current => {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else entries.set(path, sha256(await readFile(path)) + ':' + (await stat(path)).mtimeMs);
    }
  };
  await walk(directory);
  return entries;
};

try {
  await mkdir(workspace);
  gitRun(['init', '-q']);
  await writeFile(join(workspace, 'tracked.txt'), 'bound MCP identity\n');
  await writeFile(join(workspace, 'binary.dat'), Buffer.from([0, 255, 10]));
  await writeFile(join(workspace, 'exact.txt'), Buffer.from([0xef, 0xbb, 0xbf, 0x62, 0x61, 0x73, 0x65, 0x0d, 0x0a]));
  gitRun(['add', '-A']);
  commit('base');
  const base = gitRun(['rev-parse', 'HEAD']);
  await writeFile(join(workspace, 'tracked.txt'), 'review this committed change\n');
  gitRun(['add', 'tracked.txt']);
  commit('candidate');
  const candidate = gitRun(['rev-parse', 'HEAD']);
  // The working tree differs from every commit; evidence must come from committed objects only.
  await writeFile(join(workspace, 'tracked.txt'), 'WORKING TREE CANARY\n');
  const common = { version: 1, repository: workspace, baseSha: base, candidateSha: candidate, gitExecutable: git, timeoutMs: 5000 };
  const bindings = {
    'isswf.git-evidence/1': { ...common, outputBytes: 4096 },
    'isswf.git-evidence.diff/1': { ...common, outputBytes: 22000 },
    'isswf.git-evidence.content/1': { ...common, outputBytes: 65536, paths: ['tracked.txt', 'binary.dat', 'exact.txt', 'absent.txt'] },
  };

  await check('initialize negotiates, ignores notifications, refuses unknown methods, answers ping', async () => {
    const client = new Client(server, bindings);
    try {
      const reply = await client.start();
      assert.equal(reply.jsonrpc, '2.0');
      assert.equal(reply.result.protocolVersion, '2025-11-25');
      assert.deepEqual(reply.result.capabilities, { tools: {} });
      assert.equal(reply.result.serverInfo.name, 'isswf-git-evidence');
      const discover = await client.request('server/discover', { _meta: {} });
      assert.equal(discover.error.code, -32601, 'the pinned Claude probes server/discover first and falls back on method-not-found');
      assert.deepEqual((await client.request('ping')).result, {});
      assert.equal((await client.request('resources/list')).error.code, -32601);
      assert.deepEqual(client.unsolicited, [], 'notifications receive no response');
    } finally { await client.close(); }
  });

  await check('tools/list exposes exactly identity, diff and content with closed schemas', async () => {
    await withClient(bindings, async client => {
      const { result } = await client.request('tools/list');
      assert.deepEqual(result.tools.map(tool => tool.name), ['identity', 'diff', 'content']);
      assert.deepEqual(result.tools[0].inputSchema, { type: 'object', properties: {}, additionalProperties: false });
      assert.deepEqual(result.tools[1].inputSchema, { type: 'object', properties: { chunk: { type: 'integer', minimum: 1 } }, additionalProperties: false });
      assert.deepEqual(result.tools[2].inputSchema, { type: 'object', properties: { slot: { type: 'string', enum: ['base', 'candidate'] }, path: { type: 'string' } }, required: ['slot', 'path'], additionalProperties: false });
      for (const tool of result.tools) assert.equal(typeof tool.description, 'string');
    });
  });

  await check('identity returns the bound repository, commits and observed HEAD', async () => {
    await withClient(bindings, async client => {
      const result = await client.call('identity', {});
      assert.equal(result.isError, undefined);
      const evidence = JSON.parse(result.content[0].text);
      assert.equal(evidence.status, 'ok');
      assert.equal(evidence.repository, workspace);
      assert.equal(evidence.baseSha, base);
      assert.equal(evidence.candidateSha, candidate);
      assert.equal(evidence.observedHeadSha, candidate);
    });
  });

  await check('a small diff is one verified chunk carrying the full-patch digest and a readable view', async () => {
    await withClient(bindings, async client => {
      const result = await client.call('diff', {});
      assert.equal(result.isError, undefined);
      const evidence = JSON.parse(result.content[0].text);
      assert.equal(evidence.operation, 'diff');
      assert.equal(evidence.patchIntegrity, 'verified');
      assert.equal(evidence.chunk, 1);
      assert.equal(evidence.chunkCount, 1);
      assert.equal(evidence.patchBytes, evidence.chunkBytes);
      assert.equal(evidence.chunkSha256, evidence.patchSha256);
      assert.equal(evidence.patch, undefined, 'the whole-patch field is replaced by the chunk');
      const patch = Buffer.from(evidence.chunkBase64, 'base64');
      assert.equal(sha256(patch), evidence.patchSha256);
      assert.match(patch.toString('utf8'), /\+review this committed change\n/u);
      assert.doesNotMatch(patch.toString('utf8'), /CANARY/u);
      assert.equal(result.content[1].text, patch.toString('utf8'));
      assert.equal((await client.call('diff', { chunk: 1 })).content[1].text, patch.toString('utf8'));
    });
  });

  await check('content returns exact committed bytes, base64-only binary, and absent distinct from empty', async () => {
    await withClient(bindings, async client => {
      const text = await client.call('content', { slot: 'candidate', path: 'tracked.txt' });
      assert.equal(JSON.parse(text.content[0].text).contentIntegrity, 'verified');
      assert.equal(text.content[1].text, 'review this committed change\n', 'committed bytes, not the working-tree canary');
      const baseText = await client.call('content', { slot: 'base', path: 'tracked.txt' });
      assert.equal(JSON.parse(baseText.content[0].text).commitSha, base);
      assert.equal(baseText.content[1].text, 'bound MCP identity\n');
      const exact = await client.call('content', { slot: 'candidate', path: 'exact.txt' });
      assert.equal(exact.content[1].text, '\uFEFFbase\r\n', 'BOM and CRLF are preserved');
      const binary = await client.call('content', { slot: 'base', path: 'binary.dat' });
      assert.equal(JSON.parse(binary.content[0].text).contentTextEncoding, 'unavailable-non-utf8');
      assert.equal(JSON.parse(binary.content[0].text).content, 'AP8K');
      assert.equal(binary.content.length, 1);
      const absent = await client.call('content', { slot: 'candidate', path: 'absent.txt' });
      assert.equal(absent.isError, undefined);
      assert.equal(JSON.parse(absent.content[0].text).status, 'absent');
    });
  });

  await check('CLI refusals surface as tool errors with their explicit reason', async () => {
    await withClient(bindings, async client => {
      const refused = await client.call('content', { slot: 'candidate', path: 'unlisted.txt' });
      assert.equal(refused.isError, true);
      assert.equal(JSON.parse(refused.content[0].text).reason, 'content-path-not-allowed');
    });
    const wrongRoot = { ...bindings, 'isswf.git-evidence/1': { ...bindings['isswf.git-evidence/1'], repository: root } };
    await withClient(wrongRoot, async client => {
      const refused = await client.call('identity', {});
      assert.equal(refused.isError, true);
      assert.equal(JSON.parse(refused.content[0].text).status, 'error');
    });
  });

  await check('missing, literal-placeholder, malformed or invalid bindings fail closed per tool', async () => {
    const variants = [
      ['unset', undefined, {}],
      ['unexpanded placeholder', undefined, { raw: '${ISSWF_GIT_EVIDENCE_BINDINGS}' }],
      ['malformed JSON', undefined, { raw: '{not json' }],
      ['empty object', {}, {}],
      ['relative repository', Object.fromEntries(Object.entries(bindings).map(([key, value]) => [key, { ...value, repository: 'repo' }])), {}],
    ];
    for (const [label, value, options] of variants) {
      await withClient(value, async client => {
        const listed = await client.request('tools/list');
        assert.equal(listed.result.tools.length, 3, `${label}: tools stay listed`);
        const results = [await client.call('identity', {}), await client.call('diff', {}), await client.call('content', { slot: 'candidate', path: 'tracked.txt' })];
        for (const result of results) {
          assert.equal(result.isError, true, label);
          assert.match(textOf(result).join(' '), /unavailable/u, label);
        }
        if (label !== 'relative repository') assert.match(textOf(results[0]).join(' '), /binding is missing|invalid|JSON/u, label);
      }, options);
    }
    // Only the content binding is bound: identity and diff stay unavailable while content works.
    await withClient({ 'isswf.git-evidence.content/1': bindings['isswf.git-evidence.content/1'] }, async client => {
      assert.equal((await client.call('identity', {})).isError, true);
      assert.equal((await client.call('diff', {})).isError, true);
      assert.equal((await client.call('content', { slot: 'candidate', path: 'tracked.txt' })).isError, undefined);
    });
  });

  await check('extra, missing or mistyped arguments and unknown tools are rejected without running the CLI', async () => {
    await withClient(bindings, async client => {
      for (const [name, args, pattern] of [
        ['identity', { repository: workspace }, /accepts no arguments/u],
        ['diff', { revision: 'HEAD' }, /accepts only/u],
        ['diff', { chunk: 1, repository: workspace }, /accepts only/u],
        ['diff', { chunk: 0 }, /positive integer/u],
        ['diff', { chunk: 1.5 }, /positive integer/u],
        ['diff', { chunk: '1' }, /positive integer/u],
        ['content', { slot: 'candidate', path: 'tracked.txt', repository: workspace }, /allowlisted path/u],
        ['content', { slot: 'candidate' }, /allowlisted path/u],
        ['content', { slot: 'HEAD', path: 'tracked.txt' }, /allowlisted path/u],
        ['content', { slot: 'candidate', path: 7 }, /allowlisted path/u],
        ['identity', [], /arguments/u],
        ['content', 'tracked.txt', /arguments/u],
      ]) {
        const result = await client.call(name, args);
        assert.equal(result.isError, true, `${name} ${JSON.stringify(args)}`);
        assert.match(textOf(result).join(' '), pattern);
      }
      assert.equal((await client.call('identity')).isError, undefined, 'omitted arguments mean no arguments');
      const outOfRange = await client.call('diff', { chunk: 2 });
      assert.equal(outOfRange.isError, true);
      assert.match(textOf(outOfRange).join(' '), /out of range/u);
      const unknown = await client.request('tools/call', { name: 'bash', arguments: { command: 'id' } });
      assert.equal(unknown.error.code, -32602);
      assert.equal((await client.request('tools/call', {})).error.code, -32602);
    });
  });

  await check('a substituted CLI with tampered or inconsistent output is rejected by the shared verifier', async () => {
    const sandbox = join(root, 'tampered');
    await mkdir(sandbox);
    for (const name of ['git-evidence-mcp.mjs', 'git-evidence-invoke.mjs']) await copyFile(join(source, 'tools', name), join(sandbox, name));
    const realUrl = pathToFileURL(join(source, 'tools/git-evidence.mjs')).href;
    await writeFile(join(sandbox, 'git-evidence.mjs'), `import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
export { validateDiffBinding, validateBinding, validateContentBinding } from ${JSON.stringify(realUrl)};
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const input = Buffer.concat(chunks).toString('utf8');
  const binding = JSON.parse(input);
  const mode = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'mode.txt'), 'utf8');
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  const [, , operation, slot, path] = process.argv;
  const bytes = Buffer.from('original\\n');
  const evidence = operation === 'diff'
    ? { version: 1, status: 'ok', operation, repository: binding.repository, baseSha: binding.baseSha, candidateSha: binding.candidateSha, bindingSha256: sha(input), patchEncoding: 'base64', patchBytes: bytes.length, patchSha256: sha(bytes), patch: bytes.toString('base64'), limits: {} }
    : { version: 1, status: 'ok', operation, repository: binding.repository, baseSha: binding.baseSha, candidateSha: binding.candidateSha, commitSha: slot === 'base' ? binding.baseSha : binding.candidateSha, path, bindingSha256: sha(input), contentEncoding: 'base64', contentBytes: bytes.length, contentSha256: sha(bytes), content: bytes.toString('base64'), limits: {} };
  const digestKey = operation === 'diff' ? 'patchSha256' : 'contentSha256';
  const lengthKey = operation === 'diff' ? 'patchBytes' : 'contentBytes';
  const dataKey = operation === 'diff' ? 'patch' : 'content';
  if (mode === 'bad-sha') evidence[digestKey] = sha('other');
  if (mode === 'bad-length') evidence[lengthKey] += 1;
  if (mode === 'non-canonical-base64') evidence[dataKey] = evidence[dataKey].replace(/=*$/u, '') + '\\n';
  if (mode === 'wrong-commit') evidence.commitSha = binding.baseSha;
  if (mode === 'wrong-path') evidence.path = 'other.txt';
  if (mode === 'wrong-binding') evidence.bindingSha256 = '0'.repeat(64);
  if (mode === 'wrong-operation') evidence.operation = operation === 'diff' ? 'content' : 'diff';
  if (mode === 'not-json') { process.stdout.write('not json\\n'); process.exit(0); }
  process.stdout.write(JSON.stringify(evidence) + '\\n');
}
`);
    const setMode = mode => writeFile(join(sandbox, 'mode.txt'), mode);
    const client = new Client(join(sandbox, 'git-evidence-mcp.mjs'), bindings);
    try {
      await client.start();
      await setMode('control');
      const control = await client.call('content', { slot: 'candidate', path: 'tracked.txt' });
      assert.equal(control.isError, undefined, 'a consistent substituted CLI result is accepted');
      assert.equal(control.content[1].text, 'original\n');
      assert.equal((await client.call('diff', {})).content[1].text, 'original\n');
      const cases = [
        ['bad-sha', 'content', /integrity check failed/u], ['bad-length', 'content', /integrity check failed/u], ['non-canonical-base64', 'content', /integrity check failed|invalid/u],
        ['wrong-commit', 'content', /mismatched bound provenance/u], ['wrong-path', 'content', /mismatched bound provenance/u], ['wrong-binding', 'content', /mismatched bound provenance/u],
        ['wrong-operation', 'content', /invalid result/u], ['not-json', 'content', /invalid bounded output/u],
        ['bad-sha', 'diff', /integrity check failed/u], ['bad-length', 'diff', /integrity check failed/u], ['non-canonical-base64', 'diff', /integrity check failed/u],
        ['wrong-operation', 'diff', /invalid result/u], ['not-json', 'diff', /invalid bounded output/u],
      ];
      for (const [mode, name, pattern] of cases) {
        await setMode(mode);
        const result = await client.call(name, name === 'diff' ? {} : { slot: 'candidate', path: 'tracked.txt' });
        assert.equal(result.isError, true, `${mode} ${name}`);
        assert.match(textOf(result).join(' '), pattern, `${mode} ${name}`);
        assert.equal(result.content.length, 1, `${mode} ${name}: no evidence text is passed through`);
      }
    } finally { await client.close(); }
  });

  await check('calls leave the repository, index, config and working tree byte-identical', async () => {
    const porcelainBefore = gitRun(['status', '--porcelain']);
    const before = await snapshot(workspace);
    await withClient(bindings, async client => {
      await client.call('identity', {});
      await client.call('diff', {});
      for (const slot of ['base', 'candidate']) for (const path of ['tracked.txt', 'exact.txt', 'binary.dat', 'absent.txt', 'unlisted.txt']) await client.call('content', { slot, path });
    });
    const after = await snapshot(workspace);
    assert.equal(gitRun(['status', '--porcelain']), porcelainBefore);
    assert.deepEqual([...after.keys()].sort(), [...before.keys()].sort(), 'no file was created or removed');
    assert.deepEqual([...after.entries()], [...before.entries()], 'no file bytes or modification times changed');
    assert.equal(await readFile(join(workspace, 'tracked.txt'), 'utf8'), 'WORKING TREE CANARY\n');
  });

  await check('stalled, partial and oversized stdin neither hangs the server nor corrupts a frame', async () => {
    // A frame split across a stall is reassembled and answered once complete.
    const split = new Client(server, bindings);
    try {
      await split.start();
      const text = JSON.stringify({ jsonrpc: '2.0', id: 900, method: 'tools/list' });
      const reply = new Promise(done => split.pending.set(900, done));
      split.child.stdin.write(text.slice(0, 10));
      await new Promise(done => setTimeout(done, 400));
      assert.deepEqual(split.unsolicited, []);
      split.child.stdin.write(text.slice(10) + '\r\n');
      assert.equal((await reply).result.tools.length, 3, 'CRLF-terminated frames are accepted');
    } finally { await split.close(); }
    // A partial frame followed by EOF exits promptly with no output and no hang.
    const partial = new Client(server, bindings);
    await partial.start();
    partial.child.stdin.write('{"jsonrpc":"2.0","id":901,"method":"tools/li');
    const closed = await partial.close();
    assert.equal(closed.code, 0);
    assert.equal(closed.signal, null);
    assert.equal(partial.stdout, '');
    assert.equal(partial.stderr, '');
    // A frame beyond the bounded line size gets a bounded error and the server stops.
    const oversized = new Client(server, bindings);
    await oversized.start();
    oversized.child.stdin.write('x'.repeat(70000));
    const stopped = await Promise.race([oversized.exit, new Promise(done => setTimeout(() => done('hung'), 5000))]);
    assert.notEqual(stopped, 'hung', 'oversized input stops the server');
    assert.notEqual(stopped.code, 0);
    assert.equal(oversized.unsolicited[0].error.code, -32600);
    // Malformed JSON gets a parse error and the server keeps serving.
    const malformed = new Client(server, bindings);
    try {
      await malformed.start();
      const parse = new Promise(done => malformed.pending.set(null, done));
      malformed.child.stdin.write('{broken\n');
      assert.equal((await parse).error.code, -32700);
      assert.equal((await malformed.request('tools/list')).result.tools.length, 3);
    } finally { await malformed.close(); }
    // Closing stdin while idle exits cleanly.
    const idle = new Client(server, bindings);
    await idle.start();
    assert.equal((await idle.close()).code, 0);
  });

  await check('a maximal valid three-namespace binding stays within the Windows environment block budget', async () => {
    const paths = Array.from({ length: 64 }, (_, index) => `${'d'.repeat(120)}${String(index).padStart(3, '0')}.txt`);
    const maximal = { ...common, repository: 'C:\\' + 'r'.repeat(200), gitExecutable: 'C:\\' + 'g'.repeat(200) + '\\git.exe', baseSha: 'a'.repeat(64), candidateSha: 'b'.repeat(64) };
    const text = JSON.stringify({ 'isswf.git-evidence/1': { ...maximal, outputBytes: 8192 }, 'isswf.git-evidence.diff/1': { ...maximal, outputBytes: 192000 }, 'isswf.git-evidence.content/1': { ...maximal, outputBytes: 65536, paths } });
    assert.ok(text.length < 16000, `binding environment value is ${text.length} characters`);
  });

  // Last: it adds a commit, so HEAD moves away from the identity fixture.
  await check('a large diff is delivered as numbered UTF-8-aligned chunks that concatenate to the full-patch digest', async () => {
    const lines = Array.from({ length: 4000 }, (_, index) => `line ${index} \u00e9\u4e2d\u{1f600} ${'x'.repeat(index % 17)}\n`);
    await writeFile(join(workspace, 'big.txt'), lines.join(''));
    await writeFile(join(workspace, 'huge.txt'), 'a'.repeat(60000));
    gitRun(['add', 'big.txt', 'huge.txt']);
    commit('large');
    const large = gitRun(['rev-parse', 'HEAD']);
    const bigBindings = {
      'isswf.git-evidence/1': { ...common, candidateSha: large, outputBytes: 4096 },
      'isswf.git-evidence.diff/1': { ...common, baseSha: candidate, candidateSha: large, outputBytes: 192000 },
      'isswf.git-evidence.content/1': { ...common, candidateSha: large, outputBytes: 65536, paths: ['huge.txt', 'big.txt'] },
    };
    await withClient(bigBindings, async client => {
      const first = await client.call('diff', {});
      assert.equal(first.isError, undefined);
      const head = JSON.parse(first.content[0].text);
      assert.ok(head.chunkCount >= 4, `expected several chunks, got ${head.chunkCount}`);
      assert.ok(head.patchBytes > 100000);
      const parts = [], views = [];
      for (let number = 1; number <= head.chunkCount; number += 1) {
        const result = await client.call('diff', { chunk: number });
        assert.equal(result.isError, undefined, `chunk ${number}`);
        const meta = JSON.parse(result.content[0].text);
        assert.equal(meta.chunk, number);
        assert.equal(meta.chunkCount, head.chunkCount);
        assert.equal(meta.patchSha256, head.patchSha256, 'every chunk carries the full-patch digest');
        assert.equal(meta.patchBytes, head.patchBytes, 'every chunk carries the full-patch length');
        const bytes = Buffer.from(meta.chunkBase64, 'base64');
        assert.equal(bytes.length, meta.chunkBytes);
        assert.equal(sha256(bytes), meta.chunkSha256);
        assert.ok(bytes.length <= 24576);
        assert.equal(result.content[1].text, bytes.toString('utf8'), 'chunk boundaries never split a UTF-8 character');
        const total = result.content.reduce((sum, block) => sum + Buffer.byteLength(block.text), 0);
        assert.ok(total < 98304, `chunk ${number} is ${total} bytes`);
        parts.push(bytes);
        views.push(result.content[1].text);
      }
      const whole = Buffer.concat(parts);
      assert.equal(whole.length, head.patchBytes);
      assert.equal(sha256(whole), head.patchSha256, 'completeness holds only when the concatenation matches the digest');
      assert.equal(views.join(''), whole.toString('utf8'));
      assert.match(whole.toString('utf8'), /\+line 3999 /u);
      const beyond = await client.call('diff', { chunk: head.chunkCount + 1 });
      assert.equal(beyond.isError, true);
      assert.match(textOf(beyond).join(' '), /out of range/u);
      const refused = await client.call('content', { slot: 'candidate', path: 'huge.txt' });
      assert.equal(refused.isError, true, 'a content result over the Claude display bound is refused whole');
      assert.match(textOf(refused).join(' '), /display bound/u);
      assert.equal(refused.content.length, 1);
      assert.doesNotMatch(refused.content[0].text, /aaaa/u, 'no partial bytes accompany the refusal');
    });
  });
} finally {
  await rm(root, { recursive: true, force: true });
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL ${failure.name}\n  ${failure.message}`);
  console.error(`${failures.length} failed, ${passed.length} passed`);
  process.exitCode = 1;
} else console.log(JSON.stringify({ status: 'PASS', platform: process.platform, checks: passed }));
