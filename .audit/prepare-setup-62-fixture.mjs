import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=fs.mkdtempSync(path.join(os.tmpdir(),'isswf-setup62-'));
const cases={};
for(const name of ['new-project','configured-repeat','dirty-active']){
 const dir=path.join(root,name);fs.mkdirSync(dir);
 const git=(...args)=>execFileSync('git',args,{cwd:dir,encoding:'utf8'}).trim();
 git('init','-q');git('config','user.email','fixture@example.invalid');git('config','user.name','Fixture');
 fs.writeFileSync(path.join(dir,'README.md'),'# Demo project\nLocal CLI fixture.\n');
 fs.writeFileSync(path.join(dir,'check.mjs'),"console.log('local check passes');\n");
 if(name!=='new-project'){
  fs.mkdirSync(path.join(dir,'.factory/jobs/J401'),{recursive:true});
  fs.copyFileSync('.factory/models.json',path.join(dir,'.factory/models.json'));
  fs.writeFileSync(path.join(dir,'.factory/project-setup.md'),'# Project setup\nOwner: fixture operator.\nScope: this checkout only.\nChecks: node check.mjs from project root.\nDelivery: local draft only.\nModel configuration: .factory/models.json, inherited approved routes, no override.\nCustom decision: preserve the existing review checklist.\nIsolation: not technically established; client execution blocked.\n');
  fs.writeFileSync(path.join(dir,'.factory/jobs/J401/brief-r1.md'),'# J401\nExisting pinned job; preserve its inputs.\n');
 }
 git('add','.');git('commit','-qm','Fixture baseline');const checkpoint=git('rev-parse','HEAD');
 if(name==='dirty-active'){
  fs.writeFileSync(path.join(dir,'.factory/jobs/J401/A001.md'),`# A001\nReported status: running (saved report, not current liveness).\nPinned input/config checkpoint: ${checkpoint}\nInput: .factory/jobs/J401/brief-r1.md\n`);
  fs.appendFileSync(path.join(dir,'.factory/project-setup.md'),'Operator draft: delivery preference being revised; preserve.\n');
 }
 cases[name]={root:dir,checkpoint,status:git('status','--porcelain')};
}
fs.writeFileSync('.audit/setup-62-fixture.json',JSON.stringify({root,cases,limits:'Disposable local records; saved running status is not real actor liveness. No sandbox/runtime proof.'},null,2)+'\n');
console.log(root);
