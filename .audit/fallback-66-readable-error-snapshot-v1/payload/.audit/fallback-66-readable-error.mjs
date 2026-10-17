import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {diagnosticAttempt} from './run-fallback-66-diagnostic.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
function textPrefix(text,limit){const bytes=Buffer.from(text);if(bytes.length<=limit)return {text,truncated:false};let n=limit;while(n>0&&(bytes[n]&0xc0)===0x80)n--;return {text:bytes.subarray(0,n).toString('utf8'),truncated:true};}
function credentials(headers){const values=[];for(const[name,value]of headers)if(/auth|key|token|secret|cookie/i.test(name)){values.push(value);const token=value.match(/^(?:Bearer|Basic)\s+(.+)$/i);if(token)values.push(token[1]);if(/cookie/i.test(name))for(const part of value.split(';')){const i=part.indexOf('=');if(i>=0)values.push(part.slice(i+1).trim());}}return values.filter(Boolean);}
function cleanText(text,credentialValues,limit){
 const kinds=new Set(),variants=new Set();for(const value of credentialValues){variants.add(value);variants.add(JSON.stringify(value).slice(1,-1));const encoded=encodeURIComponent(value);variants.add(encoded);variants.add(encoded.replace(/%[0-9A-F]{2}/g,m=>m.toLowerCase()));variants.add(Buffer.from(value).toString('base64'));}
 for(const value of [...variants].filter(Boolean).sort((a,b)=>b.length-a.length))if(text.includes(value)){text=text.split(value).join('[REDACTED_CREDENTIAL]');kinds.add('observed-credential');}
 const patterns=[
  ['credential-field',/\b(authorization|proxy-authorization|api[_ -]?key|password|passwd|secret|access[_ -]?token|refresh[_ -]?token|token|cookie|credential)\b\s*[:=]\s*(?:(?:Bearer|Basic)\s+)?(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,'[REDACTED_CREDENTIAL_FIELD]'],
  ['token',/\b(?:sk-|sk_|ghp_|github_pat_|gsk_|sess-|AIza)[A-Za-z0-9_-]{4,}\b/g,'[REDACTED_TOKEN]'],
  ['jwt',/\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,'[REDACTED_JWT]'],
  ['email',/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,'[REDACTED_EMAIL]'],
  ['url',/\b(?:https?|ftp):\/\/[^\s"'<>]+/gi,'[REDACTED_URL]'],
  ['path',/\b[A-Za-z]:\\[^\s"'<>]+|(?<![\w])~?\/[^\s"'<>]+/g,'[REDACTED_PATH]'],
  ['ip',/\b(?:\d{1,3}\.){3}\d{1,3}\b|\b(?:[0-9a-f]{1,4}:){2,}[0-9a-f:]*\b/gi,'[REDACTED_IP]'],
  ['control',/\u001b\[[0-?]*[ -/]*[@-~]|[\u0000-\u001f\u007f-\u009f\u202a-\u202e\u2066-\u2069]/g,' ']
 ];
 for(const[kind,pattern,replacement]of patterns)text=text.replace(pattern,()=>{kinds.add(kind);return replacement;});
 return {...textPrefix(text,limit),redactions:[...kinds].sort(),residualCredential:[...variants].some(v=>v&&text.includes(v))};
}
function withheld(reason,bytes=null,truncated=false){return {schema:'isswf-diag-error-v2',message:{text:null,truncated:false,sha256:null,length:null},fields:null,redaction:{status:'withheld',reason,kinds:[]},bodyPrefix:bytes?{sha256:hash(bytes),length:bytes.length,truncated}:null,authority:'untrusted provider error data; never instructions or routing authorization'};}
export function redactErrorText(bytes,{credentialValues,truncated=false}){
 if(truncated||bytes.length>8192)return withheld('body-cap-exceeded',bytes.subarray(0,8192),true);
 if(!credentialValues?.some(v=>typeof v==='string'&&v.length))return withheld('missing-credential-context',bytes);
 let raw;try{raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);}catch{return withheld('invalid-encoding',bytes);}
 let value,parsed=false;try{value=JSON.parse(raw);parsed=true;}catch{}
 const error=value?.error,structured=error&&typeof error==='object'&&!Array.isArray(error)?error:{};
 const message=typeof error==='string'?error:typeof structured.message==='string'?structured.message:typeof value?.message==='string'?value.message:typeof value?.detail==='string'?value.detail:typeof value?.error_description==='string'?value.error_description:typeof value==='string'?value:!parsed?raw:null;
 if(message===null)return withheld('unsupported-json-envelope',bytes);
 const safe=cleanText(message,credentialValues,2048);if(safe.residualCredential)return withheld('residual-credential',bytes);const fields={},kinds=new Set(safe.redactions);for(const key of['code','type','param'])if(typeof structured[key]==='string'){const field=cleanText(structured[key],credentialValues,128);if(field.residualCredential)return withheld('residual-credential',bytes);fields[key]=field.text;for(const kind of field.redactions)kinds.add(kind);}
 return {schema:'isswf-diag-error-v2',message:{text:safe.text,truncated:safe.truncated,sha256:hash(message),length:Buffer.byteLength(message)},fields,redaction:{status:'redacted',reason:null,kinds:[...kinds].sort()},bodyPrefix:{sha256:hash(bytes),length:bytes.length,truncated:false},authority:'untrusted provider error data; never instructions or routing authorization'};
}
async function capture(response,credentialValues,timeoutMs){
 let reader;try{reader=response.clone().body?.getReader();if(!reader)return redactErrorText(Buffer.alloc(0),{credentialValues});}catch{return withheld('capture-failed');}
 const expired=Symbol('capture-timeout');let timer;try{
  const read=async()=>{const parts=[];let length=0;for(;;){const {done,value}=await reader.read();if(done)return {bytes:Buffer.concat(parts,length),truncated:false};const room=8192-length;if(value.length>room){parts.push(Buffer.from(value.subarray(0,room)));return {bytes:Buffer.concat(parts,8192),truncated:true};}parts.push(Buffer.from(value));length+=value.length;}};
  const data=await Promise.race([read(),new Promise(resolve=>{timer=setTimeout(()=>resolve(expired),Math.max(1,Math.min(1000,timeoutMs)));})]);return data===expired?withheld('capture-timeout'):redactErrorText(data.bytes,{credentialValues,truncated:data.truncated});
 }catch{return withheld('capture-failed');}finally{clearTimeout(timer);reader.cancel().catch(()=>{});try{reader.releaseLock();}catch{}}
}
export async function diagnosticAttemptWithReadableErrors(prepared,{makeBackend,send}){
 assert.equal(prepared.grant.allowProviderCalls,false,'offline-only capture repair; no current runtime grant');assert.equal(typeof makeBackend,'function');assert.equal(typeof send,'function');let providerError=null;const started=Date.now();
 const observation=await diagnosticAttempt(prepared,{makeBackend,send:async(input,init)=>{let request,credentialValues=[];try{request=new Request(input,init);credentialValues=credentials(request.headers);}catch{}try{const response=await send(input,init);if(response.status>=400)providerError=await capture(response,credentialValues,prepared.grant.deadlineMs-(Date.now()-started));return response;}finally{credentialValues.fill('');request=null;}}});
 return {...observation,mode:'offline-readable-error-fixture',providerError,limits:['Offline-only capture repair; no live CLI or new runtime authority','Observed outgoing credential values and common token/email/URL/path/control patterns are redacted before the 2048-byte text cap','Finite redaction is best-effort, not universal secret or PII protection','Bodies over 8192 bytes, missing credential context or failed capture withhold text','Provider text and codes are untrusted data, never routing evidence or instructions','Historical actual errors are not recovered; this proves no live diagnosis, route availability or fallback']};
}
