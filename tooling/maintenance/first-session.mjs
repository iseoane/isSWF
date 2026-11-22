import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Writes docs/<locale>/first-session.svg and docs/<locale>/initiatives-panel.svg from docs/diagrams/first-session.json.
// With --check it writes nothing and fails when the data is invalid or a generated file differs from what the data
// produces. --root selects another checkout.
const LOCALES = ['en', 'es'];
const STEP_KINDS = ['caption', 'shell', 'you', 'reply'];
const JOB_STATUSES = ['pending', 'in-progress', 'in-review', 'completed'];
const PILL_STATES = ['running', 'passed'];

const args = process.argv.slice(2);
const check = args.includes('--check');
const rootFlag = args.indexOf('--root');
assert.ok(args.every((arg, i) => arg === '--check' || arg === '--root' || (rootFlag >= 0 && i === rootFlag + 1)), 'Usage: first-session.mjs [--check] [--root <directory>]');
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
  const { ui, session, panel } = data;
  assert.ok(ui && session && panel, 'The data needs ui, session and panel.');
  for (const [key, value] of Object.entries(ui)) requireTranslated(value, `ui.${key}`);
  const paths = [];
  const ids = new Set();
  assert.ok(Array.isArray(session.steps) && session.steps.length > 0, 'The session needs steps.');
  assert.ok(Number.isFinite(session.holdSeconds) && session.holdSeconds >= 0, 'session.holdSeconds must be a number.');
  for (const step of session.steps) {
    assert.ok(isText(step.id) && !ids.has(step.id), `Step IDs must be present and unique: ${step.id}`);
    ids.add(step.id);
    assert.ok(STEP_KINDS.includes(step.kind), `Unknown kind for step ${step.id}`);
    assert.ok(Number.isFinite(step.delay) && step.delay >= 0, `Step ${step.id} needs a delay in seconds.`);
    requireTranslated(step.text, `${step.id}.text`);
    paths.push(step.source);
  }
  assert.ok(Number.isFinite(panel.secondsPerFrame) && panel.secondsPerFrame > 0, 'panel.secondsPerFrame must be a positive number.');
  assert.ok(isText(panel.title), 'panel.title is required.');
  paths.push(panel.source);
  for (const [key, value] of Object.entries(panel.labels ?? {})) requireTranslated(value, `panel.labels.${key}`);
  for (const key of ['autoWakeUp', 'tabInitiatives', 'tabAgents', 'tabFiles', 'jobsLine', 'completed', 'inactive']) assert.ok(panel.labels?.[key], `panel.labels.${key} is required.`);
  for (const holder of [panel.initiative, panel.inactive]) {
    assert.ok(isText(holder?.id), 'The panel initiatives need an id.');
    requireTranslated(holder.title, `${holder.id}.title`);
  }
  assert.ok(Array.isArray(panel.jobs) && panel.jobs.length > 0, 'The panel needs jobs.');
  for (const job of panel.jobs) {
    assert.ok(isText(job.id), 'Panel jobs need an id.');
    requireTranslated(job.objective, `${job.id}.objective`);
  }
  assert.ok(Array.isArray(panel.frames) && panel.frames.length > 0, 'The panel needs frames.');
  panel.frames.forEach((frame, index) => {
    requireTranslated(frame.caption, `frame ${index}.caption`);
    assert.ok(JOB_STATUSES.includes(frame.first?.status), `Frame ${index} has an unknown status.`);
    for (const pill of frame.first.pills ?? []) {
      assert.ok(isText(pill.role) && PILL_STATES.includes(pill.state), `Frame ${index} has an invalid pill.`);
    }
  });
  const files = repositoryFiles();
  for (const path of new Set(paths)) {
    assert.ok(isText(path) && !path.startsWith('/') && !path.includes('\\') && !path.split('/').includes('..'), `Cited paths are repository-relative: ${path}`);
    assert.ok(files.has(path), `Cited path does not exist at HEAD: ${path}`);
  }
}

const escapeXml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const fmt = value => Math.round(value * 1000) / 1000;
const MONO = 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace';
const CHAR = 7.8;
const FONT = 13;

