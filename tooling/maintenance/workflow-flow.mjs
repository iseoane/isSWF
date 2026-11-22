import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Writes docs/<locale>/workflow.html and workflow.svg from docs/diagrams/flow.json. With --check it writes nothing and
// fails when the data is invalid or a generated file differs from what the data produces. --root selects another checkout.
const GITHUB_BLOB = 'https://github.com/iseoane/isSWF/blob/main/';
const LOCALES = ['en', 'es'];
const KINDS = ['operator', 'coordinator', 'helper'];
const SHAPES = ['straight', 'bypass', 'skip', 'loop-left', 'loop-right'];

const args = process.argv.slice(2);
const check = args.includes('--check');
const rootFlag = args.indexOf('--root');
assert.ok(args.every((arg, i) => arg === '--check' || arg === '--root' || (rootFlag >= 0 && i === rootFlag + 1)), 'Usage: workflow-flow.mjs [--check] [--root <directory>]');
const root = resolve(rootFlag >= 0 ? args[rootFlag + 1] : fileURLToPath(new URL('../../', import.meta.url)));

const isText = value => typeof value === 'string' && value.trim() !== '';
const isTranslated = value => value && typeof value === 'object' && Object.keys(value).sort().join() === LOCALES.join() && LOCALES.every(locale => isText(value[locale]));
const requireTranslated = (value, where) => assert.ok(isTranslated(value), `Every translated field needs exactly en and es, both non-empty: ${where}`);

function repositoryFiles() {
  const result = spawnSync('git', ['-C', root, 'ls-tree', '-r', '--name-only', 'HEAD'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  assert.equal(result.status, 0, `Cannot list the files at HEAD in ${root}: ${result.stderr}`);
  return new Set(result.stdout.split('\n').filter(Boolean));
}

function validate(data) {
  const { ui, nodes, edges } = data;
  assert.ok(ui && Array.isArray(nodes) && Array.isArray(edges), 'The data needs ui, nodes and edges.');
  for (const [key, value] of Object.entries(ui)) requireTranslated(value, `ui.${key}`);
  const ids = new Set();
  const claim = (id, where) => {
    assert.ok(isText(id), `Missing id: ${where}`);
    assert.ok(!ids.has(id), `IDs must be unique: ${id}`);
    ids.add(id);
  };
  const paths = [];
  for (const node of nodes) {
    claim(node.id, 'node');
    assert.ok(KINDS.includes(node.kind), `Unknown kind for node ${node.id}`);
    assert.ok(Number.isFinite(node.x) && Number.isFinite(node.y), `Node ${node.id} needs x and y.`);
    for (const field of ['label', 'sub', 'who']) requireTranslated(node[field], `${node.id}.${field}`);
    assert.ok(Array.isArray(node.questions) && Array.isArray(node.guards), `Node ${node.id} needs questions and guards.`);
    for (const question of node.questions) {
      claim(question.id, `question of ${node.id}`);
      for (const field of ['ask', 'yes']) requireTranslated(question[field], `${question.id}.${field}`);
      if (question.no !== undefined) requireTranslated(question.no, `${question.id}.no`);
      assert.ok(Array.isArray(question.cites) && question.cites.length > 0, `Question ${question.id} needs at least one cited path.`);
      for (const cite of question.cites) {
        assert.ok(isText(cite.label), `Citation label missing in ${question.id}`);
        paths.push(cite.path);
      }
    }
    for (const guard of node.guards) {
      claim(guard.id, `guard of ${node.id}`);
      requireTranslated(guard.text, `${guard.id}.text`);
      paths.push(guard.path);
    }
  }
  const nodeIds = new Set(nodes.map(node => node.id));
  for (const node of nodes) for (const question of node.questions) {
    assert.ok(question.to === undefined || nodeIds.has(question.to), `Unknown destination in ${question.id}: ${question.to}`);
  }
  for (const edge of edges) {
    claim(edge.id, 'edge');
    assert.ok(nodeIds.has(edge.from) && nodeIds.has(edge.to), `Unknown edge endpoint: ${edge.id}`);
    assert.ok(edge.shape === undefined || SHAPES.includes(edge.shape), `Unknown shape for edge ${edge.id}`);
    if (edge.label !== undefined) requireTranslated(edge.label, `${edge.id}.label`);
  }
  const files = repositoryFiles();
  for (const path of new Set(paths)) {
    assert.ok(isText(path) && !path.startsWith('/') && !path.includes('\\') && !path.split('/').includes('..'), `Cited paths are repository-relative: ${path}`);
    assert.ok(files.has(path), `Cited path does not exist at HEAD: ${path}`);
  }
}

const localize = (value, locale) => {
  if (Array.isArray(value)) return value.map(item => localize(item, locale));
  if (!value || typeof value !== 'object') return value;
  if (isTranslated(value)) return value[locale];
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localize(item, locale)]));
};

