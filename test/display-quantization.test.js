import test from 'node:test';
import assert from 'node:assert/strict';
import {quantizeDisplaySpan} from '../src/display-quantization.js';

test('display quantization keeps onset grid but maps performance lengths to readable notation values',()=>{
 assert.deepEqual(quantizeDisplaySpan(0,1.8),{start:0,duration:2});
 assert.deepEqual(quantizeDisplaySpan(0.5,1.4),{start:0.5,duration:1.5});
 assert.deepEqual(quantizeDisplaySpan(0,3.8),{start:0,duration:4});
 assert.deepEqual(quantizeDisplaySpan(0,3.2),{start:0,duration:3});
 assert.deepEqual(quantizeDisplaySpan(2.1,0.8),{start:2,duration:0.75});
});
