import test from 'node:test';
import assert from 'node:assert/strict';
import {displayQuantizedScore,buildDisplayMidi} from '../src/display-midi.js';

test('display MIDI quantizes only a cloned score',()=>{
 const score={title:'Test',tracks:[{name:'Klavier',notes:[[0,1.8,60,80],[2.1,.8,64,70]],cc:[[0,64,127],[3.8,64,0]]}]};
 const q=displayQuantizedScore(score);
 assert.notEqual(q,score);
 assert.notEqual(q.tracks[0],score.tracks[0]);
 assert.deepEqual(q.tracks[0].notes,[[0,2,60,80],[2,0.75,64,70]]);
 assert.deepEqual(q.tracks[0].cc,score.tracks[0].cc);
 assert.deepEqual(score.tracks[0].notes,[[0,1.8,60,80],[2.1,.8,64,70]]);
});

test('display MIDI is built from quantized copy',()=>{
 const score={tracks:[{notes:[[0,3.8,60,80]]}]};
 let received;
 const bytes=buildDisplayMidi(score,s=>{received=s;return Uint8Array.from([77,84,104,100]);});
 assert.equal(received.tracks[0].notes[0][1],4);
 assert.deepEqual([...bytes],[77,84,104,100]);
});
