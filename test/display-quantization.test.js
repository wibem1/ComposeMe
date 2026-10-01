import test from 'node:test';
import assert from 'node:assert/strict';
import {quantizeDisplaySpan,notationPieces} from '../src/display-quantization.js';

test('display quantization snaps free MIDI timing without changing source values',()=>{
 const a=quantizeDisplaySpan(0,1.8);
 const b=quantizeDisplaySpan(0,0.8);
 const c=quantizeDisplaySpan(0,3.5);
 const d=quantizeDisplaySpan(0,3.8);
 assert.deepEqual(a,{start:0,duration:1.75});
 assert.deepEqual(b,{start:0,duration:0.75});
 assert.deepEqual(c,{start:0,duration:3.5});
 assert.deepEqual(d,{start:0,duration:3.75});
});

test('nonstandard display durations split into readable tied note values',()=>{
 assert.deepEqual(notationPieces(1.75),[1.5,0.25]);
 assert.deepEqual(notationPieces(3.5),[3,0.5]);
 assert.deepEqual(notationPieces(3.75),[3,0.75]);
});
