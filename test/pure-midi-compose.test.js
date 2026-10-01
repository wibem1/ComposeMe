import test from 'node:test';
import assert from 'node:assert/strict';
import {pureMidiPrompt,runPureMidiComposition} from '../src/pure-midi-compose.js';

const engine={
 makeRequest:(_p,_m,prompt)=>({url:'/mock',headers:{},body:{input:prompt}}),
 actualRequest:x=>x,
 extractText:(_p,x)=>x.output_text,
 extractJson:JSON.parse,
 findScore:x=>x.score||x,
 buildMidi:()=>Uint8Array.from([77,84,104,100])
};

test('pure MIDI keeps the musical request bare apart from optional additions and technical output contract',()=>{
 const task='Komponiere einen Walzer für Violine und Klavier.';
 const p=pureMidiPrompt(task);
 assert.ok(p.startsWith(task+'\n\nTECHNISCHE AUSGABEANFORDERUNG'));
 assert.doesNotMatch(p,/Klangvorstellung|vollständigen musikalischen Entwurf|Komponiere das verlangte Stück musikalisch frei/);
});

test('pure MIDI makes one AI call and creates local MIDI',async()=>{
 const task='Komponiere einen Walzer.';
 let count=0,request='';
 const score={title:'Test',bpm:120,timeSignature:[3,4],tracks:[{name:'Klavier',program:0,channel:0,notes:[[0,1,60,80]]}]};
 const r=await runPureMidiComposition({engine,task,apiKey:'x',fetchImpl:async(_u,o)=>{
  count++;request=JSON.parse(o.body).input;
  return {ok:true,status:200,headers:{get:()=>null},json:async()=>({output_text:JSON.stringify(score),usage:{input_tokens:10,output_tokens:20}})};
 }});
 assert.equal(count,1);
 assert.equal(request,pureMidiPrompt(task));
 assert.equal(r.workflow,'pure-midi');
 assert.equal(r.historicalScore.title,'Test');
 assert.deepEqual(r.historicalMidi,[77,84,104,100]);
 assert.equal(r.usage.total,30);
});
