import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { request } from 'node:http';
import { mkdtemp, mkdir, writeFile, readFile, readdir, lstat, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] ?? '.');
const { startPanel } = await import(pathToFileURL(join(source, 'tools/isswf-panel.mjs')));
const { status } = await import(pathToFileURL(join(source, 'tools/isswf-status.mjs')));
const root = await mkdtemp(join(tmpdir(), 'isswf-panel-test-')), project = join(root, 'project');
await mkdir(project);
const run = (binary, args) => { const r = spawnSync(binary, args, { encoding: 'utf8', timeout: 15000 }); assert.equal(r.status, 0, r.stderr); return r; };
run('git', ['init', '-q', project]);
async function tree(path) {
  const output = {};
  for (const name of (await readdir(path)).sort()) {
    const p = join(path, name), stat = await lstat(p);
    output[name] = stat.isSymbolicLink() ? 'symlink' : stat.isDirectory() ? await tree(p) : createHash('sha256').update(await readFile(p)).digest('hex');
  }
  return output;
}
const get = (url, path = '/', headers = {}, method = 'GET') => new Promise((done, reject) => {
  const req = request(new URL(path, url), { method, headers, agent: false }, response => { let body = ''; response.setEncoding('utf8'); response.on('data', data => body += data); response.on('end', () => done({ code: response.statusCode, headers: response.headers, body })); });
  req.on('error', reject); req.end();
});
let panel;
try {
  const proposal = join(root, 'proposal.json'), grant = join(root, 'grant.json');
  await writeFile(proposal, JSON.stringify({ version: 1, initiative: 'I0001', title: 'Factory <script>bad()</script>', type: 'enhancement', jobs: [{ id: 'J001', objective: 'Review <img src=x onerror=bad()>', status: 'awaiting-human', dependsOn: [], acceptance: ['Readable evidence & limits'], blocker: 'Await operator decision', nextStep: 'Explain acceptance to coordinator', evidence: ['https://github.com/example/repo/pull/1'] }, { id: 'J002', objective: 'Missing brief', status: 'pending', dependsOn: ['J001'], acceptance: ['An observable result'], blocker: 'Not prepared', nextStep: 'Prepare', evidence: [] }] }));
  await writeFile(grant, JSON.stringify({ version: 1, project, initiative: 'I0001', reference: 'Synthetic plan-only grant', permissions: ['plan'] }));
  run(process.execPath, [join(source, 'tools/isswf-plan.mjs'), 'prepare', '--project', project, '--initiative', 'I0001', '--proposal', proposal, '--grant', grant]);
  const job = join(project, '.factory/initiatives/I0001/jobs/J001'); await mkdir(job, { recursive: true });
  await writeFile(join(job, 'brief-r1.md'), '# Test brief\n');
  await writeFile(join(job, 'A001.md'), '# Synthetic attempt\n- Reported status: partial\n- Requested model and effort: synthetic/model, high\n- Profile path and revision, if available: own-profile.md at synthetic-pin\n- Skills and revisions, if available: available-reference.md (supplied, not proven applied)\n');
  const delivery = '# Delivery summary\n\n## What changed and why\n\nVisible result <script>not-code</script>\n\n## Visual summary\n\nActual synthetic demo.\n\n## Checks and results\n\nA check passed within this fixture only.\n\n## Independent review\n\nNot run: fixture.\n\n## Scope\n\nNo execution.\n\n## Closure and acceptance\n\nPending operator decision.\n';
  await writeFile(join(job, 'delivery.md'), delivery);
  const before = await tree(project);
  panel = await startPanel({ project, initiative: 'I0001', port: 0 });
  assert.equal(panel.server.address().address, '127.0.0.1');
  const page = await get(panel.url);
  assert.equal(page.code, 200); assert.match(page.headers['content-type'], /text\/html; charset=utf-8/u);
  assert.equal(page.headers['x-content-type-options'], 'nosniff'); assert.equal(page.headers['cache-control'], 'no-store');
  assert.match(page.headers['content-security-policy'], /default-src 'none'/u); assert.equal(page.headers['access-control-allow-origin'], undefined);
  assert.match(page.body, /I0001 · Factory &lt;script&gt;bad\(\)&lt;\/script&gt;/u);
  assert.match(page.body, /J001 · Review &lt;img src=x onerror=bad\(\)&gt;/u);
  assert.match(page.body, /Visible result &lt;script&gt;not-code&lt;\/script&gt;/u);
  assert.equal(page.body.includes('<script>'), false); assert.equal(page.body.includes('<img'), false);
  assert.equal((page.body.match(/class="lane"/gu) ?? []).length, 6);
  assert.match(page.body, /data-state="awaiting-human"/u); assert.match(page.body, /href="#detail-J001"/u);
  assert.match(page.body, /class="job-detail" id="detail-J001"/u);
  assert.match(page.body, /synthetic\/model, high/u);
  assert.match(page.body, /no demuestra que se haya aplicado/u);
  assert.match(page.body, /Actual synthetic demo/u); assert.match(page.body, /No consta en la entrega/u);
  assert.match(page.body, /Decisión pendiente del operador/u); assert.match(page.body, /no actividad comprobada de procesos/u);
  const api = await get(panel.url, '/api/status'); assert.equal(api.code, 200);
  const data = JSON.parse(api.body), direct = await status({ project, initiative: 'I0001' });
  delete data.observedAt; delete direct.observedAt; assert.deepEqual(data, direct);
  assert.equal(data.jobs[0].artifacts.delivery.sections['Visual summary'], 'Actual synthetic demo.');
  assert.equal(data.jobs[1].artifacts.status, 'not-prepared');
  for (const headers of [{ host: 'evil.example' }, { host: 'localhost:' + panel.server.address().port }, { origin: 'https://evil.example' }, { 'sec-fetch-site': 'cross-site' }, { 'sec-fetch-site': 'same-site' }]) assert.equal((await get(panel.url, '/', headers)).code, 403);
  assert.equal((await get(panel.url, '/', { origin: panel.url, 'sec-fetch-site': 'same-origin' })).code, 200);
  assert.equal((await get(panel.url, '/', {}, 'POST')).code, 405);
  assert.equal((await get(panel.url, '/', {}, 'OPTIONS')).code, 405);
  for (const path of ['/private', '/.git/config', '/api/status?project=/other', '/accept/J001']) assert.equal((await get(panel.url, path)).code, 404);
  assert.deepEqual(await tree(project), before);
  await writeFile(join(job, 'delivery.md'), delivery + '\n## Visual summary\nRepeated\n');
  assert.equal(JSON.parse((await get(panel.url, '/api/status')).body).jobs[0].artifacts.delivery.status, 'unknown');
  await writeFile(join(job, 'delivery.md'), '# Delivery\n## Visual summary\n' + 'x'.repeat(33000));
  assert.equal(JSON.parse((await get(panel.url, '/api/status')).body).jobs[0].artifacts.delivery.status, 'unknown');
  await rm(join(job, 'delivery.md')); await symlink(grant, join(job, 'delivery.md'));
  assert.equal(JSON.parse((await get(panel.url, '/api/status')).body).jobs[0].artifacts.delivery.status, 'unknown');
  await rm(join(job, 'delivery.md'));
  assert.equal(JSON.parse((await get(panel.url, '/api/status')).body).jobs[0].artifacts.delivery.status, 'absent');
  await symlink(root, join(project, '.factory/initiatives/I0001/jobs/J002'));
  assert.equal(JSON.parse((await get(panel.url, '/api/status')).body).jobs[1].artifacts.status, 'unknown');
  await rm(join(project, '.factory/initiatives/I0001/plan.md'));
  const absent = await get(panel.url); assert.match(absent.body, /Plan no disponible/u); assert.match(absent.body, /no se interpreta como una lista vacía/u);
  console.log('PASS readonly panel: actual loopback HTTP, canonical data/cards, explicit missing evidence, hostile text escaping, host/origin/method/path refusal, unsafe/absent records and unchanged project bytes; no provider calls');
} finally { if (panel) await new Promise(done => panel.server.close(done)); await rm(root, { recursive: true, force: true }); }
