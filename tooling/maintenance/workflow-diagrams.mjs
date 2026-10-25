import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = JSON.parse(readFileSync(resolve(root, 'docs/diagrams/workflow.json'), 'utf8'));
const locales = ['en', 'es'];
const args = process.argv.slice(2);
const check = args.length === 1 && args[0] === '--check';
assert.ok(check || args.length === 1, 'Pass --check or the path to an installed Archify CLI.');
const archify = check ? null : resolve(args[0]);
const stamp = new Date().toISOString().replaceAll(/[:.]/gu, '-');
const work = resolve(root, '.archify', `readme-workflow-${stamp}`);
const manifestPath = resolve(root, 'docs/diagrams/workflow.generated.json');
const manifest = { sourceSha256: '', artifacts: {} };
const sha256 = value => createHash('sha256').update(value).digest('hex');

function localize(value, locale) {
  if (Array.isArray(value)) return value.map(item => localize(item, locale));
  if (!value || typeof value !== 'object') return value;
  if (Object.hasOwn(value, 'en') || Object.hasOwn(value, 'es')) {
    assert.deepEqual(Object.keys(value).sort(), locales, 'Every translated field needs exactly en and es.');
    for (const language of locales) assert.equal(typeof value[language], 'string');
    return value[locale];
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localize(item, locale)]));
}

const xml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function preview(overview, locale) {
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="1140" height="760" viewBox="0 0 1140 760" role="img" aria-labelledby="title description" xml:lang="${locale}">`,
    `<title id="title">${xml(overview.title)}</title>`,
    `<desc id="description">${xml(overview.description)} ${xml(overview.note)}</desc>`,
    '<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#94a3b8"/></marker></defs>',
    '<rect width="1140" height="760" rx="16" fill="#0f172a"/>',
    '<g font-family="Arial, Helvetica, sans-serif">',
    `<text x="30" y="38" fill="#f8fafc" font-size="24" font-weight="700">${xml(overview.title)}</text>`,
    `<text x="30" y="64" fill="#cbd5e1" font-size="15">${xml(overview.description)}</text>`,
  ];
  assert.equal(overview.rows.length, 3);
  overview.rows.forEach((row, r) => {
    assert.equal(row.steps.length, 3);
    const y = 110 + r * 210;
    parts.push(`<text x="30" y="${y - 16}" fill="#cbd5e1" font-size="15" font-weight="700">${r + 1}. ${xml(row.label)}</text>`);
    row.steps.forEach((step, c) => {
      const x = 30 + c * 380;
      const color = step.node === 'approval' ? '#fbbf24' : '#67e8f9';
      parts.push(`<rect x="${x}" y="${y}" width="320" height="126" rx="10" fill="#1e293b" stroke="${color}" stroke-width="1.5"/>`);
      parts.push(`<text x="${x + 16}" y="${y + 26}" fill="${color}" font-size="13" font-weight="700">${xml(step.actor)}</text>`);
      parts.push(`<text x="${x + 16}" y="${y + 55}" fill="#f8fafc" font-size="19" font-weight="700">${xml(step.label)}</text>`);
      step.details.forEach((line, i) => parts.push(`<text x="${x + 16}" y="${y + 81 + i * 22}" fill="#cbd5e1" font-size="14">${xml(line)}</text>`));
      if (c < 2) parts.push(`<path d="M${x + 327} ${y + 63}H${x + 373}" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>`);
    });
    if (r < 2) parts.push(`<path d="M950 ${y + 134}V${y + 160}H15V${y + 273}H28" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>`);
  });
  const words = overview.note.split(' ');
  const lines = [''];
  for (const word of words) {
    const i = lines.length - 1;
    if (`${lines[i]} ${word}`.trim().length > 132) lines.push(word);
    else lines[i] = `${lines[i]} ${word}`.trim();
  }
  lines.forEach((line, i) => parts.push(`<text x="30" y="${710 + i * 21}" fill="#cbd5e1" font-size="14">${xml(line)}</text>`));
  parts.push('</g></svg>');
  return `${parts.join('\n')}\n`;
}

for (const locale of locales) {
  const workflow = localize(source.workflow, locale);
  workflow.meta.locale = locale;
  workflow.meta.output = `docs/${locale}/workflow.html`;
  const overview = localize(source.overview, locale);
  const ids = new Set(workflow.nodes.map(node => node.id));
  assert.equal(ids.size, workflow.nodes.length, 'Node IDs must be unique.');
  for (const edge of workflow.edges) assert.ok(ids.has(edge.from) && ids.has(edge.to), `Unknown edge endpoint: ${edge.id}`);
  for (const row of overview.rows) for (const step of row.steps) assert.ok(ids.has(step.node), `Unknown overview node: ${step.node}`);
  const candidate = `${JSON.stringify(workflow, null, 2)}\n`;
  const svg = preview(overview, locale);
  const imagePath = resolve(root, `docs/${locale}/workflow.svg`);
  const htmlPath = resolve(root, workflow.meta.output);
  if (check) {
    assert.equal(readFileSync(imagePath, 'utf8'), svg, `Regenerate ${imagePath}`);
    const retained = JSON.parse(readFileSync(manifestPath, 'utf8'));
    assert.equal(retained.sourceSha256, sha256(JSON.stringify(source)), 'Regenerate diagrams after editing their shared source.');
    assert.equal(retained.artifacts[locale].specificationSha256, sha256(candidate), `Regenerate ${htmlPath} from the shared source.`);
    assert.equal(retained.artifacts[locale].htmlSha256, sha256(readFileSync(htmlPath)), `Artifact changed: ${htmlPath}`);
    assert.equal(retained.artifacts[locale].svgSha256, sha256(svg));
  } else {
    mkdirSync(work, { recursive: true });
    const candidatePath = resolve(work, `workflow.${locale}.json`);
    writeFileSync(candidatePath, candidate);
    const result = spawnSync(process.execPath, [archify, 'finalize', 'workflow', candidatePath, htmlPath, '--repo-root', root, '--quality', 'showcase', '--out-dir', resolve(work, locale), '--json'], { cwd: root, stdio: 'inherit' });
    assert.equal(result.status, 0, `Archify failed for ${locale}. The previous image was preserved.`);
    writeFileSync(imagePath, svg);
    manifest.artifacts[locale] = {
      specificationSha256: sha256(candidate),
      htmlSha256: sha256(readFileSync(htmlPath)),
      svgSha256: sha256(svg),
    };
  }
}
if (!check) {
  manifest.sourceSha256 = sha256(JSON.stringify(source));
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}
console.log(check ? 'Workflow translations, preview images and HTML provenance match the shared source.' : 'Generated English and Spanish workflow images and interactive HTML.');
