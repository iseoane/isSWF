import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(process.argv[2] || fileURLToPath(new URL('../../', import.meta.url)));
const english = (await readdir(resolve(root, 'docs/en'))).filter(name => name.endsWith('.md')).sort();
const spanish = (await readdir(resolve(root, 'docs/es'))).filter(name => name.endsWith('.md')).sort();
assert.deepEqual(english, spanish, 'Current guide filenames must have English/Spanish mirrors');
const pairs = [
  ['README.md', 'README.es.md'],
  ['GLOSSARY.md', 'GLOSSARY.es.md'],
  ['docs/README.md', 'docs/README.es.md'],
  ...english.map(name => [`docs/en/${name}`, `docs/es/${name}`]),
];
let links = 0;
function anchors(text) {
  const used = new Map();
  const headings = [...text.matchAll(/^#{1,6}\s+(.+)$/gmu)].map(([, title]) => {
    const base = title.toLowerCase().replace(/[^\p{L}\p{N}_\- ]/gu, '').replaceAll(' ', '-');
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    return count ? `${base}-${count}` : base;
  });
  return new Set([...headings, ...[...text.matchAll(/\bid="([^"]+)"/gu)].map(match => match[1])]);
}
for (const pair of pairs) {
  const texts = [];
  for (const relative of pair) {
    const path = resolve(root, relative);
    const text = await readFile(path, 'utf8');
    assert.equal((text.match(/^# /gmu) || []).length, 1, `${relative}: expected one title`);
    assert.equal(/[\t ]+$/mu.test(text), false, `${relative}: trailing whitespace`);
    assert.ok(text.endsWith('\n'), `${relative}: missing final newline`);
    for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
      if (/^[a-z]+:/iu.test(target)) continue;
      const [local, anchor] = target.split('#');
      const destination = local ? resolve(dirname(path), decodeURIComponent(local)) : path;
      const info = await stat(destination);
      if (anchor) {
        assert.ok(info.isFile(), `${relative}: anchor requires a file: ${target}`);
        assert.ok(anchors(await readFile(destination, 'utf8')).has(anchor), `${relative}: missing anchor ${target}`);
      }
      links++;
    }
    texts.push(text);
  }
  for (const level of [2, 3]) {
    const pattern = new RegExp(`^${'#'.repeat(level)} `, 'gmu');
    assert.equal((texts[0].match(pattern) || []).length, (texts[1].match(pattern) || []).length, `${pair[0]}: mirror section coverage`);
  }
  const commands = text => [...text.matchAll(/```(?:bash|sh)\n([\s\S]*?)\n```/gu)].map(match => match[1]);
  assert.deepEqual(commands(texts[0]), commands(texts[1]), `${pair[0]}: mirror shell examples differ`);
}
const technical = (await readdir(resolve(root, 'docs'))).filter(name => name.endsWith('.md') && !name.startsWith('README'));
for (const name of technical) {
  const text = await readFile(resolve(root, 'docs', name), 'utf8');
  assert.doesNotMatch(text, /node \.audit\/verify-|bounded live validation|remain pending in J[0-9]/iu, `Historical procedure in current guide: ${name}`);
  for (const [, target] of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
    if (/^[a-z]+:/iu.test(target)) continue;
    const [local, anchor] = target.split('#');
    const path = resolve(root, 'docs', local || name);
    await stat(path);
    if (anchor) assert.ok(anchors(await readFile(path, 'utf8')).has(anchor), `${name}: missing anchor ${target}`);
    links++;
  }
}
console.log(JSON.stringify({ status: 'PASS', bilingualPairs: pairs.length, localLinks: links, technicalGuides: technical.length, limits: 'Checks current guide structure, local links, command parity. Does not prove translation quality, remote URLs or historical assertions. Executes no examples.' }));