const escapeHtml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const STYLE = String.raw`
:root{color-scheme:light dark;--bg:#f5f6f8;--panel:#ffffff;--fg:#1b2230;--muted:#5d6878;--line:#8e99aa;--accent:#2b6cb0;--op:#8a5a0b;--role:#2f855a;--ctl:#9b2c2c;--hot:#b45309;
--font:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;--mono:ui-monospace,SFMono-Regular,Consolas,"Liberation Mono",monospace}
@media (prefers-color-scheme:dark){:root{--bg:#12161d;--panel:#1b212b;--fg:#e4e8ef;--muted:#9aa5b5;--line:#6b7a93;--accent:#63a4e8;--op:#e0a84a;--role:#5fc08a;--ctl:#e07a7a;--hot:#fbbf24}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--font);padding:24px max(16px,env(safe-area-inset-right,0px)) 24px max(16px,env(safe-area-inset-left,0px))}
h1{font-size:1.6rem;margin:0 0 6px;text-wrap:balance}
.top{display:flex;flex-wrap:wrap;gap:8px 16px;justify-content:space-between;align-items:baseline}
.top a{color:var(--muted);font-size:.85rem}
.sub{color:var(--muted);margin:0 0 16px;max-width:80ch;line-height:1.5}
.wrap{display:grid;grid-template-columns:1fr;gap:16px}
@media(min-width:1200px){.wrap{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)}}
.board{background:var(--panel);border:1px solid var(--line);border-radius:8px;overflow-x:auto;min-width:0}
.chart{position:relative;width:760px;height:1260px;margin:0 auto}
svg{position:absolute;left:0;top:0;width:760px;height:1260px;overflow:visible}
.e{fill:none;stroke:var(--line);stroke-width:2;transition:stroke .2s}
.e.loop{stroke-dasharray:5 4;stroke:var(--ctl)}
.e.hot{stroke:var(--hot);stroke-width:3.5;animation:pulse 1s ease-in-out infinite}
.mk{fill:var(--line)}.mk.hot{fill:var(--hot)}
svg text{fill:var(--muted);font:500 11px var(--font)}
svg text.hot{fill:var(--hot);font-weight:700}
@keyframes pulse{50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.e.hot{animation:none}}
.n{position:absolute;transform:translate(-50%,-50%);width:172px;padding:10px 12px;border:2px solid var(--c);border-radius:8px;background:var(--panel);color:var(--fg);font:600 .9rem var(--font);cursor:pointer;text-align:center;line-height:1.25}
.n small{display:block;font:400 .72rem var(--font);color:var(--muted);margin-top:3px}
.n .cnt{display:block;font:600 .68rem var(--font);color:var(--muted);margin-top:5px;letter-spacing:.04em}
.n .shield{position:absolute;top:-10px;right:-10px;width:20px;height:20px;border-radius:50%;background:var(--panel);border:1.5px solid var(--muted);color:var(--muted);font:700 .7rem var(--mono);display:grid;place-items:center}
.n.operator{--c:var(--op)}.n.coordinator{--c:var(--accent);border-radius:999px;width:192px}.n.helper{--c:var(--role)}
.n.optional{border-style:dashed}
.n:hover,.n:focus-visible,.n.on{background:color-mix(in srgb,var(--c) 15%,var(--panel))}
.n:focus-visible,summary:focus-visible,.go:focus-visible,.tech a:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.n.dest{box-shadow:0 0 0 4px color-mix(in srgb,var(--hot) 45%,transparent)}
.side{background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:20px;align-self:start;min-width:0}
@media(min-width:1200px){.side{position:sticky;top:12px;max-height:calc(100vh - 24px);overflow:auto}}
.side h2{font-size:1.3rem;margin:0 0 6px}
.who{color:var(--muted);font-size:.95rem;margin:0 0 16px;line-height:1.5;max-width:70ch}
.side h3{font:600 .72rem var(--font);letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:18px 0 8px}
details{border:1px solid var(--line);border-radius:6px;margin-bottom:8px}
summary{cursor:pointer;padding:11px 14px;font-weight:600;font-size:.95rem;line-height:1.35}
details[open]{border-color:var(--hot)}
details[open] summary{border-bottom:1px dashed var(--line)}
.ans{padding:12px 14px;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:10px;font-size:.9rem;line-height:1.5}
.ans .a{border:1px solid var(--line);border-radius:6px;padding:10px 12px}
.ans .a b{display:block;font:700 .75rem var(--font);letter-spacing:.06em;text-transform:uppercase;margin-bottom:3px}
.ans .y b{color:var(--role)}.ans .x b{color:var(--ctl)}
.foot{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.go{font:inherit;font-size:.8rem;border:1px solid var(--hot);background:transparent;color:var(--fg);border-radius:4px;padding:3px 9px;cursor:pointer}
.tech{font:.74rem var(--mono);color:var(--muted)}
.tech a{color:var(--muted);text-decoration:underline dotted}
.tech a:hover{color:var(--accent)}
.guards{border-top:1px solid var(--line);margin-top:18px;padding-top:4px}
.guards ul{margin:0;padding-left:18px;font-size:.88rem;line-height:1.5}
.guards li{margin-bottom:6px}
.guards p{font-size:.8rem;color:var(--muted);margin:0 0 8px}
.legend{display:flex;flex-wrap:wrap;gap:16px;margin:0 0 12px;font-size:.8rem;color:var(--muted);align-items:center}
.legend i{display:inline-block;width:12px;height:12px;border:2px solid var(--c);border-radius:3px;margin-right:5px;vertical-align:-2px}
.legend .s{display:inline-grid;place-items:center;width:16px;height:16px;border-radius:50%;border:1.5px solid var(--muted);font:700 .6rem var(--mono);margin-right:5px}
`;

