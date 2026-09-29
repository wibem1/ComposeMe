import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {historicalScoreToAbc,auditHistoricalAbc} from '../src/historical-abc.js';
import {parseMidi} from '../src/historical-player.js';

const ctx={window:{},crypto:crypto.webcrypto,TextEncoder,structuredClone,Uint8Array,ArrayBuffer};
vm.runInNewContext(fs.readFileSync('experiments/sound-concept-149/historical-engine.js','utf8'),ctx);
const engine=ctx.window.CompositionEngine;
function sampleCompact(){
 return {t:'Unter der stillen Oberfläche',b:64,m:[4,4],v:[
  ['Violine',40,0,[
   [3,1,2,62,31,'D4'],[3,3,.5,63,34,'Eb4'],[8,2.75,.25,76,46,'E5'],
   [16,1.5,.25,87,89,'Eb6'],[32,1.5,2.5,76,42,'E5']]],
  ['Klavier',0,1,[
   [1,0,1.5,38,35,'D2'],[1,0,1.5,45,31,'A2'],[1,0,1.5,51,29,'Eb3'],
   [9,0,.5,57,42,'A3'],[9,.5,.5,62,44,'D4'],[19,0,.5,29,96,'F1'],
   [25,0,1,72,39,'C5'],[25,0,1,77,36,'F5'],[32,2,2,38,25,'D2']]]
 ]};
}
test('JSON score projects to ABC for notation without changing source score',()=>{
 const source=sampleCompact(),before=JSON.stringify(source),score=engine.findScore(source),abc=historicalScoreToAbc(score);
 assert.equal(JSON.stringify(source),before);
 assert.match(abc,/^T:Unter der stillen Oberfläche$/m);
 assert.match(abc,/^Q:1\/4=64$/m);
 assert.match(abc,/V:Violine/);
 assert.match(abc,/clef=bass/);
 assert.match(abc,/clef=treble/);
 assert.match(abc,/_E/); // flat spelling survives
 assert.match(abc,/=e/); // explicit natural avoids accidental carry
 const audit=auditHistoricalAbc(score,abc);
 assert.equal(audit.sourceNotes,14);
 assert.equal(audit.ok,true);
 assert.equal(audit.bars,32);
});
test('original MIDI parser reproduces every note event from canonical MIDI bytes',()=>{
 const score=engine.findScore(sampleCompact()),midi=engine.buildMidi(score),parsed=parseMidi(midi);
 const expected=score.tracks.reduce((n,t)=>n+t.notes.length,0);
 assert.equal(parsed.notes.length,expected);
 assert.equal(parsed.ppq,480);
 assert.equal(parsed.notes.find(n=>n.channel===0)?.program,40);
 assert.equal(parsed.notes.find(n=>n.channel===1)?.program,0);
 assert.ok(parsed.duration>=120);
});
test('historical UI explicitly separates ABC notation from original MIDI playback',()=>{
 const ui=fs.readFileSync('src/historical-ui.js','utf8');
 assert.match(ui,/historicalScoreToAbc/);
 assert.match(ui,/createMidiPlayer/);
 assert.match(ui,/data\.source='original-midi'/);
 assert.doesNotMatch(ui,/SynthController/);
 assert.match(ui,/Wiedergabequelle bleibt ausschließlich das Original-MIDI/);
});

test('notes crossing a barline are tied and do not create overlapping rests',()=>{
 const compact={t:'Tie',b:60,m:[4,4],v:[['Violine',40,0,[[1,3,2,69,80,'A4'],[2,2,1,71,80,'B4']]]]};
 const abc=historicalScoreToAbc(engine.findScore(compact));
 assert.match(abc,/=A4- \|/);
 assert.match(abc,/=A4 z4 =B4 z4 \|/);
});