// Breaks text at spaces into lines of at most max characters; a single longer word keeps its own line.
function wrap(text, max) {
  const lines = [];
  for (const word of text.split(/\s+/u)) {
    if (lines.length && lines[lines.length - 1].length + 1 + word.length <= max) lines[lines.length - 1] += ` ${word}`;
    else lines.push(word);
  }
  return lines;
}

// One palette for both images: light by default, dark when the viewer asks for it. Each image paints its own window, so
// it reads on GitHub's light and dark pages.
const STYLE = `
.bg{fill:#f4f7fb;stroke:#b7c4d2}.bar{fill:#e3e9f0}.rule{fill:#b7c4d2}
text{font-family:${MONO};font-size:${FONT}px;fill:#1b2530;white-space:pre}
.mu{fill:#5b6b7d}.ac{fill:#0b7285}.ok{fill:#1a7f37}.wn{fill:#9a6700}.pp{fill:#6f42c1}.sim{fill:#9a6700;font-weight:700}.b{font-weight:700}
.card{fill:none;stroke:#b7c4d2}.pill{fill:none;stroke-width:1.5}.pill.ok{stroke:#1a7f37}.pill.run{stroke:#5b6b7d;stroke-dasharray:4 3}
@media (prefers-color-scheme:dark){
.bg{fill:#0f1720;stroke:#34465a}.bar{fill:#16212d}.rule{fill:#34465a}
text{fill:#d7e0ea}.mu{fill:#7d8da1}.ac{fill:#4dd0e1}.ok{fill:#4ade80}.wn{fill:#fbbf24}.pp{fill:#b392f0}.sim{fill:#fbbf24}
.card{stroke:#34465a}.pill.ok{stroke:#4ade80}.pill.run{stroke:#7d8da1}}
`;

