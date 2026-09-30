import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {runHistoricalComposition,originalHistoricalPrompts,formatHistoricalProtocol} from '../src/historical-compose.js';

const ctx={window:{},crypto:crypto.webcrypto,TextEncoder,structuredClone,Uint8Array,ArrayBuffer};
vm.runInNewContext(fs.readFileSync('experiments/sound-concept-149/historical-engine.js','utf8'),ctx);
const engine=ctx.window.CompositionEngine;
const task='Komponiere ein Klavierstück von 32 Takten im Stil von Beethoven.';
function fakeTransport(texts,requests){
 return async(_url,options)=>{
   const body=JSON.parse(options.body);
   requests.push(body);
   const text=texts[requests.length-1];
   return {ok:true,json:async()=>({output:[{type:'message',content:[{type:'output_text',text}]}],
    usage:{input_tokens:100,output_tokens:200,total_tokens:300}})};
 };
}
function compactScore(){
 return {t:'Eigener Kompositionsversuch',b:116,m:[4,4],
  v:[['RH',0,0,[[1,0,1,60,101],[1,1,0.5,63,83],[32,3,1,72,96]]],
     ['LH',0,1,[[1,0,4,36,70],[32,0,4,36,75]]]]};
}
test('default integrated Sol procedure uses exactly two musical calls',async()=>{
 const concept='Frei erfundene klingende Vorstellung, ohne einzelne ausnotierte Noten.';
 const requests=[];
 const res=await runHistoricalComposition({engine,task,apiKey:'test',
  fetchImpl:fakeTransport([concept,JSON.stringify(compactScore())],requests)});
 assert.equal(requests.length,2);
 assert.deepEqual(requests.map(x=>x.model),['gpt-5.6-sol','gpt-5.6-sol']);
 const original=originalHistoricalPrompts(engine,task,concept);
 assert.equal(requests[0].input[0].content[0].text,original.musicalDraft);
 assert.equal(requests[1].input[0].content[0].text,original.midiTranslation);
 assert.equal(res.concept,concept);
 assert.equal(res.title,'Eigener Kompositionsversuch');
 assert.equal(res.bars,32);
 assert.equal(res.usage.total,600);
 assert.equal(String.fromCharCode(...res.historicalMidi.slice(0,4)),'MThd');
 assert.equal(res.historicalScore.tracks[0].notes[0][3],101);
 assert.equal(res.historicalCalls[1].response,JSON.stringify(compactScore()));
 assert.match(formatHistoricalProtocol(res),/TATSÄCHLICHE KI-ANFRAGE/);
});

test('selected OpenAI model is used for both two-stage requests and stored transparently',async()=>{
 const requests=[];
 const chosen='gpt-5.6-pro';
 const rec=await runHistoricalComposition({engine,task,provider:'openai',model:chosen,apiKey:'test',
  fetchImpl:fakeTransport(['Klangidee',JSON.stringify(compactScore())],requests)});
 assert.equal(requests.length,2);
 assert.deepEqual(requests.map(x=>x.model),[chosen,chosen]);
 assert.equal(rec.provider,'openai');
 assert.equal(rec.model,chosen);
 assert.match(formatHistoricalProtocol(rec),/openai \/ gpt-5\.6-pro/);
});


test('stage one snapshot is complete before optional pause and contains only first call',async()=>{
 const requests=[],concept='Eine merkwürdige Rückfrage statt Klangvorstellung';
 let snapshot=null;
 const rec=await runHistoricalComposition({engine,task,apiKey:'test',
  fetchImpl:fakeTransport([concept,JSON.stringify(compactScore())],requests),
  onStage1:partial=>{snapshot=structuredClone(partial);},
  onConcept:async()=>null});
 assert.ok(snapshot);
 assert.equal(snapshot.runStatus,'stage1_completed');
 assert.equal(snapshot.historicalCalls.length,1);
 assert.equal(snapshot.historicalCalls[0].stage,'sound_concept');
 assert.equal(snapshot.historicalCalls[0].response,concept);
 assert.equal(snapshot.provider,'openai');
 assert.equal(snapshot.model,'gpt-5.6-sol');
 assert.equal(snapshot.userInput,task);
 assert.equal(snapshot.usage.total,300);
 assert.equal(rec.runStatus,'completed');
 assert.equal(rec.historicalCalls.length,2);
});

test('optional manual pause sees EXACT completed stage-two prompt and records user edit transparently',async()=>{
 const requests=[],concept='Neue freie Vorstellung',changed='Meine bewusst geänderte zweite Anfrage';
 const rec=await runHistoricalComposition({engine,task,apiKey:'test',
  fetchImpl:fakeTransport([concept,JSON.stringify(compactScore())],requests),
  onConcept:async({concept:seen,proposal})=>{
   assert.equal(seen,concept);
   assert.equal(proposal,originalHistoricalPrompts(engine,task,concept).midiTranslation);
   assert.equal(requests.length,1);
   return changed;
  }});
 assert.equal(requests[1].input[0].content[0].text,changed);
 assert.equal(rec.historicalCalls[1].prompt,changed);
});
test('single missing closing bracket only recovers technical JSON and retains ORIGINAL answer',async()=>{
 const valid=JSON.stringify(compactScore());
 // Remove exactly one of the four final closing square brackets.
 const broken=valid.replace(/\]\]\]\]}$/,']]]}');
 const requests=[];
 const rec=await runHistoricalComposition({engine,task,apiKey:'test',
  createNotation:false,fetchImpl:fakeTransport(['Klangidee',broken],requests)});
 assert.equal(rec.historicalCalls[1].response,broken);
 assert.match(rec.technicalRecovery,/Klammer/);
 assert.equal(rec.historicalScore.tracks[0].notes[2][2],72);
});
test('on truly invalid partiture failed request retains both actual calls and sound concept',async()=>{
 const requests=[];
 await assert.rejects(async()=>{
  await runHistoricalComposition({engine,task,apiKey:'test',
   fetchImpl:fakeTransport(['Gute Klangidee','{"broken":,,,}'],requests)});
 },err=>{
  assert.equal(err.partialRecord?.historicalCalls?.length,2);
  assert.equal(err.partialRecord?.concept,'Gute Klangidee');
  assert.equal(err.partialRecord?.historicalCalls[1].response,'{"broken":,,,}');
  return true;
 });
});
test('main UI has both modes but original ComposeMe branch remains in place',()=>{
 const html=fs.readFileSync('index.html','utf8'),app=fs.readFileSync('src/app.js','utf8');
 assert.match(html,/option value="direct"/);
 assert.match(html,/option value="historical"/);
 assert.match(html,/historical-second-prompt/);
 assert.match(html,/historical-engine.js/);
 assert.match(app,/historicalControls\.isHistorical\(\)/);
 assert.match(app,/await compose\(\{provider:/);
});


test('technical score contract asks for generic instrument and voice separation',()=>{
 const p=originalHistoricalPrompts(engine,'Komponiere ein Duo.','Klangidee').midiTranslation;
 assert.match(p,/Instrument :: Stimme/);
 assert.match(p,/mehrere musikalisch eigenständige Stimmen/);
 assert.match(p,/Akkordtöne derselben Stimme bleiben gemeinsam/);
});
