import test from 'node:test';
import assert from 'node:assert/strict';
import {classicDraftPrompt,classicTranslationPrompt,classicIdeaPrompt,CLASSIC_TECHNICAL_CONTRACT} from '../src/classic-prompts.js';
import {runClassicComposition} from '../src/classic-compose.js';
const engine={makeRequest:(_p,_m,prompt)=>({url:'/mock',headers:{},body:{input:prompt}}),actualRequest:x=>x,
 extractText:(_p,x)=>x.output_text,extractJson:JSON.parse,findScore:x=>x.score||x,buildMidi:()=>Uint8Array.from([77,84,104,100])};
test('classic preserves 0.4.24 prompts and notes format across three calls',async()=>{
 const requests=[],score={title:'Walzer',bpm:72,timeSignature:[3,4],tracks:[{name:'Violine',notes:[[0,1,69,75]]}]};
 const task='Komponiere einen Walzer für Violine und Klavier.';
 const draft='Titel: Walzer\nTakt 1 Violine A4';
 const json=JSON.stringify(score);
 const r=await runClassicComposition({engine,task,apiKey:'secret',fetchImpl:async(_url,o)=>{
  const input=JSON.parse(o.body).input;requests.push(input);
  return {ok:true,json:async()=>({output_text:[draft,json,'Musikalische Beschreibung'][requests.length-1],usage:{input_tokens:10,output_tokens:20}})};
 }});
 assert.deepEqual(requests,[classicDraftPrompt(task),classicTranslationPrompt(task,draft),classicIdeaPrompt(task,draft,json)]);
 assert.ok(requests[1].includes(CLASSIC_TECHNICAL_CONTRACT));
 assert.ok(!requests[1].includes('TECHNISCHES FORMAT (kompakt)'));
 assert.equal(r.historicalScore.title,'Walzer');
 assert.deepEqual(r.historicalMidi,[77,84,104,100]);assert.equal(r.compositionIdea,'Musikalische Beschreibung');
 assert.equal(r.usage.total,90);
 assert.deepEqual(r.historicalCalls[0].requestMetadata.body,{input:requests[0]});
 assert.equal(r.historicalCalls[0].responseMetadata.usage.input_tokens,10);
});
test('a failed optional description cannot discard completed composition',async()=>{
 let count=0;const r=await runClassicComposition({engine,task:'Walzer',apiKey:'secret',fetchImpl:async()=>{
  count++;if(count===3)return{ok:false,status:500,text:async()=> 'Unavailable'};
  return{ok:true,json:async()=>({output_text:count===1?'Entwurf':JSON.stringify({title:'A',bpm:72,timeSignature:[3,4],tracks:[]})})};
 }});
 assert.equal(r.runStatus,'completed_without_description');assert.deepEqual(r.historicalMidi,[77,84,104,100]);
});
