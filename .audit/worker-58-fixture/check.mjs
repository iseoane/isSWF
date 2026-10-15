import assert from 'node:assert/strict';
import {sum} from './sum.mjs';
assert.equal(sum(7,3),10);
assert.equal(sum(0,0),0);
assert.equal(sum(-2,3),1);
console.log('3 cases pass');
