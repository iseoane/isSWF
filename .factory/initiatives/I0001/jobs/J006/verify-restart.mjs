import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function baselineChanges(baseline, workspace) {
  const expected = new Map(baseline.map(entry => [entry.path, entry]));
  const actual = new Map(workspace.map(entry => [entry.path, entry]));
  return [...new Set([...expected.keys(), ...actual.keys()])].sort().filter(path => {
    const before = expected.get(path), after = actual.get(path);
    return !before || !after || before.bytes !== after.bytes || before.mode !== after.mode || before.sha256 !== after.sha256;
  });
}

function verify(originalDirectory) {
  // Read-only verifier for the original operator-owned synthetic case, not arbitrary archives.
  assert.ok(isAbsolute(originalDirectory ?? ''), 'explicit original case directory required');
  const root = fs.realpathSync(originalDirectory);
  const approvedRuntimeSource = '33103a97937ff7b5a8d843681af81364edbdb3fb';
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  function read(path) {
    const stat = fs.lstatSync(path);
    assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.size <= 256000, 'bounded regular evidence required');
    assert.equal(fs.realpathSync(path), path, 'aliased evidence path refused');
    return fs.readFileSync(path);
  }
  const json = path => JSON.parse(read(path));
  const prepared = json(root + '/prepared.json'), before = json(root + '/before-reboot.json');
  assert.equal(prepared.root, root);
  assert.equal(prepared.project, root + '/project');
  assert.equal(prepared.store, root + '/runs');
  assert.equal(fs.realpathSync(prepared.project), prepared.project);
  assert.equal(fs.realpathSync(prepared.store), prepared.store);
  assert.equal(prepared.logicalJobRef, 'I0001/J006/restart-case-v2');
  assert.equal(prepared.attemptId, 'I0001-J006-restart-v2-A001');
  const env = { PATH: '/usr/bin:/bin', HOME: root, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_NO_REPLACE_OBJECTS: '1' };
  const git = (repo, ...args) => execFileSync('git', ['-C', repo, '-c', 'core.fsmonitor=false', ...args], { env, timeout: 10000, maxBuffer: 1024 * 1024 });
  // Exact approved Git blob hashes keep this check usable with source Git metadata hidden.
  const runtimeHashes = {
    "tools/isswf-job.mjs": "a1d3f5d21b5861b1e7c5b1892755d8016ca1c1e7a09d13032817d57feb0de939",
    "tools/factory-package.mjs": "aeaa717b8110b5e3510291f5735004f4bc37710aad59d1aa1f4db2f982ddfe3a",
    "tools/pi-worker-task.mjs": "49fa47475cc63e1267177d92a2fdcb7f0f23d38781d7403df6b89c05feb4b4cf",
    "tools/worker-lifecycle.mjs": "b797a88fa2fa55774898ca012637ec386456e17ae62d36eb50be701dec5d00e6",
    "tools/native-recovery.mjs": "e059633e570be3685a62acacd1e8d2ce552ac01ca7e7dec2cdb2bad3fa31c03e",
    "tools/external-effect-journal.mjs": "a6f2366c3078b25b03445501a689dbc6c9141a25856850a008b5d35a913d8a60",
    "tools/recovery-review.mjs": "303c103bbdae05dce145466a53c5b5913227e27e5fbd26c5ba86b352ca3a52df",
    "tools/job-successor.mjs": "ad8a159eb9a01bdfb51601c2288fac6b6aab21a5795339902e88bab60dfd9f7e",
    "tools/execution-capacity.mjs": "580634fd306c874b991848ed67268d741650fc0352b49ed963e9681045fcd505",
    "tools/isswf-plan.mjs": "7f9e7f375eaa5c0e6296affc4f0c292a51f69d5d0546d839a9391c534a7786aa"
  };
  const runtimeFiles = ['isswf-job', 'factory-package', 'pi-worker-task', 'worker-lifecycle', 'native-recovery', 'external-effect-journal', 'recovery-review', 'job-successor', 'execution-capacity', 'isswf-plan'];
  // Check executable consumers against retained approved source, not self-asserted JSON hashes.
  for (const name of runtimeFiles) {
    const path = 'tools/' + name + '.mjs';
    assert.equal(fs.realpathSync(prepared.project + '/' + path), prepared.project + '/' + path);
    assert.equal(hash(read(prepared.project + '/' + path)), runtimeHashes[path], path);
  }
  assert.equal(git(prepared.project, 'rev-parse', 'HEAD').toString().trim(), prepared.inputSha);
  assert.equal(hash(read(prepared.project + '/job.json')), prepared.jobSha256);
  assert.equal(hash(read(prepared.project + '/brief.md')), prepared.briefSha256);
  assert.equal(hash(read(prepared.project + '/.factory/models.json')), prepared.modelsSha256);
  const approval = json(root + '/operator-approval.json');
  assert.equal(approval.operatorAnswers.restart, 'Autorizar nuevo caso');
  assert.equal(approval.restartScope.cumulativeWorkersMax, 2);
  assert.equal(approval.preparedSha256, hash(read(root + '/prepared.json')));
  assert.deepEqual(before.prepared, prepared);
  assert.equal(hash(read(root + '/operator-approval.json')), before.approvalSha256);
  const requested = json(root + '/reboot-requested.json'), command = json(root + '/reboot-command-result.json');
  assert.equal(requested.beforeSha256, hash(read(root + '/before-reboot.json')));
  assert.equal(command.exitCode, 0);
  const boot = fs.readFileSync('/proc/sys/kernel/random/boot_id', 'utf8').trim();
  assert.notEqual(boot, before.bootId, 'a command result alone does not prove changed boot');
  const attempt = prepared.store + '/' + prepared.attemptId;
  const metadata = [];
  assert.deepEqual(Object.keys(before.metadata).sort(), ['dispatch.json', 'execution-child.json', 'native-recovery.json', 'owner.json']);
  for (const [name, entry] of Object.entries(before.metadata)) {
    assert.ok(['dispatch.json', 'owner.json', 'execution-child.json', 'native-recovery.json'].includes(name));
    assert.equal(hash(read(attempt + '/' + name)), entry.sha256, name);
    metadata.push(name);
  }
  for (const entry of before.workspaceTree) {
    assert.ok(entry.path && !isAbsolute(entry.path) && entry.path.split('/').every(part => part && part !== '..' && part !== '.'));
    assert.equal(hash(read(attempt + '/workspace/' + entry.path)), entry.sha256, entry.path);
  }
  const actualTree = [];
  const workspace = attempt + '/workspace';
  function walk(directory) {
    for (const name of fs.readdirSync(directory)) {
      const path = directory + '/' + name, stat = fs.lstatSync(path);
      assert.equal(stat.isSymbolicLink(), false);
      if (stat.isDirectory()) walk(path);
      else { assert.ok(stat.isFile()); actualTree.push({ path: path.slice(workspace.length + 1), bytes: stat.size, executable: !!(stat.mode & 0o111), sha256: hash(read(path)) }); }
    }
  }
  walk(workspace);
  actualTree.sort((a, b) => a.path.localeCompare(b.path));
  assert.deepEqual(actualTree, before.workspaceTree, 'complete partial tree must match before snapshot');
  const baseline = [];
  for (const entry of git(prepared.project, 'ls-tree', '-r', '-z', prepared.runtimeSha).toString().split('\0').filter(Boolean)) {
    const tab = entry.indexOf('\t'), path = entry.slice(tab + 1), [mode, type, oid] = entry.slice(0, tab).split(' ');
    assert.ok(type === 'blob' && ['100644', '100755'].includes(mode), 'regular baseline files required');
    const bytes = git(prepared.project, 'cat-file', 'blob', oid);
    baseline.push({ path, bytes: bytes.length, mode, sha256: hash(bytes) });
  }
  const actualBaseline = actualTree.map(entry => ({ ...entry, mode: entry.executable ? '100755' : '100644' }));
  const changed = baselineChanges(baseline, actualBaseline);
  assert.deepEqual(changed, ['result.txt']);
  assert.equal(baseline.find(entry => entry.path === 'result.txt')?.mode, actualBaseline.find(entry => entry.path === 'result.txt')?.mode, 'only partial result content may change');
  const cli = operation => JSON.parse(execFileSync(process.execPath, [prepared.project + '/tools/isswf-job.mjs', operation, '--runs-store', prepared.store, '--attempt-id', prepared.attemptId], { env, encoding: 'utf8', timeout: 10000, maxBuffer: 1024 * 1024 }));
  const observed = cli('read'), reconciled = cli('reconcile');
  assert.equal(observed.state, 'unknown');
  assert.equal(observed.executionChild?.reason, 'child boot identity mismatched');
  assert.deepEqual(observed.job, before.observation.job, 'original job binding must remain unchanged');
  assert.equal(reconciled.recovery?.status, 'blocked');
  assert.equal(reconciled.recovery.reason, 'execution task cessation not confirmed', 'pin/package validation failure is not the expected boot-identity block');
  assert.equal(reconciled.recovery.retry, 'never');
  assert.equal(reconciled.reviewRequired, true);
  assert.equal(observed.job.mode, 'offline');
  assert.equal(fs.existsSync(attempt + '/pi-model-invocation.json'), false);
  console.log(JSON.stringify({ status: 'PASS-bounded-changed-boot-verification', approvedRuntimeSource, bootBefore: before.bootId, bootAfter: boot, metadataVerified: metadata, workspaceFilesVerified: before.workspaceTree.length, protectedChanges: changed, normalRead: { state: observed.state, reason: observed.reason, executionChild: observed.executionChild }, normalReconcile: reconciled.recovery, mode: observed.job.mode, modelInvocationMarkerAbsent: true, limits: ['Original trusted synthetic fixture only; not authentication of relocated or foreign evidence', 'No task launch, repair, replay, model call, GitHub call or reboot requested by this verifier', 'Conservative blocked recovery, not worker success, automatic continuation or external-effect reconciliation'] }, null, 2));

}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) verify(process.argv[2]);
