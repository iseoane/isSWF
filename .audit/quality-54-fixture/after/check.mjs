import assert from 'node:assert/strict';
import { sum, twiceSum } from './sum.mjs';
for (const [a,b] of [[7,3],[0,0],[-4,2]]) { assert.equal(sum(a,b),a+b); assert.equal(twiceSum(a,b),2*(a+b)); }
console.log('PASS 6 observable cases');
