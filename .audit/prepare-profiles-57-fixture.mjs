// Audit-only local fixture producer, not a factory command.
import {mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=mkdtempSync(join(tmpdir(),'isswf-profiles57-'));
const put=(p,t)=>{mkdirSync(dirname(join(root,p)),{recursive:true});writeFileSync(join(root,p),t)};
const git=(...a)=>execFileSync('git',['-C',root,...a],{encoding:'utf8'}).trim();
git('init','-q');git('config','user.name','Profile audit');git('config','user.email','audit@example.invalid');
put('src/math.mjs','export function sum(a, b) { return a + b; }\n');
put('src/cli.mjs',"import {sum} from './math.mjs';\nconsole.log(sum(Number(process.argv[2]), Number(process.argv[3])));\n");
put('check.mjs',"import assert from 'node:assert/strict';\nimport {sum} from './src/math.mjs';\nassert.equal(sum(7,3),10);\nassert.equal(sum(0,0),0);\nconsole.log('2 assertions pass');\n");
put('spec.md','# Objective\nExtend existing sum CLI to optionally multiply while preserving default sum. Include observable CLI verification, review/corrections and small functional checkpoints. No remote PR action.\n');
put('plan.md','# Canonical plan\nNo proposal accepted yet. Coordinator-owned.\n');
put('.factory/jobs/J101/brief-r1.md','# Planner brief\nPropose bounded vertical units for spec.md using existing src/math.mjs src/cli.mjs check.mjs. Read plan.md. Return findings-only proposal; no writes or delegation. State dependency unblock conditions and optional local stack bases. No fixed line quotas or mandatory TDD.\n');
put('.factory/jobs/J102/brief-r1.md','# Research brief\nDetermine current sum behavior, reusable helper, CLI consumer and tests relevant to spec.md. Read plan.md. Target code read-only; findings-only return. Identify facts/inferences/unknowns and exact line map. No writes, network, delegation or code changes.\n');
git('add','.');git('commit','-qm','Local profile behavior inputs');const checkpoint=git('rev-parse','HEAD');
const result={root,checkpoint,targetBase:checkpoint,plannerBrief:'.factory/jobs/J101/brief-r1.md',researchBrief:'.factory/jobs/J102/brief-r1.md',scope:'Disposable local fixture, not product process evidence.'};
writeFileSync('.audit/profiles-57-fixture.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
