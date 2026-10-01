import test from 'node:test';
import assert from 'node:assert/strict';
import {pureMidiPrompt,runPureMidiComposition,tickScoreToBeatScore} from '../src/pure-midi-compose.js';

const engine={
 makeRequest:(_p,_m,prompt)=>({url:'/mock',headers:{},body:{input:prompt}}),
 actualRequest:x=>x,
 extractText:(_p,x)=>x.output_text,
 extractJson:JSON.parse,
 findScore:x=>x.score||x,
 buildMidi:()=>Uint8Array.from([77,84,104,100])
};

test('pure MIDI sends exactly the visible additions plus the musical request',()=>{
 const task='Komponiere einen Walzer für Violine und Klavier.';
 const extra='SICHTBARER TECHNISCHER VERTRAG';
 const p=pureMidiPrompt(task,extra);
 assert.equal(p,extra+'\n\nKOMPOSITIONSAUFTRAG:\n'+task);
 assert.doesNotMatch(p,/TECHNISCHE AUSGABEANFORDERUNG/);
});

test('pure MIDI adds no hidden instructions when additions are empty',()=>{
 const task='Komponiere einen Walzer für Violine und Klavier.';
 assert.equal(pureMidiPrompt(task),task);
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


test('Pure MIDI tick score is converted locally to beat units without musical changes',()=>{
 const raw={title:'Ticks',bpm:120,timeSignature:[4,4],ppq:480,tracks:[{name:'Klavier',program:0,channel:0,notes:[[0,480,60,80],[480,240,62,70]],cc:[[960,64,127]]}]};
 const score=tickScoreToBeatScore(raw);
 assert.deepEqual(score.tracks[0].notes,[[0,1,60,80],[1,0.5,62,70]]);
 assert.deepEqual(score.tracks[0].cc,[[2,64,127]]);
 assert.equal('ppq' in score,false);
 assert.deepEqual(raw.tracks[0].notes,[[0,480,60,80],[480,240,62,70]]);
});