// The page script builds every element with textContent, so the data is never parsed as HTML.
const SCRIPT = String.raw`
(function () {
  var D = JSON.parse(document.getElementById('flow-data').textContent);
  var GH = D.repo, NS = 'http://www.w3.org/2000/svg', U = D.ui;
  var nodes = {};
  D.nodes.forEach(function (n) { nodes[n.id] = n; });
  var chart = document.getElementById('chart'), svg = document.getElementById('svg'), side = document.getElementById('side');
  var cur = null;
  function h(tag, props) {
    var el = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) { el.setAttribute(k, props[k]); });
    for (var i = 2; i < arguments.length; i++) if (arguments[i] != null) el.append(arguments[i]);
    return el;
  }
  function cites(list) {
    var box = h('span', { 'class': 'tech' });
    list.forEach(function (c, i) {
      if (i) box.append(' \u00b7 ');
      box.append(h('a', { href: GH + c.path, target: '_blank', rel: 'noopener' }, c.label));
    });
    return box;
  }
  function box(id) {
    var el = chart.querySelector('.n[data-k="' + id + '"]'), n = nodes[id];
    return { x: n.x, y: n.y, h: el.offsetHeight / 2, w: el.offsetWidth / 2 };
  }
  function route(e) {
    var a = box(e.from), b = box(e.to), G = 6, s = e.shape || 'straight', d, lx, ly;
    if (s === 'loop-right') {
      d = 'M' + (a.x + a.w) + ',' + a.y + ' C' + (a.x + a.w + 120) + ',' + a.y + ' ' + (b.x + b.w + 120) + ',' + b.y + ' ' + (b.x + b.w + G) + ',' + b.y;
      lx = a.x + a.w + 70; ly = (a.y + b.y) / 2 + 4;
    } else if (s === 'loop-left' || s === 'skip') {
      var swing = s === 'loop-left' ? 250 : 120;
      d = 'M' + (a.x - a.w) + ',' + a.y + ' C' + (a.x - a.w - swing) + ',' + a.y + ' ' + (b.x - b.w - swing) + ',' + b.y + ' ' + (b.x - b.w - G) + ',' + b.y;
      lx = s === 'skip' ? 62 : 20; ly = s === 'skip' ? (a.y + b.y) / 2 + 8 : a.y - 30;
    } else if (s === 'bypass') {
      d = 'M' + (a.x + a.w * 0.55) + ',' + (a.y + a.h) + ' C' + (a.x + 150) + ',' + (a.y + 170) + ' ' + (b.x + 150) + ',' + (b.y - 170) + ' ' + (b.x + b.w * 0.55) + ',' + (b.y - b.h - G);
      lx = a.x + 136; ly = (a.y + b.y) / 2 + 4;
    } else {
      var y1 = a.y + a.h, y2 = b.y - b.h - G, m = (y1 + y2) / 2;
      d = 'M' + a.x + ',' + y1 + ' C' + a.x + ',' + m + ' ' + b.x + ',' + m + ' ' + b.x + ',' + y2;
      lx = b.x + (a.x === b.x ? 8 : 26); ly = a.x === b.x ? m + 4 : y2 - 8;
    }
    return { d: d, lx: lx, ly: ly };
  }
  function draw() {
    svg.querySelectorAll('[data-f]').forEach(function (el) { el.remove(); });
    D.edges.forEach(function (e) {
      var r = route(e), p = document.createElementNS(NS, 'path');
      p.setAttribute('d', r.d);
      p.setAttribute('class', 'e' + (e.shape === 'loop-left' || e.shape === 'loop-right' ? ' loop' : ''));
      p.setAttribute('marker-end', 'url(#a)');
      p.dataset.f = e.from; p.dataset.t = e.to;
      svg.appendChild(p);
      if (e.label) {
        var t = document.createElementNS(NS, 'text');
        t.setAttribute('x', r.lx); t.setAttribute('y', r.ly);
        t.textContent = e.label; t.dataset.f = e.from; t.dataset.t = e.to;
        svg.appendChild(t);
      }
    });
    if (cur) sync();
  }
  function light(from, tos) {
    svg.querySelectorAll('[data-f]').forEach(function (el) {
      var on = el.dataset.f === from && tos.indexOf(el.dataset.t) >= 0;
      el.classList.toggle('hot', on);
      if (el.tagName === 'path') el.setAttribute('marker-end', on ? 'url(#ah)' : 'url(#a)');
    });
    chart.querySelectorAll('.n').forEach(function (b) { b.classList.toggle('dest', tos.indexOf(b.dataset.k) >= 0); });
  }
  function sync() {
    var open = Array.prototype.map.call(side.querySelectorAll('details[open]'), function (d) { return d.dataset.to; }).filter(Boolean);
    var all = D.edges.filter(function (e) { return e.from === cur; }).map(function (e) { return e.to; });
    light(cur, open.length ? open : all);
  }
  function answer(cls, title, text) {
    return h('div', { 'class': 'a ' + cls }, h('b', {}, title), text);
  }
  function show(id, fromUser) {
    var n = nodes[id];
    cur = id;
    chart.querySelectorAll('.n').forEach(function (b) { b.classList.toggle('on', b.dataset.k === id); });
    side.replaceChildren(h('h2', {}, n.label), h('p', { 'class': 'who' }, n.who), h('h3', {}, U.questionsHeading));
    n.questions.forEach(function (q) {
      var foot = h('div', { 'class': 'foot' });
      if (q.to) {
        var go = h('button', { type: 'button', 'class': 'go' }, U.goTo.replace('%s', nodes[q.to].label));
        go.onclick = function () { show(q.to, true); };
        foot.append(go);
      }
      foot.append(cites(q.cites));
      var body = h('div', { 'class': 'ans' }, answer('y', q.no === undefined ? U.answer : U.yes, q.yes));
      if (q.no !== undefined) body.append(answer('x', U.no, q.no));
      body.append(foot);
      var d = h('details', {}, h('summary', {}, q.ask), body);
      if (q.to) d.dataset.to = q.to;
      d.addEventListener('toggle', function () {
        if (d.open) side.querySelectorAll('details[open]').forEach(function (o) { if (o !== d) o.open = false; });
        sync();
      });
      side.append(d);
    });
    if (n.guards.length) {
      var ul = h('ul');
      n.guards.forEach(function (g) {
        ul.append(h('li', {}, g.text + ' ', h('span', { 'class': 'tech' }, cites([{ label: U.see, path: g.path }]))));
      });
      side.append(h('div', { 'class': 'guards' }, h('h3', {}, U.guardsHeading), h('p', {}, U.guardsNote), ul));
    }
    sync();
    if (fromUser && window.matchMedia('(max-width:1199px)').matches) {
      side.scrollIntoView({ block: 'start', behavior: window.matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
    }
  }
  D.nodes.forEach(function (n) {
    var b = h('button', { type: 'button', 'class': 'n ' + n.kind + (n.optional ? ' optional' : '') });
    b.dataset.k = n.id;
    b.style.left = n.x + 'px'; b.style.top = n.y + 'px';
    b.append(n.label, h('small', {}, n.sub),
      h('span', { 'class': 'cnt' }, n.questions.length + ' ' + (n.questions.length === 1 ? U.questionOne : U.questionMany)));
    if (n.guards.length) b.append(h('span', { 'class': 'shield', title: U.guardMark, 'aria-label': U.guardMark }, '\u2713'));
    b.onclick = function () { show(n.id, true); };
    chart.appendChild(b);
  });
  draw();
  show('coord', false);
  var board = document.getElementById('board');
  board.scrollLeft = (board.scrollWidth - board.clientWidth) / 2;
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
`;

