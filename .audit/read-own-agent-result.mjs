#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
const [logName, expectedPromptPrefix, expectedProvider, expectedModel, agentId, afterSnapshot] = process.argv.slice(2);
if (!logName || basename(logName)!==logName || !logName.endsWith('.jsonl') || !expectedPromptPrefix || !expectedProvider || !expectedModel || !agentId) throw Error('usage: read-own-agent-result.mjs LOG_BASENAME EXPECTED_INITIAL_PROMPT_PREFIX EXPECTED_PROVIDER EXPECTED_MODEL AGENT_ID [AFTER_SNAPSHOT_PATH]');
const directory='/home/iseoane/.pi/agent/pstack/01a134d1-4f4f-76c1-a693-aff6225fb9a9/agents';
const rows=(await readFile(join(directory,logName),'utf8')).trim().split('\n').map(JSON.parse);
const initial=rows.find(row=>row.type==='message'&&row.message.role==='user');
const initialText=initial?.message.content?.filter(part=>part.type==='text').map(part=>part.text).join('\n');
if (!initialText?.startsWith(expectedPromptPrefix)) throw Error('initial prompt does not match expected actor task; never infer ownership from log order');
const last=rows.findLast(row=>row.type==='message'), message=last?.message;
if(message?.role!=='assistant'||message.stopReason!=='stop') throw Error('actor has no completed final result');
if(message.provider!==expectedProvider||message.model!==expectedModel) throw Error('actual result route differs from expected route');
if (afterSnapshot && Date.parse(last.timestamp)<(await stat(afterSnapshot)).mtimeMs) throw Error('final result predates the frozen candidate');
console.log(JSON.stringify({agent:agentId,sourceLog:logName,initialPromptMatched:true,...(afterSnapshot?{afterSnapshot}:{}),report:message.content.filter(part=>part.type==='text').map(part=>part.text).join('\n'),metadata:{provider:message.provider,model:message.model,effort:message.thinkingLevel,stopReason:message.stopReason}},null,2));
