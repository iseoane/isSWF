import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

// Groups `gh run list --json event,headBranch,conclusion,createdAt,updatedAt,databaseId` output by event and branch.
export function summarizeRuns(runs) {
  const byKey = new Map();
  for (const run of runs) {
    const key = `${run.event} ${run.headBranch}`;
    const group = byKey.get(key) ?? { key, runs: 0, cancelled: 0, minutes: 0 };
    group.runs += 1;
    if (run.conclusion === 'cancelled') group.cancelled += 1;
    group.minutes += (Date.parse(run.updatedAt) - Date.parse(run.createdAt)) / 60000;
    byKey.set(key, group);
  }
  const groups = [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key)).map(group => ({ ...group, minutes: round(group.minutes) }));
  const total = { runs: 0, cancelled: 0, minutes: 0 };
  for (const group of groups) {
    total.runs += group.runs;
    total.cancelled += group.cancelled;
    total.minutes += group.minutes;
  }
  return { groups, total: { ...total, minutes: round(total.minutes) } };
}

const round = minutes => Math.round(minutes * 10) / 10;

function formatReport({ groups, total }) {
  const line = (label, row) => `${label.padEnd(40)} ${`${row.runs} runs`.padStart(9)} ${`${row.cancelled} cancelled`.padStart(14)} ${`${row.minutes} min`.padStart(10)}`;
  return [...groups.map(group => line(group.key, group)), line('total', total)].join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  try {
    console.log(formatReport(summarizeRuns(JSON.parse(readFileSync(file ?? 0, 'utf8')))));
  } catch (error) {
    console.error(`Usage: gh run list --json event,headBranch,conclusion,createdAt,updatedAt,databaseId | node tooling/maintenance/ci-minutes.mjs [runs.json]\n${error.message}`);
    process.exit(2);
  }
}
