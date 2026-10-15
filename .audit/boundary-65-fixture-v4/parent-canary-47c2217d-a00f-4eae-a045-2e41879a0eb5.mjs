import fs from 'node:fs';import net from 'node:net';import cp from 'node:child_process';
const outside="/tmp/isswf-boundary65-3b68df04-9a7b-4b81-8035-89d900aa9463-UdEI40/outside-canary.txt";const r={};
for(const [k,f] of Object.entries({outsideRead:()=>fs.readFileSync(outside),outsideWrite:()=>fs.writeFileSync(outside,'changed'),symlinkRead:()=>fs.readFileSync('/work/outside-link'),symlinkWrite:()=>fs.writeFileSync('/work/outside-link','changed'),sourceWrite:()=>fs.writeFileSync('/runtime/sdk/package.json','changed')})){try{f();r[k]='unexpected-success'}catch(e){r[k]=e.code||e.name}}
r.fakeEnvAbsent=process.env.FAKE_CREDENTIAL===undefined;
const sub=cp.spawnSync('/bin/sh',['-c','cat '+outside],{encoding:'utf8'});r.subprocessReadDenied=sub.status!==0&&/No such file or directory/.test(sub.stderr);
try{const s=net.connect(35141,'127.0.0.1');s.setTimeout(700);s.on('connect',()=>{r.network='connected';s.destroy()});s.on('error',e=>{r.network=e.code})}catch(e){r.network=e.code||e.name}
setTimeout(()=>console.log(JSON.stringify(r)),800);
