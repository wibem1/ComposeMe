import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
const historical=fs.readFileSync('experiments/sound-concept-149/historical-engine.js','utf8');
const context={window:{},crypto:crypto.webcrypto,TextEncoder};
vm.runInNewContext(historical,context);
const e=context.window.CompositionEngine;
test('historical engine source keeps unchanged original Git blob SHA',()=>{
 const pre='blob '+Buffer.byteLength(historical,'utf8')+String.fromCharCode(0);
 const sha=crypto.createHash('sha1').update(pre).update(historical).digest('hex');
 assert.equal(sha,'f40b809e1cfe8b2bd18db348a35859be3932e0fa');
});
test('sound concept prompt preserves historical wording and never instructs notation',()=>{
 const p=e.createPrompts({visibleTask:'Komponiere ein Klavierstück von 32 Takten im Stil von Beethoven.'}).musicalDraft;
 assert.match(p,/Stelle dir das verlangte Musikstück zunächst ausschließlich als klingenden musikalischen Verlauf vor/);
 assert.match(p,/WICHTIG: Noch keine Notation und keine ausnotierten Töne/);
 assert.ok(p.endsWith('Komponiere ein Klavierstück von 32 Takten im Stil von Beethoven.'));
});
test('second stage retains compact score contract and unchanged historical musical prompt',()=>{
 const p=e.createPrompts({visibleTask:'32 Takte'},'Klangidee').midiTranslation;
 assert.match(p,/Komponiere jetzt aus der folgenden klingenden Vorstellung das vollständige verlangte Musikstück/);
 assert.match(p,/KLINGENDE VORSTELLUNG/);
 assert.match(p,/"t":"Titel"/);
});
test('historical parser and MIDI builder accept compact 32 bar scores',()=>{
 const tracks=[['Klavier RH',0,0,[[1,0,1,60,80],[32,0,4,60,65]]],['Klavier LH',0,1,[[1,0,4,48,60],[32,0,4,48,55]]]];
 const s=e.findScore({t:'Test',b:112,m:[4,4],v:tracks});
 assert.equal(s.tracks.length,2);
 assert.equal(s.tracks[0].notes[1][0],124);
 assert.equal(e.buildMidi(s)[0],77);
});
