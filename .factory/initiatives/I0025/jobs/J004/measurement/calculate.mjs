import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
const load = name => JSON.parse(readFileSync(new URL(name, import.meta.url), 'utf8'));
const start = load('start.json'), end = load('end.json'), actors = load('actors.json');
function nominal(value) {
  const match = /^(\d+(?:\.\d+)?)(k|M)?$/u.exec(value);
  assert(match, 'invalid retained compact display');
  return Number(match[1]) * (match[2] === 'M' ? 1e6 : match[2] === 'k' ? 1e3 : 1);
}
// Exact installed pi-subagents 0.83.0 compact-display rule, for consistency only.
function display(n) {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1)}k`;
  if (n < 999500) return `${Math.round(n / 1000)}k`;
  return `${Number((n / 1e6).toFixed(1))}M`;
}
assert.equal(start.children.length, 9);
assert.equal(end.children.length, 13);
assert.deepEqual(end.children.slice(0, 9), start.children, 'older actors changed');
assert.equal(actors.actors.length, 4);
for (let i = 0; i < 4; i++) {
  const actual = actors.actors[i], shown = end.children[i + 9];
  assert.equal(shown.role, actual.agent);
  assert.equal(shown.turns, actual.counters.turns);
  for (const [counter, field] of [['input', 'inputDisplay'], ['output', 'outputDisplay'], ['cacheRead', 'cacheReadDisplay']]) {
    assert.equal(display(actual.counters[counter]), shown[field], 'new native actor does not match display');
  }
}
const child = Object.fromEntries(['input', 'output', 'cacheRead', 'cacheWrite', 'turns'].map(key => [key, actors.actors.reduce((sum, row) => sum + row.counters[key], 0)]));
assert.deepEqual(child, actors.subtotal);
assert.equal(child.input + child.output + child.cacheRead + child.cacheWrite, 4518341);
const parent = Object.fromEntries([['input', 'inputDisplay'], ['output', 'outputDisplay'], ['cacheRead', 'cacheReadDisplay']].map(([key, field]) => {
  const delta = nominal(end.parent[field]) - nominal(start.parent[field]);
  assert(delta >= 0);
  return [key, delta];
}));
parent.cacheWrite = null;
parent.turns = end.parent.turns - start.parent.turns;
assert.equal(end.childSubtotal.turns - start.childSubtotal.turns, child.turns);
const turns = parent.turns + child.turns;
assert.equal(end.inclusiveTotal.turns - start.inclusiveTotal.turns, turns);
const known = { input: parent.input + child.input, output: parent.output + child.output, cacheRead: parent.cacheRead + child.cacheRead, cacheWrite: null };
const result = {
  version: 1,
  scope: 'prospective-J004-useful-engineering-only',
  parent: { ...parent, tokenAvailability: 'approximate-difference-of-rounded-native-displays' },
  newChildren: { ...child, processed: 4518341, tokenAvailability: 'native-host-normalized-integer-summaries', expectedAttempts: 4, measuredAttempts: 4 },
  knownCombinedComponents: known,
  knownProcessedSubtotalApproximate: known.input + known.output + known.cacheRead + child.cacheWrite,
  nominalRoundingUncertaintyApproximate: { input: 1000, output: 1000, cacheRead: 100000, knownSubtotal: 102000 },
  turns,
  wholeWorkflowProcessedTotal: null,
  tokensPerAcceptedOutcome: null,
  cacheReadShare: null,
  costsIncluded: false,
  priorChildrenExcluded: 9,
  continuity: 'same-coordinator-conversation-and-branch-as-operator-supplied-no-exported-native-branch-ID',
  checks: { oldNineDisplaysUnchanged: true, fourNewNativeSummariesMatchDisplay: true, childTurnDeltaMatches: true, inclusiveTurnDeltaMatches: true },
  limits: [
    'Parent compact k/M displays are rounded; nominal deltas and uncertainty are approximate, not exact provider counts or statistical confidence intervals.',
    'Parent cache writes were not displayed and remain unknown; combined known subtotal is not a complete processed total.',
    'Cache reads count repeated context processing, not unique or new tokens, billing, or money saved.',
    'No product acceptance observed, so no accepted-outcome ratio; no before/after optimization comparison or savings claim.',
    'Missing-artifact coverage and native branch continuity are not independently certified by the display.',
    'Manual current-parent snapshots; not automatic collection, installed-Claude validation, or native Windows verification.'
  ]
};
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
