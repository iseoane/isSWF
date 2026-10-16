import assert from 'node:assert/strict';import {writeFileSync} from 'node:fs';import {counter} from './src/counter.mjs';
assert.throws(()=>writeFileSync('/work/review-write-canary','forbidden'),{code:'EROFS'});
if(counter()===4)process.stdout.write('x'.repeat(20000));
else if(counter()===5)await new Promise(resolve=>setTimeout(resolve,15000));
else {assert.equal(counter(),1);console.log('READONLY_REVIEW_CHECK');}
