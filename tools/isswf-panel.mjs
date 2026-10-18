#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { isAbsolute, resolve } from 'node:path';
import { realpath } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { initiatives, status } from './isswf-status.mjs';

const escape = value => String(value ?? '').replace(/[&<>"']/gu, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const names = { pending: 'Pendiente', 'in-progress': 'En curso', blocked: 'Bloqueado', 'in-review': 'En revisión', 'awaiting-human': 'Pendiente de aceptación', completed: 'Completado según el plan' };
const list = values => `<ul>${values.map(value => `<li>${escape(value)}</li>`).join('')}</ul>`;
function card(job) {
  const artifact = job.artifacts, delivery = artifact.delivery;
  const section = (name, title) => `<section><h4>${title}</h4><pre>${escape(delivery?.sections?.[name] || 'No consta en la entrega. El coordinador debe aportar este dato antes de pedir aceptación.')}</pre></section>`;
  const reports = artifact.reports ?? [];
  return `<article><header><h2>${escape(job.id)} · ${escape(job.objective)}</h2><strong>${escape(names[job.reportedStatus] ?? job.reportedStatus)}</strong></header>
  <p>Estado declarado en el plan, no actividad comprobada de procesos.</p>
  <dl><dt>Depende de</dt><dd>${escape(job.dependencies.join(', ') || 'Sin dependencias declaradas')}</dd><dt>Bloqueo declarado</dt><dd>${escape(job.blocker)}</dd><dt>Siguiente paso</dt><dd>${escape(job.nextStep)}</dd><dt>Registro del trabajo</dt><dd>${escape(artifact.status)}</dd></dl>
  <h3>Qué se pidió</h3>${list(job.acceptance)}
  <h3>Ficha de entrega y aceptación</h3><p>Entrega: ${escape(delivery?.status ?? 'no disponible')}. No se deduce una entrega ni una aprobación de que un proceso haya terminado.</p>
  ${section('What changed and why', 'Qué se entregó')}${section('Visual summary', 'Demostración')}${section('Checks and results', 'Comprobaciones y evidencia')}${section('Independent review', 'Revisión independiente')}${section('Scope', 'Alcance y exclusiones')}${section('Integration risk and recovery', 'Límites y riesgos')}${section('Closure and acceptance', 'Qué decisión se pide y qué se ha aceptado')}
  <p><b>${job.reportedStatus === 'awaiting-human' ? 'Decisión pendiente del operador. Explica tu aceptación o los cambios al coordinador; esta página no acepta ni modifica el job.' : 'No se solicita una aceptación desde esta página. El estado y las decisiones se registran mediante el coordinador.'}</b></p>
  <h3>Agentes y metodología registrados</h3><p>No es telemetría en vivo. Un perfil o referencia suministrada no demuestra que se haya aplicado. Uso efectivo no registrado: desconocido.</p>
  ${reports.some(report => Object.keys(report.declaredMetadata ?? {}).length) ? reports.filter(report => Object.keys(report.declaredMetadata ?? {}).length).map(report => `<h4>Informe ${escape(report.path.split('/').at(-1))}</h4><dl>${Object.entries(report.declaredMetadata).map(([key, value]) => `<dt>${escape(key)}</dt><dd>${escape(value)}</dd>`).join('')}</dl>`).join('') : '<p>No constan rol, modelo/esfuerzo ni referencias de ejecución en los campos reconocidos de los informes.</p>'}
  <details><summary>Procedencia y referencias</summary><p>Consulta archivos originales solo si necesitas ampliar el detalle. Estas referencias son datos declarados, no verificación actual de PRs.</p>${list(job.evidence)}
  <p>Brief: ${escape(artifact.brief?.path ?? 'No disponible')}<br>SHA256: ${escape(artifact.brief?.sha256 ?? 'Desconocido')}</p>
  <p>Entrega: ${escape(delivery?.path ?? 'No disponible')}<br>SHA256: ${escape(delivery?.sha256 ?? 'Desconocido')}<br>Modificación: ${escape(delivery?.modifiedAt ?? 'Desconocida')}</p>
  ${list(reports.map(report => `${report.path} | SHA256 ${report.sha256} | ${report.modifiedAt} | Reportado: ${report.reportedStatus ?? 'no consta'}`))}</details></article>`;
}
function board(jobs) {
  return `<div class="board" id="board" role="region" aria-label="Tablero de jobs por fase" tabindex="0">${Object.entries(names).map(([state, name]) => {
    const items = jobs.filter(job => job.reportedStatus === state);
    return `<section class="lane" data-state="${escape(state)}"><h2>${escape(name)} <small>${items.length}</small></h2>${items.map(job => `<div class="tile"><b>${escape(job.id)}</b><p>${escape(job.objective)}</p><p class="tile-meta">${escape(job.dependencies.length ? 'Depende de ' + job.dependencies.join(', ') : 'Sin dependencias declaradas')}</p><a href="#detail-${escape(job.id)}">Ver ficha y evidencias</a></div>`).join('') || '<p>Sin trabajos en esta fase.</p>'}</section>`;
  }).join('')}</div>`;
}
export function renderPanel(snapshot) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(snapshot.label ?? 'Estado no disponible')} · isSWF</title>
  <style>body{font:16px system-ui,sans-serif;max-width:1800px;margin:auto;padding:24px;background:#10161d;color:#e5edf7}a{color:#9bd5ff}article{border:1px solid #52616f;border-radius:12px;padding:20px;margin:24px 0;background:#18222d}h2{font-size:1.3rem}h3{border-top:1px solid #52616f;padding-top:16px}h4{margin-bottom:6px}pre{font:inherit;white-space:pre-wrap;overflow-wrap:anywhere}dt{font-weight:bold;margin-top:10px}dd{margin-left:0;overflow-wrap:anywhere}.notice{border-left:4px solid #ffc567;padding:12px;background:#25313e}details{margin-top:16px}li{overflow-wrap:anywhere}.board{display:grid;grid-template-columns:repeat(6,minmax(250px,1fr));gap:14px;overflow-x:auto;padding:16px 0;align-items:start}.lane{background:#18222d;border:1px solid #52616f;border-radius:12px;padding:12px;min-width:0}.lane h2{font-size:1rem;min-height:2.5em}.lane small{background:#3c5164;border-radius:12px;padding:2px 8px}.tile{background:#253443;border:1px solid #52616f;border-left:4px solid #80bfff;border-radius:8px;padding:12px;margin:12px 0}.tile p{font-size:.9rem;margin:8px 0;overflow-wrap:anywhere}.tile-meta{color:#becbd9}.job-detail{display:none;margin-top:24px;max-width:1000px}.job-detail:target{display:block}a{display:inline-block;min-height:26px}.lane[data-state=completed] .tile{border-left-color:#7edca3}.lane[data-state=awaiting-human] .tile{border-left-color:#ffc567}.lane[data-state=blocked] .tile{border-left-color:#ff8b8b}@media(max-width:650px){body{padding:12px}.board{grid-template-columns:repeat(6,260px)}} </style></head>
  <body><h1>${escape(snapshot.label ?? 'Estado no disponible')}</h1><p>Panel local de lectura. <a href="/">Todas las iniciativas</a> · <a href="/i/${escape(snapshot.initiative)}">Actualizar</a> · <a href="/api/status/${escape(snapshot.initiative)}">Ver datos y procedencia</a></p>
  <div class="notice"><b>No es una vista de procesos vivos ni una autorización de ejecución.</b><p>Consultado: ${escape(snapshot.observedAt)}. Actividad: ${escape(snapshot.processState)}. Frescura: ${escape(snapshot.freshness)}. No hay comprobación actual de PRs, modelos, slots o dependencias satisfechas.</p></div>
  ${snapshot.status === 'observed' ? `<p>En pantallas pequeñas, desliza el tablero horizontalmente para ver todas las fases.</p><p>${snapshot.jobs.length} trabajos en el plan canónico. Plan modificado: ${escape(snapshot.plan.modifiedAt)}.</p>${board(snapshot.jobs)}${snapshot.jobs.map(job => `<section class="job-detail" id="detail-${escape(job.id)}"><a href="#board">Volver al tablero</a>${card(job)}</section>`).join('')}` : `<h2>Plan no disponible</h2><p>Estado: ${escape(snapshot.status)}. ${escape(snapshot.reason ?? 'No hay registro canónico disponible; no se interpreta como una lista vacía de trabajos.')}</p>`}
  <footer><p>${escape(snapshot.limits)}</p><p>Solo datos de un proyecto autorizado. Loopback no es autenticación ni aislamiento frente a otros procesos locales. Las fichas deben contener evidencia apta para mostrar, nunca credenciales. No se sirven archivos arbitrarios, ni se ejecutan órdenes.</p></footer></body></html>`;
}
function renderInitiatives(snapshot) {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Iniciativas · isSWF</title><style>body{font:16px system-ui,sans-serif;max-width:1100px;margin:auto;padding:24px;background:#10161d;color:#e5edf7}a{color:#9bd5ff}article{border:1px solid #52616f;border-radius:12px;padding:20px;margin:20px 0;background:#18222d}h2,p,li{overflow-wrap:anywhere}</style></head><body><h1>Iniciativas del proyecto</h1><p><a href="/">Actualizar</a> · <a href="/api/status">Ver datos y procedencia</a></p><p>Solo lectura. Estados declarados, no actividad viva ni autorización. Consultado: ${escape(snapshot.observedAt)}.</p>
  ${snapshot.status === 'observed' ? (snapshot.initiatives.map(item => `<article><h2>${escape(item.label ?? item.initiative)}</h2>${item.status === 'observed' ? `<p>${item.counts.completed} de ${item.jobs} jobs completados según el plan.</p>${list(Object.entries(names).map(([state, name]) => name + ': ' + item.counts[state]))}${list(item.blockers.map(job => job.id + ': ' + job.blocker))}<p>Plan modificado: ${escape(item.planModifiedAt)}.</p>` : `<p>Estado no disponible: ${escape(item.status)} · ${escape(item.reason)}. No se interpreta como progreso cero.</p>`}<a href="/i/${escape(item.initiative)}">Abrir Kanban</a></article>`).join('') || '<p>No hay iniciativas con identificador canónico. No se infiere que otros registros sean válidos.</p>') : `<h2>Listado no disponible</h2><p>${escape(snapshot.status)} · ${escape(snapshot.reason)}</p>`}
  <footer><p>Sin verificación de procesos, PRs, frescura o dependencias satisfechas. Loopback no es autenticación. Los registros se consultan por separado.</p></footer></body></html>`;
}
export async function startPanel({ project, initiative, port = 0 }) {
  assert(typeof project === 'string' && isAbsolute(project) && (initiative === undefined || (typeof initiative === 'string' && /^[A-Z][A-Z0-9-]{0,63}$/u.test(initiative))), 'explicit-project-initiative-required');
  assert(Number.isSafeInteger(port) && port >= 0 && port <= 65535, 'invalid-port');
  project = await realpath(project);
  const first = await initiatives({ project });
  assert(first.status !== 'unknown', 'unsafe-or-unreadable-project');
  let origin;
  const server = createServer({ maxHeaderSize: 8192 }, async (request, response) => {
    const send = (code, type, value) => {
      response.writeHead(code, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'", 'Referrer-Policy': 'no-referrer', 'Allow': 'GET' }); response.end(value);
    };
    if (request.headers.host !== origin?.slice('http://'.length) || (request.headers.origin && request.headers.origin !== origin) || (request.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(request.headers['sec-fetch-site']))) return send(403, 'text/plain', 'Forbidden: open the loopback URL directly on this machine.');
    if (request.method !== 'GET') return send(405, 'text/plain', 'Read-only panel: GET only.');
    const selected = /^\/(i|api\/status)\/([A-Z][A-Z0-9-]{0,63})$/u.exec(request.url);
    if (!selected && !['/', '/api/status'].includes(request.url)) return send(404, 'text/plain', 'Not found.');
    try {
      const snapshot = selected ? await status({ project, initiative: selected[2] }) : await initiatives({ project });
      const html = request.url === '/' || selected?.[1] === 'i';
      const type = html ? 'text/html' : 'application/json';
      const body = html ? (selected ? renderPanel(snapshot) : renderInitiatives(snapshot)) : JSON.stringify(snapshot);
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