function page(data, locale) {
  const local = localize(data, locale);
  const other = LOCALES.find(code => code !== locale);
  const embedded = { repo: GITHUB_BLOB, ui: local.ui, nodes: local.nodes, edges: local.edges };
  const json = JSON.stringify(embedded).replaceAll('<', '\\u003c').replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
  const { ui } = local;
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${escapeHtml(ui.pageTitle)}</title>
<style>${STYLE}</style>
</head>
<body>
<div class="top"><h1>${escapeHtml(ui.pageTitle)}</h1><a href="../${other}/workflow.html" hreflang="${other}">${escapeHtml(ui.otherLanguage)}</a></div>
<p class="sub">${escapeHtml(ui.intro)}</p>
<div class="legend"><span style="--c:var(--op)"><i></i>${escapeHtml(ui.legendOperator)}</span><span style="--c:var(--accent)"><i style="border-radius:50%"></i>${escapeHtml(ui.legendCoordinator)}</span><span style="--c:var(--role)"><i></i>${escapeHtml(ui.legendHelper)}</span><span style="--c:var(--role)"><i style="border-style:dashed"></i>${escapeHtml(ui.legendOptional)}</span><span style="color:var(--ctl)">${escapeHtml(ui.legendLoop)}</span><span><span class="s">✓</span>${escapeHtml(ui.legendGuard)}</span></div>
<div class="wrap">
<div class="board" id="board"><div class="chart" id="chart"><svg id="svg" viewBox="0 0 760 1260" aria-hidden="true"><defs>
<marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path class="mk" d="M0,0 L10,5 L0,10z"/></marker>
<marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path class="mk hot" d="M0,0 L10,5 L0,10z"/></marker>
</defs></svg></div></div>
<aside class="side" id="side" aria-live="polite"></aside>
</div>
<script type="application/json" id="flow-data">${json}</script>
<script>${SCRIPT}</script>
</body>
</html>
`;
}

// The README overview: nodes and arrows only, with no script. It paints its own light panel, so it reads the same
// on GitHub's light and dark backgrounds, where an image cannot follow the page theme.
const SVG_COLORS = { operator: '#8a5a0b', coordinator: '#2b6cb0', helper: '#2f855a', loop: '#9b2c2c', line: '#6b7a93', text: '#1b2230', muted: '#4b5563' };
const fmt = value => Math.round(value * 10) / 10;

// Breaks text at spaces into lines of at most max characters; a single longer word keeps its own line.
function wrap(text, max) {
  const lines = [];
  for (const word of text.split(/\s+/u)) {
    if (lines.length && lines[lines.length - 1].length + 1 + word.length <= max) lines[lines.length - 1] += ` ${word}`;
    else lines.push(word);
  }
  return lines;
}

function layout(node) {
  const w = node.kind === 'coordinator' ? 192 : 172;
  const label = wrap(node.label, Math.floor((w - 20) / 7.4));
  const sub = wrap(node.sub, Math.floor((w - 20) / 5.9));
  return { ...node, w, hw: w / 2, label, sub, hh: (12 + label.length * 16 + 4 + sub.length * 13 + 10) / 2 };
}

// The arrow geometry of the interactive page, with the node sizes this image computes.
function route(edge, a, b) {
  const G = 6, shape = edge.shape || 'straight';
  if (shape === 'loop-right') {
    return { d: `M${a.x + a.hw},${a.y} C${a.x + a.hw + 120},${a.y} ${b.x + b.hw + 120},${b.y} ${b.x + b.hw + G},${b.y}`, lx: a.x + a.hw + 100, ly: (a.y + b.y) / 2 + 4 };
  }
  if (shape === 'loop-left' || shape === 'skip') {
    const swing = shape === 'loop-left' ? 250 : 120;
    return { d: `M${a.x - a.hw},${a.y} C${a.x - a.hw - swing},${a.y} ${b.x - b.hw - swing},${b.y} ${b.x - b.hw - G},${b.y}`, lx: shape === 'skip' ? 62 : 20, ly: shape === 'skip' ? (a.y + b.y) / 2 + 8 : a.y - 30 };
  }
  if (shape === 'bypass') {
    return { d: `M${a.x + a.hw * 0.55},${a.y + a.hh} C${a.x + 150},${a.y + 170} ${b.x + 150},${b.y - 170} ${b.x + b.hw * 0.55},${b.y - b.hh - G}`, lx: a.x + 118, ly: (a.y + b.y) / 2 + 4, anchor: 'end' };
  }
  const y1 = a.y + a.hh, y2 = b.y - b.hh - G, m = (y1 + y2) / 2;
  return { d: `M${a.x},${y1} C${a.x},${m} ${b.x},${m} ${b.x},${y2}`, lx: b.x + (a.x === b.x ? 8 : 26), ly: a.x === b.x ? m + 4 : y2 - 8 };
}

function svg(data, locale) {
  const local = localize(data, locale);
  const nodes = new Map(local.nodes.map(node => [node.id, layout(node)]));
  const c = SVG_COLORS;
  const paths = [], labels = [];
  for (const edge of local.edges) {
    const r = route(edge, nodes.get(edge.from), nodes.get(edge.to));
    const loop = edge.shape === 'loop-left' || edge.shape === 'loop-right';
    paths.push(`<path d="${r.d.replace(/-?\d+(?:\.\d+)?/gu, number => fmt(Number(number)))}" fill="none" stroke="${loop ? c.loop : c.line}" stroke-width="2"${loop ? ' stroke-dasharray="5 4"' : ''} marker-end="url(#${loop ? 'al' : 'a'})"/>`);
    if (edge.label) labels.push(`<text x="${fmt(r.lx)}" y="${fmt(r.ly)}"${r.anchor ? ` text-anchor="${r.anchor}"` : ''} fill="${loop ? c.loop : c.muted}" font-size="11" font-weight="600">${escapeHtml(edge.label)}</text>`);
  }
  const boxes = [...nodes.values()].map(node => {
    const x = node.x - node.hw, y = node.y - node.hh;
    const labelY = index => fmt(y + 12 + 12 + index * 16);
    const subY = index => fmt(y + 12 + node.label.length * 16 + 4 + 10 + index * 13);
    const text = [
      ...node.label.map((line, i) => `<text x="${node.x}" y="${labelY(i)}" font-size="14" font-weight="700" fill="${c.text}">${escapeHtml(line)}</text>`),
      ...node.sub.map((line, i) => `<text x="${node.x}" y="${subY(i)}" font-size="11" fill="${c.muted}">${escapeHtml(line)}</text>`),
    ];
    return `<rect x="${fmt(x)}" y="${fmt(y)}" width="${node.w}" height="${fmt(node.hh * 2)}" rx="${node.kind === 'coordinator' ? 18 : 8}" fill="#ffffff" stroke="${c[node.kind]}" stroke-width="2"${node.optional ? ' stroke-dasharray="6 4"' : ''}/>${text.join('')}`;
  });
  const marker = (id, color) => `<marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0,0 L10,5 L0,10z" fill="${color}"/></marker>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="1260" viewBox="0 0 760 1260" role="img" aria-labelledby="t d" xml:lang="${locale}">
<title id="t">${escapeHtml(local.ui.pageTitle)}</title>
<desc id="d">${escapeHtml(local.ui.svgDescription)}</desc>
<defs>${marker('a', c.line)}${marker('al', c.loop)}</defs>
<rect x="1" y="1" width="758" height="1258" rx="12" fill="#f5f6f8" stroke="#8e99aa" stroke-width="2"/>
<g font-family="Arial, Helvetica, sans-serif">
<g text-anchor="start">${paths.join('')}${labels.join('')}</g>
<g text-anchor="middle">
${boxes.join('\n')}
</g>
</g>
</svg>
`;
}

const dataPath = resolve(root, 'docs/diagrams/flow.json');
assert.ok(existsSync(dataPath), `Missing ${dataPath}`);
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
validate(data);
for (const locale of LOCALES) {
  for (const [name, build] of [['html', page], ['svg', svg]]) {
    const path = resolve(root, `docs/${locale}/workflow.${name}`);
    const expected = build(data, locale);
    if (check) {
      assert.ok(existsSync(path) && readFileSync(path, 'utf8') === expected, `Regenerate ${path} with node tooling/maintenance/workflow-flow.mjs`);
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, expected);
    }
  }
}
console.log(check ? 'The workflow flow data is valid and all four generated files match it.' : 'Wrote workflow.html and workflow.svg under docs/en and docs/es.');
