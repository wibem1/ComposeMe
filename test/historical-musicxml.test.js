import test from 'node:test';
import assert from 'node:assert/strict';
import {historicalScoreToPianoMusicXML} from '../src/historical-musicxml.js';

test('historical JSON becomes two-staff piano MusicXML without AI',()=>{
 const score={title:'Test',bpm:76,timeSignature:[4,4],tracks:[{name:'Klavier',program:0,channel:0,notes:[
  [0,1,48,70],[0,1,72,80],[1,1,50,72],[1,1,74,82],[4,2,43,60],[4,2,67,75]
 ]}]};
 const xml=historicalScoreToPianoMusicXML(score);
 assert.match(xml,/<score-partwise version="4.0">/);
 assert.match(xml,/<staves>2<\/staves>/);
 assert.match(xml,/<clef number="1"><sign>G<\/sign><line>2<\/line><\/clef>/);
 assert.match(xml,/<clef number="2"><sign>F<\/sign><line>4<\/line><\/clef>/);
 assert.match(xml,/<staff>1<\/staff>/);
 assert.match(xml,/<staff>2<\/staff>/);
 assert.match(xml,/<per-minute>76<\/per-minute>/);
 const pitched=(xml.match(/<pitch>/g)||[]).length;
 assert.equal(pitched,6);
});

test('overlapping notes are emitted as separate voices instead of being discarded',()=>{
 const score={title:'Overlap',bpm:90,timeSignature:[4,4],tracks:[{name:'Klavier',notes:[
  [0,3,48,70],[.5,1,55,75],[0,1,72,80],[.5,1,76,85]
 ]}]};
 const xml=historicalScoreToPianoMusicXML(score);
 assert.equal((xml.match(/<pitch>/g)||[]).length,4);
 assert.match(xml,/<voice>1<\/voice>/);
 assert.match(xml,/<voice>2<\/voice>/);
 assert.match(xml,/<voice>5<\/voice>/);
 assert.match(xml,/<voice>6<\/voice>/);
});
