import {spawn} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const child=spawn('/runtime/node',['-e',"const fs=require('fs');const timer=setInterval(()=>fs.writeFileSync('/work/heartbeat.txt',String(Date.now())),25);setTimeout(()=>{clearInterval(timer);},15000);"],{detached:true,stdio:'ignore'});
child.unref();
writeFileSync('/work/tool-ready.json',JSON.stringify({pid:process.pid,child:child.pid}));
setTimeout(()=>{},15000);
