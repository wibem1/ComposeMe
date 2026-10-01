import test from 'node:test';
import assert from 'node:assert/strict';
import {quantizeDisplaySpan} from '../src/display-quantization.js';

test('display quantization aligns ordinary timing to a fine sixteenth-note grid',()=>{
 assert.deepEqual(quantizeDisplaySpan(0,1.8),{start:0,duration:1.75});
 assert.deepEqual(quantizeDisplaySpan(0.5,1.4),{start:0.5,duration:1.5});
 assert.deepEqual(quantizeDisplaySpan(0,3.8),{start:0,duration:3.75});
 assert.deepEqual(quantizeDisplaySpan(0,3.2),{start:0,duration:3.25});
 assert.deepEqual(quantizeDisplaySpan(2.1,0.8),{start:2,duration:1});
});

test('sixteenth-note values are preserved',()=>{
 assert.deepEqual(quantizeDisplaySpan(0.25,0.25),{start:0.25,duration:0.25});
 assert.deepEqual(quantizeDisplaySpan(0.75,0.75),{start:0.75,duration:0.75});
});