function frameOf(width, height, locale, title, desc, simulated, body, css, reducedMotionCss) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="t d" xml:lang="${locale}">
<title id="t">${escapeXml(title)}</title>
<desc id="d">${escapeXml(desc)}</desc>
<style>${STYLE}${css}@media (prefers-reduced-motion:reduce){.st,.fr{animation:none!important}${reducedMotionCss}}</style>
<rect class="bg" x="1" y="1" width="${width - 2}" height="${height - 2}" rx="10" stroke-width="2"/>
<path class="bar" d="M2,34 V11 A9,9 0 0 1 11,2 H${width - 11} A9,9 0 0 1 ${width - 2},11 V34z"/>
<circle cx="20" cy="18" r="5" fill="#ff5f56"/><circle cx="38" cy="18" r="5" fill="#ffbd2e"/><circle cx="56" cy="18" r="5" fill="#27c93f"/>
<text class="sim" x="${width - 18}" y="22" text-anchor="end">${escapeXml(simulated)}</text>
${body}
</svg>
`;
}

// A step is hidden until its time and visible until the loop ends, with no dependence on script.
function stepKeyframes(name, startPercent, total) {
  const start = fmt(startPercent), shown = fmt(startPercent + 0.8);
  return `@keyframes ${name}{0%,${start}%{opacity:0;transform:translateY(3px)}${shown}%,96%{opacity:1;transform:none}100%{opacity:0}}.${name}{animation:${name} ${fmt(total)}s linear infinite both}`;
}

function sessionSvg(data, locale) {
  const { steps, holdSeconds } = data.session;
  const LINE = 19, PAD = 20, TEXT_X = 40, MAX = 84;
  let y = 34 + 26, time = 0.4;
  const placed = steps.map(step => {
    time += step.delay;
    if (step.kind === 'caption' && y > 60) y += 12;
    const lines = wrap(step.kind === 'caption' ? `── ${step.text[locale]} ──` : step.text[locale], MAX);
    const placedStep = { ...step, lines, y, time };
    y += lines.length * LINE + (step.kind === 'caption' ? 4 : 6);
    return placedStep;
  });
  const total = time + holdSeconds;
  const height = Math.ceil(y + 14);
  const prefix = { shell: ['$', 'mu'], you: ['>', 'ac b'], reply: ['●', 'ok'] };
  const css = placed.map((step, i) => stepKeyframes(`k${i}`, (step.time / total) * 100, total)).join('');
  const body = placed.map((step, i) => {
    const caption = step.kind === 'caption';
    const mark = prefix[step.kind];
    const cls = caption ? 'mu b' : step.kind === 'you' ? 'ac' : '';
    const lines = step.lines.map((line, n) => `<text${cls ? ` class="${cls}"` : ''} x="${caption ? PAD : TEXT_X}" y="${fmt(step.y + n * LINE + 13)}">${escapeXml(line)}</text>`).join('');
    return `<g class="st k${i}">${mark ? `<text class="${mark[1]}" x="${PAD}" y="${fmt(step.y + 13)}">${mark[0]}</text>` : ''}${lines}</g>`;
  }).join('\n');
  return frameOf(760, height, locale, data.ui.sessionTitle[locale], data.ui.sessionDescription[locale], data.ui.simulatedLabel[locale], body, css, '');
}

const fill = (template, ...values) => values.reduce((text, value) => text.replace('%d', String(value)), template);

// The layout and fields follow hooks/register.tsx: header rows, one card for the active initiative and one for the rest.
function panelSvg(data, locale) {
  const { panel } = data;
  const LINE = 20, X = 20, WIDTH = 640;
  const label = key => panel.labels[key][locale];
  const jobCount = panel.jobs.length;
  const stateOf = (job, frame) => (job === panel.jobs[0] ? frame.first : { status: 'pending' });
  const cardHeight = 16 + LINE * (jobCount + 3) + 8;
  const top = 34 + 10, headerEnd = top + LINE * 3 + 14;
  const cardTop = headerEnd + 8;
  const inactiveTop = cardTop + cardHeight + 8;
  const captionY = inactiveTop + 16 + LINE * 2 + 26;
  const height = captionY + 18;
  const frames = panel.frames.length;
  const total = frames * panel.secondsPerFrame + 3;
  const text = (cls, x, y, content, anchor) => `<text${cls ? ` class="${cls}"` : ''} x="${x}" y="${fmt(y)}"${anchor ? ` text-anchor="${anchor}"` : ''}>${escapeXml(content)}</text>`;
  const header = [
    text('pp b', X, top + 15, panel.title),
    text('mu', WIDTH - X, top + 15, label('autoWakeUp'), 'end'),
    `<text x="${X}" y="${top + LINE + 15}">🧠 engram <tspan class="ok">●</tspan></text>`,
    `<text x="${X + 170}" y="${top + LINE + 15}">🗺 codegraph <tspan class="ok">●</tspan></text>`,
    `<text x="${X}" y="${top + LINE * 2 + 15}" xml:space="preserve"><tspan class="ac b">[${escapeXml(label('tabInitiatives'))}]</tspan><tspan class="mu">  ${escapeXml(label('tabAgents'))}   ${escapeXml(label('tabFiles'))}</tspan></text>`,
    `<rect class="rule" x="8" y="${top + LINE * 3 + 2}" width="${WIDTH - 16}" height="1"/><rect class="rule" x="8" y="${top + LINE * 3 + 5}" width="${WIDTH - 16}" height="1"/>`,
  ].join('');
  // The panel lists an initiative whose jobs are all pending without records only under Inactive, or as a "no work started" card when pinned; this image never pins.
  const inactiveCard = (top, rows) => [
    `<rect class="card" x="8" y="${top}" width="${WIDTH - 16}" height="${16 + LINE * (rows.length + 1)}" rx="8"/>`,
    text('b', X, top + 24, fill(label('inactive'), rows.length)),
    ...rows.map((row, n) => text('mu', X, top + 24 + LINE * (n + 1), `○ ${row.id} · ${row.title[locale]}`)),
  ].join('');
  const drawFrame = (frame, index) => {
    const caption = `${index + 1}/${frames} · ${frame.caption[locale]}`;
    assert.ok(caption.length * CHAR <= WIDTH - 2 * X, `The caption of frame ${index} is too long for the image: ${caption}`);
    if (frame.first.status === 'pending') {
      return `<g class="fr f${index}">${inactiveCard(cardTop, [panel.initiative, panel.inactive])}${text('b', WIDTH / 2, captionY, caption, 'middle')}</g>`;
    }
    const done = frame.first.status === 'completed' ? 1 : 0;
    let y = cardTop + 24;
    const out = [`<rect class="card" x="8" y="${cardTop}" width="${WIDTH - 16}" height="${cardHeight}" rx="8"/>`];
    const line = (cls, content) => { out.push(text(cls, X, y, content)); y += LINE; };
    line('ac b', `● ${panel.initiative.id} · ${panel.initiative.title[locale]}`);
    line('mu', fill(label('jobsLine'), done, jobCount, jobCount - done));
    if (done) line('ok', fill(label('completed'), done));
    for (const job of panel.jobs) {
      if (stateOf(job, frame).status === 'completed') line('ok', `✓ ${job.id} ${job.objective[locale]}`);
    }
    for (const job of panel.jobs) {
      const state = stateOf(job, frame), objective = job.objective[locale];
      if (state.status === 'completed') continue;
      if (state.status === 'pending') {
        line('mu', `○ ${job.id} ${objective}`);
        continue;
      }
      line('ac', `▸ ${job.id} (${state.status}) ${objective}`);
      out.push(text('mu', X + 8, y + 4, 'R1'));
      let x = X + 44;
      for (const pill of state.pills ?? []) {
        const width = pill.role.length * CHAR + 20;
        out.push(`<rect class="pill ${pill.state === 'running' ? 'run' : 'ok'}" x="${fmt(x)}" y="${y - 12}" width="${fmt(width)}" height="22" rx="6"/>`);
        out.push(text(pill.state === 'running' ? 'mu' : 'ok', x + 10, y + 4, pill.role));
        x += width + 8;
      }
      y += LINE + 6;
    }
    const last = index === frames - 1;
    out.push(inactiveCard(inactiveTop, [panel.inactive]), text('b', WIDTH / 2, captionY, caption, 'middle'));
    return `<g class="fr f${index}${last ? ' last' : ''}">${out.join('')}</g>`;
  };
  const fade = 0.3;
  const css = panel.frames.map((_, index) => {
    const start = (index * panel.secondsPerFrame / total) * 100;
    const end = (((index + 1) * panel.secondsPerFrame + (index === frames - 1 ? 3 : 0)) / total) * 100;
    const fadeIn = fmt(start + (fade / total) * 100), fadeOut = fmt(end - (fade / total) * 100);
    const open = index === 0 ? '0%{opacity:1}' : `0%,${fmt(start)}%{opacity:0}${fadeIn}%{opacity:1}`;
    return `@keyframes p${index}{${open}${fadeOut}%{opacity:1}${fmt(end)}%,100%{opacity:0}}.f${index}{animation:p${index} ${fmt(total)}s linear infinite both}`;
  }).join('');
  const body = `${header}${panel.frames.map(drawFrame).join('\n')}`;
  return frameOf(WIDTH, height, locale, data.ui.panelTitle[locale], data.ui.panelDescription[locale], data.ui.panelSimulatedLabel[locale], body, css, '.fr{opacity:0}.fr.last{opacity:1}');
}

const dataPath = resolve(root, 'docs/diagrams/first-session.json');
assert.ok(existsSync(dataPath), `Missing ${dataPath}`);
const data = JSON.parse(readFileSync(dataPath, 'utf8'));
validate(data);
const built = Object.fromEntries(LOCALES.map(locale => [locale, { 'first-session': sessionSvg(data, locale), 'initiatives-panel': panelSvg(data, locale) }]));
for (const locale of LOCALES) {
  for (const [name, expected] of Object.entries(built[locale])) {
    const path = resolve(root, `docs/${locale}/${name}.svg`);
    if (check) {
      assert.ok(existsSync(path) && readFileSync(path, 'utf8') === expected, `Regenerate ${path} with node tooling/maintenance/first-session.mjs`);
    } else {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, expected);
    }
  }
}
console.log(check ? 'The first-session data is valid and all four generated images match it.' : 'Wrote first-session.svg and initiatives-panel.svg under docs/en and docs/es.');
