import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
for(const arg of ['--help','help']) {
 const result=spawnSync(process.execPath,['tools/isswf-job.mjs',arg],{encoding:'utf8',timeout:3000});
 assert.equal(result.status,0,'help must succeed without project/config/auth');
 assert.equal(result.stderr,'');
 for(const word of ['run','read','reconcile','--project','--input-sha','--job','--runs-store','--attempt-id','--grant-ref','independent review']) assert.ok(result.stdout.includes(word),'help must explain '+word);
}
const invalid=spawnSync(process.execPath,['tools/isswf-job.mjs','run'],{encoding:'utf8',timeout:3000});
assert.notEqual(invalid.status,0,'help must not bypass run validation');
console.log('3 original operational CLI checks passed');
