#!/usr/bin/env node
import assert from 'node:assert/strict';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const source=resolve(process.argv[2]||'.');
const root=await mkdtemp(join(tmpdir(),'isswf-recovery68-path-controls-')),hook=join(root,'inject.mjs');
await writeFile(hook,`import fs from 'node:fs/promises';import{syncBuiltinESMExports}from'node:module';const original=fs.readFile;fs.readFile=async(...args)=>{const b=await original(...args);if(/\\/runs\\/\\.prepare-[^/]+\\/config\\.json$/.test(String(args[0]))){const c=JSON.parse(b);if(process.env.CONTROL_FIELD==='sdkPath')delete c.sdkPath;else c.authPath='relative-auth';return JSON.stringify(c);}return b;};syncBuiltinESMExports();`);
const cases=[];
for(const field of ['sdkPath','authPath']) {
  const r=spawnSync(process.execPath,['--import',hook,join(source,'.audit/verify-recovery-68-native.mjs'),source,'--launch-via-pi'],{encoding:'utf8',timeout:120000,maxBuffer:4*1024*1024,env:{...process.env,CONTROL_FIELD:field}});
  assert.equal(r.status,1);
  assert(r.stderr.includes(field+' must be an explicit absolute opaque path before committing job'),r.stderr);
  cases.push({field,malformed:field==='sdkPath'?'missing':'relative',rejectedBeforeJobCommit:true});
}
console.log(JSON.stringify({status:'PASS',root,cases,providerPromptStarted:false,method:'actual native verifier with process-local readFile injection on seed config only; files unchanged'},null,2));
