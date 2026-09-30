import test from 'node:test';
import assert from 'node:assert/strict';
import {resumeHistoricalComposition} from '../src/historical-compose.js';

test('resume after stage-2 network failure calls only score realization once',async()=>{
 let fetches=0;
 const engine={
  createPrompts:()=>({midiTranslation:'SECOND PROMPT'}),
  makeRequest:(provider,model,prompt,stage)=>({url:'https://example.invalid',headers:{},body:{provider,model,prompt,stage}}),
  actualRequest:x=>x,
  extractText:()=>JSON.stringify({t:'Resume',b:80,m:[4,4],v:[['Violine',40,0,[[1,0,1,72,80]]]]}),
  extractJson:JSON.parse,
  findScore:o=>({title:o.t,bpm:o.b,timeSignature:o.m,tracks:o.v.map(v=>({name:v[0],program:v[1],channel:v[2],notes:v[3].map(n=>[(n[0]-1)*4+n[1],n[2],n[3],n[4]])}))}),
  buildMidi:()=>new Uint8Array([77,84,104,100])
 };
 const partial={id:'x',mode:'historical',runStatus:'partial',userInput:'Komponiere ein Stück',provider:'openai',model:'gpt-6-sol',
  concept:'Klangvorstellung',historicalScore:null,historicalCalls:[
   {stage:'sound_concept',prompt:'FIRST',response:'Klangvorstellung',usage:{input:1,output:1,total:2,cached:0},status:'completed'},
   {stage:'score_realization',prompt:'SECOND PROMPT',response:'',usage:null,status:'failed',error:'Failed to fetch'}
  ]};
 const fetchImpl=async()=>{fetches++;return{ok:true,json:async()=>({}),text:async()=>''};};
 const result=await resumeHistoricalComposition({engine,record:partial,apiKey:'x',fetchImpl});
 assert.equal(fetches,1);
 assert.equal(result.historicalCalls.filter(c=>c.stage==='sound_concept').length,1);
 assert.equal(result.historicalCalls.filter(c=>c.stage==='score_realization').length,2);
 assert.equal(result.historicalCalls.at(-1).status,'completed');
 assert.equal(result.historicalScore.title,'Resume');
 assert.deepEqual(result.historicalMidi,[77,84,104,100]);
});
