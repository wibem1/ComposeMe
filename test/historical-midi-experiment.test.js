import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {historicalDraftPrompt,historicalTranslationPrompt,directMidiPrompt,extractScore,buildMidi,runHistoricalMidi,TECHNICAL_CONTRACT} from '../src/historical-midi-experiment.js';
const task='Komponiere ein Klavierstück.';
test('historic first prompt has the exact characteristic wording from v0.4.24',()=>{
 const x=historicalDraftPrompt(task);
 assert.match(x,/Komponiere das verlangte Stück musikalisch frei und eigenständig/);
 assert.match(x,/Denke noch NICHT an MIDI-Codierung, QN-Werte, CS-Zeilen/);
 assert.ok(x.endsWith('AUFTRAG:\n'+task));
 assert.ok(!x.includes(TECHNICAL_CONTRACT));
});
test('historical translator gets original task, full draft, unchanged technical contract',()=>{
 const draft='Titel: Neues Stück\nHörvorstellung: Gesangliche Melodie.';
 const x=historicalTranslationPrompt(task,draft);
 assert.match(x,/Komponiere NICHT neu, vereinfache NICHT, regularisiere NICHT/);
 assert.ok(x.includes('URSPRÜNGLICHER AUFTRAG:\n'+task));
 assert.ok(x.includes('FERTIGER MUSIKALISCHER ENTWURF:\n'+draft));
 assert.ok(x.endsWith(TECHNICAL_CONTRACT));
});
test('direct mode has line-separated task and identical technical format',()=>{
 const x=directMidiPrompt(task);
 assert.ok(x.includes('\n\nAUFTRAG:\n'+task+'\n\n'));
 assert.ok(x.endsWith(TECHNICAL_CONTRACT));
});
test('two-stage vs direct uses the same provider/model and no secret in diagnostics',async()=>{
 const sent=[];
 const request=async args=>{sent.push(args);return {text:sent.length===1?'Titel: Freie Vorstellung':'{"title":"Neues Stück","bpm":66,"timeSignature":[6,8],"tracks":[{"name":"Klavier","notes":[[0,1,60,75]]}]}',usage:{total:20},estimatedCost:.01};};
 const result=await runHistoricalMidi({mode:'historical',task,provider:'openai',model:'gpt-5.6-sol',apiKey:'secret',request});
 assert.equal(sent.length,2);assert.equal(result.calls.length,2);assert.equal(result.calls[0].response,'Titel: Freie Vorstellung');
 assert.ok(sent[1].prompt.includes('Titel: Freie Vorstellung'));assert.equal(result.score.tracks.length,1);
 assert.equal(JSON.stringify(result).includes('secret'),false);
 const direct=await runHistoricalMidi({mode:'direct',task,provider:'openai',model:'gpt-5.6-sol',apiKey:'secret',request:async args=>{assert.equal(args.model,'gpt-5.6-sol');return {text:result.rawScore};}});
 assert.equal(direct.calls.length,1);assert.equal(direct.score.title,'Neues Stück');
});
test('MIDI export with score yields valid header and independent audio tracks',()=>{
 const s=extractScore('{\"title\":\"X\",\"bpm\":66,\"timeSignature\":[6,8],\"tracks\":[{\"name\":\"RH\",\"notes\":[[0,1,60,90]]},{\"name\":\"LH\",\"notes\":[[0,2,48,70]]}]}');
 const midi=buildMidi(s);
 assert.equal(new TextDecoder().decode(midi.slice(0,4)),'MThd');
 assert.equal(midi[10]*256+midi[11],3);
});
test('failed second stage retains historical draft and does not retry',async()=>{
 let n=0;
 await assert.rejects(runHistoricalMidi({mode:'historical',task,provider:'openai',model:'gpt-5.6-sol',apiKey:'k',request:async()=>{n++;if(n===2)throw new Error('HTTP 503');return{text:'Titel: Erhalten'};}}),e=>e.partialResult.calls.length===1&&e.partialResult.draft==='Titel: Erhalten');
 assert.equal(n,2);
});
test('standalone browser script passes syntax check and page labels both modes',()=>{
 const x=spawnSync(process.execPath,['--check','experiments/historical-midi/experiment.js'],{encoding:'utf8'});
 assert.equal(x.status,0,x.stderr);
 const page=readFileSync('experiments/historical-midi/index.html','utf8');
 assert.match(page,/Historisch: freier Entwurf/);assert.match(page,/Direkt: ohne vorherigen Entwurf/);
});
