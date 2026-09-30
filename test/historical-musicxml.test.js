import test from 'node:test';
import assert from 'node:assert/strict';
import {historicalScoreToMusicXML} from '../src/historical-musicxml.js';

test('piano becomes a two-staff MusicXML part',()=>{
 const score={title:'Test',bpm:76,timeSignature:[4,4],tracks:[{name:'Klavier',program:0,channel:0,notes:[
  [0,1,48,70],[0,1,72,80],[1,1,50,72],[1,1,74,82]
 ]}]};
 const xml=historicalScoreToMusicXML(score);
 assert.match(xml,/<part-name>Klavier<\/part-name>/);
 assert.match(xml,/<staves>2<\/staves>/);
 assert.match(xml,/<clef number="1"><sign>G<\/sign><line>2<\/line><\/clef>/);
 assert.match(xml,/<clef number="2"><sign>F<\/sign><line>4<\/line><\/clef>/);
 assert.equal((xml.match(/<pitch>/g)||[]).length,4);
});

test('ensemble tracks remain separate MusicXML parts with suitable clefs',()=>{
 const score={title:'Duo',bpm:90,timeSignature:[3,4],tracks:[
  {name:'Violine',program:40,channel:0,notes:[[0,1,76,80],[1,1,79,82]]},
  {name:'Violoncello',program:42,channel:1,notes:[[0,2,43,70],[2,1,48,72]]}
 ]};
 const xml=historicalScoreToMusicXML(score);
 assert.match(xml,/<part-name>Violine<\/part-name>/);
 assert.match(xml,/<part-name>Violoncello<\/part-name>/);
 assert.match(xml,/<clef><sign>G<\/sign><line>2<\/line><\/clef>/);
 assert.match(xml,/<clef><sign>F<\/sign><line>4<\/line><\/clef>/);
 assert.equal((xml.match(/<part id="P[12]">/g)||[]).length,2);
 assert.equal((xml.match(/<pitch>/g)||[]).length,4);
});

test('overlapping notes are emitted as separate voices instead of being discarded',()=>{
 const score={title:'Quartett',bpm:90,timeSignature:[4,4],tracks:[{name:'Violine',notes:[
  [0,3,72,70],[.5,1,76,75]
 ]}]};
 const xml=historicalScoreToMusicXML(score);
 assert.equal((xml.match(/<pitch>/g)||[]).length,2);
 assert.match(xml,/<voice>1<\/voice>/);
 assert.match(xml,/<voice>2<\/voice>/);
});
