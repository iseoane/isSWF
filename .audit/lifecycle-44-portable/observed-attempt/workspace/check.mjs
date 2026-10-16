import assert from 'node:assert/strict';
import {sum,product} from './src/math.mjs';
assert.equal(sum([2,3,5]),10);
assert.equal(sum([]),0);
assert.equal(product([3,7]),21);
assert.equal(product([-2,3]),-6);
assert.equal(product([]),1);
console.log('PASS two sum and three product assertions');
