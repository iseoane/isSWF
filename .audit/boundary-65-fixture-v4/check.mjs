import assert from 'node:assert/strict';
import { sum } from './sum.mjs';
assert.equal(sum(7, 3), 10);
assert.equal(sum(-2, 3), 1);
assert.equal(sum(0, 0), 0);
console.log('3 sum checks pass');
