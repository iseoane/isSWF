#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { recordResponse } from './isswf-response.mjs';
import { isAbsolute, resolve } from 'node:path';
import { realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { initiatives, status } from './isswf-status.mjs';

const escape = value => String(value ?? '').replace(/[&<>"']/gu, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const names = { pending: 'Pending', 'in-progress': 'In progress', blocked: 'Blocked', 'in-review': 'In review', 'awaiting-human': 'Awaiting human', completed: 'Complete according to the plan' };
const list = values => `<ul>${values.map(value => `<li>${escape(value)}</li>`).join('')}</ul>`;
const recommendationSection = (value, href) => `<section><h2>Recommended next step</h2><p><strong>${escape(value?.title ?? 'Unavailable')}</strong></p><p>${escape(value?.reason ?? 'No recommendation observed.')}</p>${value?.jobId ? `<p><a href="${escape(href)}">Open details for ${escape(value.jobId)}</a></p>` : ''}<p>This is a suggestion; it does not authorize execution.</p></section>`;
function card(job, snapshot, token) {
  const artifact = job.artifacts, delivery = artifact.delivery;
  const section = (name, title) => `<section><h4>${title}</h4><pre>${escape(delivery?.sections?.[name] || 'Not recorded in the delivery. The coordinator must supply this information before requesting acceptance.')}</pre></section>`;
  const reports = artifact.reports ?? [];
  return `<article><header><h2>${escape(job.id)} · ${escape(job.objective)}</h2><strong>${escape(names[job.reportedStatus] ?? job.reportedStatus)}</strong></header>
  <p>State reported in the plan, not verified process activity.</p>
  <dl><dt>Depends on</dt><dd>${escape(job.dependencies.join(', ') || 'No dependencies reported')}</dd><dt>Reported blocker</dt><dd>${escape(job.blocker)}</dd><dt>Next step</dt><dd>${escape(job.nextStep)}</dd><dt>Job record</dt><dd>${escape(artifact.status)}</dd></dl>
  <h3>What was requested</h3>${list(job.acceptance)}
  <h3>Delivery and acceptance record</h3><p>Delivery: ${escape(delivery?.status ?? 'unavailable')}. A finished process does not imply delivery or approval.</p>
  ${section('What changed and why', 'What was delivered')}${section('Visual summary', 'Demonstration')}${section('Checks and results', 'Checks and evidence')}${section('Independent review', 'Independent review')}${section('Scope', 'Scope and exclusions')}${section('Integration risk and recovery', 'Limits and risks')}${section('Closure and acceptance', 'Requested decision and recorded acceptance')}
  <p><b>${job.reportedStatus === 'awaiting-human' ? 'Operator decision pending: definition, setup, acceptance or PR integration. Answer the recorded question through the coordinator; the note does not accept work, approve integration or change job state.' : 'State and decisions are recorded through the coordinator; a note does not change them.'}</b></p>
  <h3>Responses for the coordinator</h3><p>Local-session notes with an unauthenticated author. Recording a note does not accept work, change the plan, or grant execution permission.</p>
  <p>Response readback: ${escape(artifact.responses?.status ?? 'unavailable')}.</p>${list((artifact.responses?.records ?? []).map(record => record.recordedAt + ' · Note recorded, not applied: ' + record.note))}
  ${token && artifact.brief?.sha256 && ['recorded', 'absent'].includes(delivery?.status) ? `<form method="post" action="/responses/${escape(snapshot.initiative)}/${escape(job.id)}"><input type="hidden" name="token" value="${escape(token)}"><input type="hidden" name="responseId" value="${randomBytes(16).toString('hex')}"><input type="hidden" name="planSha256" value="${escape(snapshot.plan.sha256)}"><input type="hidden" name="briefSha256" value="${escape(artifact.brief.sha256)}"><input type="hidden" name="deliverySha256" value="${escape(delivery?.sha256 ?? '')}"><label>Response or requested changes (maximum 4000 bytes, no credentials)<br><textarea name="note" required maxlength="4000" rows="4" style="width:95%"></textarea></label><p><button type="submit">Record note for the coordinator</button></p></form>` : '<p>A note cannot be recorded without a readable brief and delivery state. Refresh or consult the coordinator.</p>'}
  <h3>Recorded agents and methodology</h3><p>This is not live telemetry. A supplied profile or reference does not prove it was applied. Unrecorded effective use is unknown.</p>
  ${reports.some(report => Object.keys(report.declaredMetadata ?? {}).length) ? reports.filter(report => Object.keys(report.declaredMetadata ?? {}).length).map(report => `<h4>Report ${escape(report.path.split('/').at(-1))}</h4><dl>${Object.entries(report.declaredMetadata).map(([key, value]) => `<dt>${escape(key)}</dt><dd>${escape(value)}</dd>`).join('')}</dl>`).join('') : '<p>No role, model/effort, or execution references are recorded in the recognized report fields.</p>'}
  <details><summary>Provenance and references</summary><p>Consult original files only if you need more detail. These references are reported data, not current PR verification.</p>${list(job.evidence)}
  <p>Brief: ${escape(artifact.brief?.path ?? 'Unavailable')}<br>SHA256: ${escape(artifact.brief?.sha256 ?? 'Unknown')}</p>
  <p>Delivery: ${escape(delivery?.path ?? 'Unavailable')}<br>SHA256: ${escape(delivery?.sha256 ?? 'Unknown')}<br>Modified: ${escape(delivery?.modifiedAt ?? 'Unknown')}</p>
  ${list(reports.map(report => `${report.path} | SHA256 ${report.sha256} | ${report.modifiedAt} | Reported: ${report.reportedStatus ?? 'not recorded'}`))}</details></article>`;
}
function board(jobs) {
  return `<div class="board" id="board" role="region" aria-label="Job board by phase" tabindex="0">${Object.entries(names).map(([state, name]) => {
    const items = jobs.filter(job => job.reportedStatus === state);
    return `<section class="lane" data-state="${escape(state)}"><h2>${escape(name)} <small>${items.length}</small></h2>${items.map(job => `<div class="tile"><b>${escape(job.id)}</b><p>${escape(job.objective)}</p><p class="tile-meta">${escape(job.dependencies.length ? 'Depends on ' + job.dependencies.join(', ') : 'No dependencies reported')}</p><a href="#detail-${escape(job.id)}">View record and evidence</a></div>`).join('') || '<p>No jobs in this phase.</p>'}</section>`;
  }).join('')}</div>`;
}
export function renderPanel(snapshot, token) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(snapshot.label ?? 'State unavailable')} · isSWF</title>
  <style>body{font:16px system-ui,sans-serif;max-width:1800px;margin:auto;padding:24px;background:#10161d;color:#e5edf7}a{color:#9bd5ff}article{border:1px solid #52616f;border-radius:12px;padding:20px;margin:24px 0;background:#18222d}h2{font-size:1.3rem}h3{border-top:1px solid #52616f;padding-top:16px}h4{margin-bottom:6px}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}dt{font-weight:bold;margin-top:10px}dd{margin-left:0;overflow-wrap:anywhere}.notice{border-left:4px solid #ffc567;padding:12px;background:#25313e}details{margin-top:16px}li{overflow-wrap:anywhere}.board{display:grid;grid-template-columns:repeat(6,minmax(250px,1fr));gap:14px;overflow-x:auto;padding:16px 0;align-items:start}.lane{background:#18222d;border:1px solid #52616f;border-radius:12px;padding:12px;min-width:0}.lane h2{font-size:1rem;min-height:2.5em}.lane small{background:#3c5164;border-radius:12px;padding:2px 8px}.tile{background:#253443;border:1px solid #52616f;border-left:4px solid #80bfff;border-radius:8px;padding:12px;margin:12px 0}.tile p{font-size:.9rem;margin:8px 0;overflow-wrap:anywhere}.tile-meta{color:#becbd9}.job-detail{display:none;margin-top:24px;max-width:1000px}.job-detail:target{display:block}a{display:inline-block;min-height:26px}.lane[data-state=completed] .tile{border-left-color:#7edca3}.lane[data-state=awaiting-human] .tile{border-left-color:#ffc567}.lane[data-state=blocked] .tile{border-left-color:#ff8b8b}@media(max-width:650px){body{padding:12px}.board{grid-template-columns:repeat(6,260px)}} </style></head>
  <body><h1>${escape(snapshot.label ?? 'State unavailable')}</h1><p>Local project panel. <a href="/">All initiatives</a> · <a href="/i/${escape(snapshot.initiative)}">Refresh</a> · <a href="/api/status/${escape(snapshot.initiative)}">View data and provenance</a></p>
  <div class="notice"><b>This is neither a live-process view nor execution authorization.</b><p>Queried: ${escape(snapshot.observedAt)}. Activity: ${escape(snapshot.processState)}. Freshness: ${escape(snapshot.freshness)}. There is no current verification of PRs, models, slots, or satisfied dependencies.</p></div>
  ${snapshot.status === 'observed' ? `<p>On small screens, scroll the board horizontally to see every phase.</p><p>${snapshot.jobs.length} jobs in the canonical plan. Plan modified: ${escape(snapshot.plan.modifiedAt)}.</p>${recommendationSection(snapshot.recommendation, '#detail-' + (snapshot.recommendation?.jobId ?? ''))}${board(snapshot.jobs)}${snapshot.jobs.map(job => `<section class="job-detail" id="detail-${escape(job.id)}"><a href="#board">Back to board</a>${card(job, snapshot, token)}</section>`).join('')}` : `<h2>Plan unavailable</h2><p>State: ${escape(snapshot.status)}. ${escape(snapshot.reason ?? 'No canonical record is available; this is not interpreted as an empty job list.')}</p>`}
  <footer><p>${escape(snapshot.limits)}</p><p>Only authorized project data. Loopback is neither authentication nor isolation from other local processes. Records must contain display-safe evidence, never credentials. No arbitrary files are served and no commands are executed.</p></footer></body></html>`;
}
function renderInitiatives(snapshot) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Initiatives · isSWF</title><style>body{font:16px system-ui,sans-serif;max-width:1100px;margin:auto;padding:24px;background:#10161d;color:#e5edf7}a{color:#9bd5ff}article{border:1px solid #52616f;border-radius:12px;padding:20px;margin:20px 0;background:#18222d}h2,p,li{overflow-wrap:anywhere}</style></head><body><h1>Project initiatives</h1><p><a href="/">Refresh</a> · <a href="/api/status">View data and provenance</a></p><p>Read-only plans; local notes for the coordinator. Reported states, not live activity or authorization. Queried: ${escape(snapshot.observedAt)}.</p>
  ${snapshot.status === 'observed' ? (snapshot.initiatives.map(item => `<article><h2>${escape(item.label ?? item.initiative)}</h2>${item.status === 'observed' ? `<p>${item.counts.completed} of ${item.jobs} jobs complete according to the plan.</p>${recommendationSection(item.recommendation, '/i/' + item.initiative + '#detail-' + (item.recommendation?.jobId ?? ''))}${list(Object.entries(names).map(([state, name]) => name + ': ' + item.counts[state]))}${list(item.blockers.map(job => job.id + ': ' + job.blocker))}<p>Plan modified: ${escape(item.planModifiedAt)}.</p>` : `<p>State unavailable: ${escape(item.status)} · ${escape(item.reason)}. This is not interpreted as zero progress.</p>`}<a href="/i/${escape(item.initiative)}">Open Kanban</a></article>`).join('') || '<p>No initiatives with canonical identifiers were found. Other records are not assumed valid.</p>') : `<h2>Listing unavailable</h2><p>${escape(snapshot.status)} · ${escape(snapshot.reason)}</p>`}
  <footer><p>No verification of processes, PRs, freshness, or satisfied dependencies. Loopback is not authentication. Records are read separately.</p></footer></body></html>`;
}
export async function startPanel({ project, initiative, port = 0 }) {
  assert(typeof project === 'string' && isAbsolute(project) && (initiative === undefined || (typeof initiative === 'string' && /^[A-Z][A-Z0-9-]{0,63}$/u.test(initiative))), 'explicit-project-initiative-required');
  assert(Number.isSafeInteger(port) && port >= 0 && port <= 65535, 'invalid-port');
  project = await realpath(project);
  const first = await initiatives({ project });
  assert(first.status !== 'unknown', 'unsafe-or-unreadable-project');
  let origin; const token = randomBytes(32).toString('hex');
  const server = createServer({ maxHeaderSize: 8192 }, async (request, response) => {
    const send = (code, type, value) => {
      response.writeHead(code, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'", 'Referrer-Policy': 'same-origin', 'Allow': 'GET, POST' }); response.end(value);
    };
    if (request.headers.host !== origin?.slice('http://'.length) || (request.headers.origin && request.headers.origin !== origin) || (request.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(request.headers['sec-fetch-site']))) return send(403, 'text/plain', 'Forbidden: open the loopback URL directly on this machine.');
    if (request.method === 'POST') {
      const route = /^\/responses\/([A-Z][A-Z0-9-]{0,63})\/([A-Z][A-Z0-9-]{0,63})$/u.exec(request.url);
      if (!route) return send(405, 'text/plain', 'No action on this route.');
      if (request.headers.origin !== origin || request.headers['content-type'] !== 'application/x-www-form-urlencoded') return send(403, 'text/plain', 'Local form origin and encoding required.');
      try {
        let size = 0; const chunks = [];
        for await (const chunk of request) { size += chunk.length; if (size > 32768) { send(413, 'text/plain', 'Response body too large.'); return; } chunks.push(chunk); }
        const fields = new URLSearchParams(Buffer.concat(chunks).toString('utf8'));
        const keys = ['token', 'responseId', 'planSha256', 'briefSha256', 'deliverySha256', 'note'];
        if ([...fields.keys()].length !== keys.length || keys.some(key => fields.getAll(key).length !== 1)) return send(400, 'text/plain', 'Invalid form fields.');
        const supplied = fields.get('token');
        if (!/^[a-f0-9]{64}$/u.test(supplied) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(token))) return send(403, 'text/plain', 'Invalid local session token.');
        const fresh = await status({ project, initiative: route[1] }), job = fresh.jobs?.find(job => job.id === route[2]);
        if (fresh.status !== 'observed' || !job?.artifacts.brief || !['recorded', 'absent'].includes(job.artifacts.delivery?.status) || fresh.plan.sha256 !== fields.get('planSha256') || job.artifacts.brief.sha256 !== fields.get('briefSha256') || (job.artifacts.delivery.sha256 ?? '') !== fields.get('deliverySha256')) return send(409, 'text/plain', 'Displayed evidence changed or unavailable. Refresh before responding; nothing recorded.');
        await recordResponse({ project, initiative: route[1], jobId: route[2], responseId: fields.get('responseId'), note: fields.get('note'), planSha256: fields.get('planSha256'), briefSha256: fields.get('briefSha256'), deliverySha256: fields.get('deliverySha256') || null });
        return send(201, 'text/html', '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Note recorded</title><style>body{font:16px system-ui,sans-serif;max-width:800px;margin:auto;padding:24px;background:#10161d;color:#e5edf7}a{color:#9bd5ff}</style><h1>Note recorded, not applied</h1><p>The coordinator must review the note. It does not change state, accept work, or authorize execution.</p><a href="/i/' + route[1] + '#detail-' + route[2] + '">Back to record</a></html>');
      } catch (error) { return send(error.code === 'EEXIST' ? 409 : 400, 'text/plain', 'Response not confirmed. Inspect the job records before submitting again; no automatic retry.'); }
    }
    if (request.method !== 'GET') return send(405, 'text/plain', 'Unsupported method.');
    const selected = /^\/(i|api\/status)\/([A-Z][A-Z0-9-]{0,63})$/u.exec(request.url);
    if (!selected && !['/', '/api/status'].includes(request.url)) return send(404, 'text/plain', 'Not found.');
    try {
      const snapshot = selected ? await status({ project, initiative: selected[2] }) : await initiatives({ project });
      const html = request.url === '/' || selected?.[1] === 'i';
      const type = html ? 'text/html' : 'application/json';
      const body = html ? (selected ? renderPanel(snapshot, token) : renderInitiatives(snapshot)) : JSON.stringify(snapshot);
      if (Buffer.byteLength(body) > 2 * 1024 * 1024) return send(413, 'text/plain', 'Snapshot exceeds the panel response bound; inspect the scoped records through the coordinator.');
      return send(200, type, body);
    } catch { return send(503, 'text/plain', 'Status unavailable; no state transition performed.'); }
  });
  server.requestTimeout = 5000; server.headersTimeout = 5000; server.keepAliveTimeout = 1000;
  await new Promise((done, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', done); });
  origin = 'http://127.0.0.1:' + server.address().port;
  return { server, url: origin, initialUrl: origin + (initiative ? '/i/' + initiative : '/') };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2), options = {};
    assert(args.length % 2 === 0, 'invalid-options');
    for (let i = 0; i < args.length; i += 2) { const key = { '--project': 'project', '--initiative': 'initiative', '--port': 'port' }[args[i]]; assert(key && args[i + 1] && !Object.hasOwn(options, key), 'invalid-option'); options[key] = key === 'port' ? Number(args[i + 1]) : args[i + 1]; }
    const { server, initialUrl } = await startPanel(options); console.log(initialUrl);
    for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
  } catch { console.error('Panel blocked: valid authorized project, optional initiative and local port required.'); process.exitCode = 1; }
}
