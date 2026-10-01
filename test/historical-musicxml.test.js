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


test('explicit voices of one instrument are grouped into one MusicXML part',()=>{
 const score={title:'Mehrstimmig',bpm:72,timeSignature:[6,8],tracks:[
  {name:'Klavier :: Oberstimme',program:0,channel:0,notes:[[0,1,72,80,'C5'],[1,1,74,80,'D5']]},
  {name:'Klavier :: Bass',program:0,channel:0,notes:[[0,3,48,65,'C3'],[3,3,43,65,'G2']]}
 ]};
 const xml=historicalScoreToMusicXML(score);
 assert.equal((xml.match(/<part id="P1">/g)||[]).length,1);
 assert.doesNotMatch(xml,/<part id="P2">/);
 assert.match(xml,/<part-name>Klavier<\/part-name>/);
 assert.match(xml,/<staves>2<\/staves>/);
 assert.equal((xml.match(/<pitch>/g)||[]).length,4);
});

test('voice grouping is generic across ensemble instruments',()=>{
 const score={title:'Ensemble',bpm:88,timeSignature:[4,4],tracks:[
  {name:'Violine :: Hauptstimme',program:40,channel:0,notes:[[0,2,76,80,'E5']]},
  {name:'Violine :: Gegenstimme',program:40,channel:0,notes:[[0,2,67,72,'G4']]},
  {name:'Violoncello',program:42,channel:1,notes:[[0,4,43,70,'G2']]}
 ]};
 const xml=historicalScoreToMusicXML(score);
 assert.equal((xml.match(/<part id="P[12]">/g)||[]).length,2);
 assert.match(xml,/<part-name>Violine<\/part-name>/);
 assert.match(xml,/<part-name>Violoncello<\/part-name>/);
 assert.match(xml,/<voice>1<\/voice>/);
 assert.match(xml,/<voice>5<\/voice>/);
});

test('written enharmonic pitch spelling from the score is preserved',()=>{
 const score={title:'Schreibweise',bpm:60,timeSignature:[4,4],tracks:[
  {name:'Violine',program:40,channel:0,notes:[[0,1,71,80,'Cb5'],[1,1,72,80,'B#4']]}
 ]};
 const xml=historicalScoreToMusicXML(score);
 assert.match(xml,/<step>C<\/step><alter>-1<\/alter><octave>5<\/octave>/);
 assert.match(xml,/<step>B<\/step><alter>1<\/alter><octave>4<\/octave>/);
});


test('MusicXML display quantizes free MIDI durations but leaves them readable',()=>{
 const score={title:'Freies Timing',bpm:92,timeSignature:[4,4],tracks:[
  {name:'Klavier',program:0,channel:0,notes:[[0,1.8,50,65],[2,0.8,57,58],[4,3.5,62,62],[8,3.8,65,61]]}
 ]};
 const xml=historicalScoreToMusicXML(score);
 assert.doesNotMatch(xml,/<duration>14</duration>/); // raw 1.8 * 8 would have produced 14 ticks
 assert.match(xml,/<type>quarter</type><dot\/><tie type="start"\/>/);
 assert.match(xml,/<type>16th</type><tie type="stop"\/>/);
 assert.match(xml,/<type>eighth</type><dot\/>/);
});
