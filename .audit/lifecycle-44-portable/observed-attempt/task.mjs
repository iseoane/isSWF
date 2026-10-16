import{readFile,writeFile,access}from'node:fs/promises';import{dirname,join}from'node:path';import{spawnSync}from'node:child_process';
const workspace=process.argv[2],release=join(dirname(workspace),'parent-release');let ready=false;
for(let i=0;i<400;i++){try{await access(release);ready=true;break;}catch{}await new Promise(r=>setTimeout(r,20));}
if(!ready)process.exit(9);
const file=join(workspace,'src/math.mjs');const old=await readFile(file,'utf8');await writeFile(file,old.replace('total + value, 1','total * value, 1'));
const check=spawnSync(process.execPath,[join(workspace,'check.mjs')],{cwd:workspace,encoding:'utf8',timeout:2000});process.stdout.write(check.stdout);if(check.status!==0)process.exit(check.status??1);
await writeFile(join(workspace,'.factory/jobs/J601/A001.md'),'Technical checks passed. Operator acceptance remains pending.\n');
