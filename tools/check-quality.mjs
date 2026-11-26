import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyPackage } from './factory-package.mjs';
import { unrunTests } from '../tooling/quality/unrun-tests.mjs';
import { existsSync } from 'node:fs';

const source = resolve(process.argv[2] || dirname(dirname(fileURLToPath(import.meta.url))));
function run(binary, args, win32Timeout = 300000) {
  const result = spawnSync(binary, args, {
    cwd: source, encoding: 'utf8', timeout: process.platform === 'win32' ? win32Timeout : 60000, maxBuffer: 4 * 1024 * 1024,
    env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${binary} ${args.join(' ')}\n${result.stderr}\n${result.stdout}`);
  return result.stdout.trim();
}
async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert.equal(entry.isSymbolicLink(), false, `unexpected symlink: ${join(directory, entry.name)}`);
    if (entry.isDirectory()) files.push(...await filesUnder(join(directory, entry.name)));
    else if (entry.isFile()) files.push(join(directory, entry.name));
  }
  return files;
}
const unrun = await unrunTests(source);
assert.deepEqual(unrun, [], `tests run by neither check-quality nor CI (add them to a check, or exempt them with a reason in tooling/quality/unrun-tests.mjs): ${unrun.join(', ')}`);
const syntaxFiles = (await Promise.all(['tools', 'tests'].map(path => filesUnder(join(source, path)))))
  .flat().filter(path => path.endsWith('.mjs')).sort();
for (const path of syntaxFiles) run(process.execPath, ['--check', path]);
const markdownFiles = (await filesUnder(join(source, '.agents'))).filter(path => path.endsWith('.md'));
let checkedLinks = 0;
for (const path of markdownFiles) {
  const text = await readFile(path, 'utf8');
  assert.equal(/[\t ]+$/mu.test(text), false, `trailing whitespace: ${path}`);
  if (basename(path) === 'SKILL.md') {
    assert.match(text, /^---\nname: [a-z0-9-]+\ndescription: .+\n(?:disable-model-invocation: (?:true|false)\n)?---\n/u, path);
    assert.equal(text.match(/^name: (.+)$/mu)?.[1], basename(dirname(path)));
  }
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/gu)) {
    const link = match[1];
    if (/^[a-z]+:/iu.test(link) || link.startsWith('#')) continue;
    await readFile(resolve(dirname(path), link.split('#')[0]));
    checkedLinks++;
  }
}
const docsResult = run(process.execPath, [join(source, 'tooling/quality/check-docs.mjs'), source]);
const documentationResult = run(process.execPath, [join(source, 'tests/documentation.mjs'), source]);
run(process.execPath, [join(source, 'tests/workflow-flow.mjs'), source]);
run(process.execPath, [join(source, 'tooling/maintenance/workflow-flow.mjs'), '--check', '--root', source]);
run(process.execPath, [join(source, 'tests/first-session.mjs'), source]);
run(process.execPath, [join(source, 'tooling/maintenance/first-session.mjs'), '--check', '--root', source]);
run(process.execPath, [join(source, 'tests/ci-minutes.mjs'), source]);
const packageMetadataResult = run(process.execPath, [join(source, 'tests/package-metadata.mjs'), source]);
console.log(packageMetadataResult);
const revision = run('git', ['rev-parse', 'HEAD']);
const store = await mkdtemp(join(tmpdir(), 'isswf-quality-package-'));
try {
  run(process.execPath, [join(source, 'tools/factory-package.mjs'), 'materialize', '--source', source, '--revision', revision, '--store', store]);
  await verifyPackage(join(store, revision), revision);
} finally {
  await rm(store, { recursive: true, force: true });
}
const releaseSourceBatchResult = run(process.execPath, [join(source, 'tests/release-source-batch.mjs'), source]);
const toolsInstallResult = run(process.execPath, [join(source, 'tests/factory-tools-install.mjs'), source]);
const statusResult = run(process.execPath, [join(source, 'tests/initiative-status.mjs'), source]);
const snapshotResult = run(process.execPath, [join(source, 'tests/initiative-snapshot.mjs'), source]);
const planEditResult = run(process.execPath, [join(source, 'tests/isswf-plan-edit.mjs'), source]);
const recordCheckResult = run(process.execPath, [join(source, 'tests/isswf-record-check.mjs'), source]);
const recordNewResult = run(process.execPath, [join(source, 'tests/isswf-record-new.mjs'), source]);
const recordGuardResult = run(process.execPath, [join(source, 'tests/isswf-record-guard.mjs'), source]);
const dispatchGuardResult = run(process.execPath, [join(source, 'tests/isswf-dispatch-guard.mjs'), source]);
const handoffResult = run(process.execPath, [join(source, 'tests/isswf-handoff.mjs'), source]);
const reviewPrepareResult = run(process.execPath, [join(source, 'tests/isswf-review-prepare.mjs'), source]);
const verifyResult = run(process.execPath, [join(source, 'tests/isswf-verify.mjs'), source]);
// Fails when a commit after a job's last reviewed candidate is not covered by a review; CI fetches the full history this reads.
const coverageResult = run(process.execPath, [join(source, 'tools/isswf-handoff.mjs'), 'coverage', '--project', source]);
const commandGuardResult = run(process.execPath, [join(source, 'tests/isswf-command-guard.mjs'), source]);
const branchGuardResult = run(process.execPath, [join(source, 'tests/isswf-branch-guard.mjs'), source]);
const compactionResult = run(process.execPath, [join(source, 'tests/isswf-compaction.mjs'), source]);
const runUsageResult = run(process.execPath, [join(source, 'tests/run-usage.mjs'), source]);
const pathContainmentResult = run(process.execPath, [join(source, 'tests/path-containment-portability.mjs'), source]);
const directorySyncResult = run(process.execPath, [join(source, 'tests/directory-sync-portability.mjs'), source]);
const literalPathspecsResult = run(process.execPath, [join(source, 'tests/git-literal-pathspecs.mjs'), source]);
const tokenReportResult = run(process.execPath, [join(source, 'tests/token-report.mjs'), source]);
const tokenNativeUsageResult = run(process.execPath, [join(source, 'tests/token-native-usage.mjs'), source]);
const tokenNativeClaudeResult = run(process.execPath, [join(source, 'tests/token-native-claude.mjs'), source]);
const tokenNativeClaudeTranscriptResult = run(process.execPath, [join(source, 'tests/token-native-claude-transcript.mjs'), source]);
const tokenNativeAutoPiResult = run(process.execPath, [join(source, 'tests/token-native-auto-pi.mjs'), source]);
const panelResult = run(process.execPath, [join(source, 'tests/initiative-panel.mjs'), source]);
const nextActionResult = run(process.execPath, [join(source, 'tests/initiative-next-action.mjs'), source]);
const gitFixtureResult = run(process.execPath, [join(source, 'tests/git-fixture-helper.mjs'), source]);
const gitOptionalLocksResult = run(process.execPath, [join(source, 'tests/git-optional-locks.mjs'), source]);
const fixtureRepositoriesResult = run(process.execPath, [join(source, 'tests/fixture-repositories.mjs'), source]);
const gitIdentityResult = run(process.execPath, [join(source, 'tests/git-evidence.mjs'), source]);
const gitContentResult = run(process.execPath, [join(source, 'tests/git-content.mjs'), source]);
const reviewChecksResult = run(process.execPath, [join(source, 'tests/review-checks.mjs'), source]);
const reviewLaunchResult = run(process.execPath, [join(source, 'tests/isswf-review-launch.mjs'), source]);
const gitMcpResult = run(process.execPath, [join(source, 'tests/git-evidence-mcp.mjs'), source]);
const planGrantBoundaryResult = run(process.execPath, [join(source, 'tests/plan-grant-boundary.mjs'), source]);
const planPublicationResult = run(process.execPath, [join(source, 'tests/plan-publication.mjs'), source]);
const reviewGuidanceResult = run(process.execPath, [join(source, 'tests/review-guidance.mjs'), source]);
const planResult = run(process.execPath, [join(source, 'tests/initiative-plan.mjs'), source]);
const dependencyPlanResult = run(process.execPath, [join(source, 'tests/initiative-dependencies.mjs'), source]);
const inventoryResult = run(process.execPath, [join(source, 'tests/project-quality.mjs'), source]);
const auditArchiveResult = run(process.execPath, [join(source, 'tests/audit-archive.mjs'), source]);
const intakeResult = run(process.execPath, [join(source, 'tests/issue-intake.mjs'), source]);
const methodologyResult = run(process.execPath, [join(source, 'tests/worker-methodology.mjs'), source]);
const checkoutLineEndingsResult = run(process.execPath, [join(source, 'tests/checkout-line-endings.mjs'), source]);
const staleStatementsResult = run(process.execPath, [join(source, 'tests/stale-statements.mjs'), source]);
const hostPortabilityResult = run(process.execPath, [join(source, 'tests/host-portability.mjs'), source]);
const skillWrapperResult = run(process.execPath, [join(source, 'tests/skill-wrapper-descriptions.mjs'), source]);
const hostPrerequisiteResult = run(process.execPath, [join(source, 'tests/host-prerequisites.mjs'), source]);
const worktreeLocationResult = run(process.execPath, [join(source, 'tests/worktree-location.mjs'), source]);
const releasePackageResult = run(process.execPath, [join(source, 'tests/release-package.mjs'), source], 600000);
const unrunTestsResult = run(process.execPath, [join(source, 'tests/unrun-tests.mjs'), source]);
const planCommitGuardResult = run(process.execPath, [join(source, 'tests/isswf-plan-commit-guard.mjs'), source]);
const verificationGuardResult = run(process.execPath, [join(source, 'tests/isswf-verification-guard.mjs'), source]);
const recordsPushGuardResult = run(process.execPath, [join(source, 'tests/isswf-records-push-guard.mjs'), source]);
const integrationGateResult = run(process.execPath, [join(source, 'tests/isswf-integration-gate.mjs'), source]);
const undispatchedResult = run(process.execPath, [join(source, 'tests/isswf-undispatched.mjs'), source]);
const parallelWorkersResult = run(process.execPath, [join(source, 'tests/isswf-parallel-workers.mjs'), source]);
const fsmonitorOrphansResult = run(process.execPath, [join(source, 'tests/fsmonitor-orphans.mjs'), source]);
const pathWithinResult = run(process.execPath, [join(source, 'tests/path-within.mjs'), source]);
const ciStateResult = run(process.execPath, [join(source, 'tests/isswf-ci-state.mjs'), source]);
const integrateResult = run(process.execPath, [join(source, 'tests/isswf-integrate.mjs'), source]);
const bunReleaseResult = run(process.execPath, [join(source, 'tests/bun-release.mjs'), source]);
const qualityModules = join(source, 'tooling/quality/node_modules');
function optionalTool(name, args) {
  const binary = join(qualityModules, name, 'bin', `${name}.js`);
  if (!existsSync(binary)) return `SKIPPED: ${name} is not installed; run npm ci --prefix tooling/quality --ignore-scripts`;
  run(process.execPath, [binary, ...args]);
  return 'PASS';
}
const eslintResult = optionalTool('eslint', ['--config', 'tooling/quality/eslint.config.mjs', 'tools', 'tests', ...(await readdir(join(source, 'tooling/quality'))).filter(name => name.endsWith('.mjs')).map(name => `tooling/quality/${name}`)]);
const knipResult = optionalTool('knip', ['--config', 'tooling/quality/knip.json', '--no-progress']);
console.log(JSON.stringify({ status: 'PASS', unrunTestsResult, planCommitGuardResult, verificationGuardResult, recordsPushGuardResult, integrationGateResult, undispatchedResult, parallelWorkersResult, ciStateResult, integrateResult, fsmonitorOrphansResult, pathWithinResult, eslintResult, knipResult, docsResult, documentationResult, releaseSourceBatchResult, toolsInstallResult, statusResult, snapshotResult, planEditResult, recordCheckResult, recordNewResult, recordGuardResult, dispatchGuardResult, handoffResult, reviewPrepareResult, verifyResult, coverageResult, commandGuardResult, branchGuardResult, compactionResult, runUsageResult, pathContainmentResult, directorySyncResult, literalPathspecsResult, tokenReportResult, tokenNativeUsageResult, tokenNativeClaudeResult, tokenNativeClaudeTranscriptResult, tokenNativeAutoPiResult, panelResult, nextActionResult, gitFixtureResult, gitOptionalLocksResult, fixtureRepositoriesResult, gitIdentityResult, gitContentResult, reviewChecksResult, reviewLaunchResult, gitMcpResult, planGrantBoundaryResult, planPublicationResult, reviewGuidanceResult, planResult, dependencyPlanResult, inventoryResult, auditArchiveResult, intakeResult, methodologyResult, checkoutLineEndingsResult, hostPortabilityResult, staleStatementsResult, skillWrapperResult, worktreeLocationResult, releasePackageResult, bunReleaseResult, revision, syntaxFiles: syntaxFiles.length, markdownFiles: markdownFiles.length, checkedLinks, package: 'materialized committed HEAD and verified receipt/payload', hostPrerequisiteResult, nativeHostDelegation: { status: 'NOT_RUN', reason: 'Required separate host-native CI check; not covered by portable quality run' }, limits: 'ESLint and Knip run only when installed under tooling/quality; otherwise eslintResult and knipResult say SKIPPED. Providers, Python and external-service behavior are not checked. The required host-native delegation check is separate and NOT_RUN here; a BLOCKED result from that check is nonzero and is not a pass. When Bun is available, bunReleaseResult checks a real compiled artifact; otherwise that artifact check is explicitly skipped. Optional real Pi package-manager installation is reported by releasePackageResult.' }, null, 2));
