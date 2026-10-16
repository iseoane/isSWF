#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile, writeFile, unlink, symlink } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
const proof=JSON.parse(await readFile(resolve(process.argv[2]||'.audit/recovery-68-native-parent-v3.json'),'utf8'));
const work=join(proof.root,'runs/R68-host-task-loss/workspace');
const cli=join(proof.root,'runtime/tools/isswf-job.mjs');
const cases=[];
for(const [name,kind] of [['mode:payload','file'],['mode:link','symlink'],['dir:payload','file'],['__proto__','file']]){
  const path=join(work,name);
  try {
    if(kind==='file')await writeFile(path,'unauthorized bytes\n',{flag:'wx'});else await symlink('src/counter.mjs',path);
    const result=spawnSync(process.execPath,[cli,'reconcile','--runs-store',join(proof.root,'runs'),'--attempt-id','R68-host-task-loss'],{encoding:'utf8',timeout:10000});
    assert.equal(result.status,0,result.stderr);
    const observed=JSON.parse(result.stdout);cases.push({name,kind,recovery:observed.recovery});
  } finally { await unlink(path); }
}
console.log(JSON.stringify({root:proof.root,cases},null,2));
for(const item of cases)assert.equal(item.recovery.status,'blocked',item.name+' must not bypass mutable scope');
