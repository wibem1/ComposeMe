import test from 'node:test';
import assert from 'node:assert/strict';
import {HISTORICAL_DRAFT_INSTRUCTION,draftPrompt,notationPrompt,runSoundFirst} from '../src/sound-first-experiment.js';
test('historical musical request is preserved word-for-word and kept separate from notation',()=>{
 const p=draftPrompt('Komponiere ein eigenständiges Klavierstück.');
 assert.ok(p.startsWith(HISTORICAL_DRAFT_INSTRUCTION));
 assert.ok(p.endsWith('AUFTRAG:\nKomponiere ein eigenständiges Klavierstück.'));
 assert.doesNotMatch(p,/ABC-Partitur/);
 const q=notationPrompt('Komponiere ein eigenständiges Klavierstück.','Titel: Frei\nMelodie gesanglich.');
 assert.match(q,/MUSIKALISCHER ENTWURF:\nTitel: Frei/);
 assert.match(q,/ABC-Partitur/);
 assert.ok(q.indexOf('URSPRÜNGLICHER KOMPOSITIONSAUFTRAG')<q.indexOf('MUSIKALISCHER ENTWURF'));
});
test('two requests, same model, second receives actual result not fabricated plan',async()=>{
 const prompts=[],events=[];
 const fake=async({provider,model,prompt,apiKey})=>{
  prompts.push({provider,model,prompt,apiKey});
  return {text:prompts.length===1?'Titel: Improvisation\nRuhige Anfangsmelodie, kontrastierender Mittelteil.':'X:1\nT:Neu\nM:3/4\nL:1/4\nK:C\nC D E |',usage:{total:12},estimatedCost:.01};
 };
 const r=await runSoundFirst({task:'Ein eigenständiges Klavierstück.',provider:'openai',model:'gpt-5.6-sol',apiKey:'secret',request:fake,onStage:x=>events.push(x)});
 assert.equal(prompts.length,2);assert.equal(r.calls.length,2);
 assert.equal(prompts[0].model,prompts[1].model);
 assert.match(prompts[1].prompt,/Titel: Improvisation/);
 assert.match(prompts[1].prompt,/Ein eigenständiges Klavierstück/);
 assert.equal(r.notation,'X:1\nT:Neu\nM:3/4\nL:1/4\nK:C\nC D E |');
 assert.equal(events.filter(e=>e.status==='completed').length,2);
 assert.equal(JSON.stringify(r).includes('secret'),false);
});
test('second stage error keeps first call in downloadable diagnosis; no retry',async()=>{
 let n=0;await assert.rejects(runSoundFirst({task:'Klavier',provider:'openai',model:'gpt-5.6-sol',apiKey:'k',request:async()=>{
 n++;if(n===2)throw new Error('HTTP 503');return {text:'Titel: Versuch',usage:{total:2},estimatedCost:.001};
 }}),e=>e.message==='HTTP 503'&&e.experiment.calls.length===1&&e.experiment.calls[0].response==='Titel: Versuch');
 assert.equal(n,2);
});
test('empty task rejected before network request',async()=>{
 let n=0;await assert.rejects(runSoundFirst({task:' ',provider:'openai',model:'gpt-5.6-sol',apiKey:'k',request:async()=>{n++;}}),/Kompositionsauftrag fehlt/);assert.equal(n,0);
});
