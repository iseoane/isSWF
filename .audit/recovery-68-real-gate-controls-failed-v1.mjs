#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const fixture=JSON.parse(await readFile(process.argv[2])),source=resolve(process.argv[3]||'.'),hash=b=>createHash('sha256').update(b).digest('hex');
const marker=await readFile(fixture.invocationMarkers.original);assert.equal(JSON.parse(marker).mode,'offline','use an already consumed offline control, never a reserved real fixture');
const path=join(fixture.root,'negative-gate-fixture.json');await writeFile(path,JSON.stringify({...fixture,committedRuntime:true,sourceCommit:fixture.runtimeSha}));
const valid={verdict:'PASS',phase:'original',fixtureSha256:hash(await readFile(path)),files:{}};
const cases=[['missing',null,/ENOENT/],['verdict',{...valid,verdict:'FAIL'},/precall gate verdict/],['phase',{...valid,phase:'successor'},/precall gate phase/],['fixture',{...valid,fixtureSha256:'0'.repeat(64)},/precall gate fixture identity/],['source',{...valid},/precall identity/]];
for(const[name,value,reason]of cases){const gate=join(fixture.root,'negative-gate-'+name+'.json');if(value)await writeFile(gate,JSON.stringify(value));const r=spawnSync(process.execPath,[join(source,'.audit/verify-recovery-68-real.mjs'),path,'interrupt','real',gate],{encoding:'utf8',timeout:10000,maxBuffer:1024*1024});assert.equal(r.status,1);assert.match(r.stderr,reason);assert.deepEqual(await readFile(fixture.invocationMarkers.original),marker);}
console.log(JSON.stringify({status:'PASS',cases:cases.map(c=>c[0]),providerPrompts:0,existingOfflineInvocationMarkerUnchanged:true,limits:'deliberately invalid gates on consumed offline fixture, no real fixture invocation'},null,2));
