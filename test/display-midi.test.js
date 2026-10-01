import test from 'node:test';
import assert from 'node:assert/strict';
import {displayQuantizedScore,buildDisplayMidi,splitNotationVoices} from '../src/display-midi.js';

test('display MIDI quantizes only a cloned score',()=>{
 const score={title:'Test',tracks:[{name:'Klavier',notes:[[0,1.8,60,80],[2.1,.8,64,70]],cc:[[0,64,127],[3.8,64,0]]}]};
 const q=displayQuantizedScore(score);
 assert.notEqual(q,score);
 assert.notEqual(q.tracks[0],score.tracks[0]);
 assert.deepEqual(q.tracks[0].notes,[[0,1.75,60,80],[2,1,64,70]]);
 assert.deepEqual(q.tracks[0].cc,score.tracks[0].cc);
 assert.deepEqual(score.tracks[0].notes,[[0,1.8,60,80],[2.1,.8,64,70]]);
});

test('overlapping piano lines are split into independent notation voices',()=>{
 const track={name:'Klavier',program:0,channel:1,notes:[
  [0,1.8,38,62],
  [0.5,1.4,57,54],
  [0.5,1.4,65,58],
  [2,1.8,45,56],
  [2.5,1.4,60,52],
  [2.5,1.4,65,57]
 ]};
 const voices=splitNotationVoices(track);
 assert.equal(voices.length,2);
 assert.equal(voices[0].name,'Klavier :: rechte Hand');
 assert.equal(voices[1].name,'Klavier :: linke Hand');
 assert.deepEqual(voices[0].notes,[[0.5,1.5,57,54],[0.5,1.5,65,58],[2.5,1.5,60,52],[2.5,1.5,65,57]]);
 assert.deepEqual(voices[1].notes,[[0,1.75,38,62],[2,1.75,45,56]]);
});

test('simultaneous chord tones remain in one notation voice',()=>{
 const track={name:'Klavier',notes:[[0,1.4,57,54],[0,1.4,65,58],[2,1.4,60,52],[2,1.4,67,57]]};
 const voices=splitNotationVoices(track);
 assert.equal(voices.length,1);
 assert.equal(voices[0].notes.length,4);
});

test('display MIDI is built from quantized polyphonic copy',()=>{
 const score={tracks:[{name:'Klavier',notes:[[0,3.8,60,80],[1,1.4,64,70],[1,1.4,67,70]]}]};
 let received;
 const bytes=buildDisplayMidi(score,s=>{received=s;return Uint8Array.from([77,84,104,100]);});
 assert.equal(received.tracks.length,2);
 assert.equal(received.tracks[0].notes[0][1],3.75);
 assert.deepEqual([...bytes],[77,84,104,100]);
});
