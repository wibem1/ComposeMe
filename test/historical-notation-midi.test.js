import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {buildAbcNotationPrompt,extractAbcOnly,ABC_NOTATION_INSTRUCTION,requestAbcNotation} from '../src/historical-notation-ai.js';
import {parseMidi} from '../src/historical-player.js';

const ctx={window:{},crypto:crypto.webcrypto,TextEncoder,structuredClone,Uint8Array,ArrayBuffer};
vm.runInNewContext(fs.readFileSync('experiments/sound-concept-149/historical-engine.js','utf8'),ctx);
const engine=ctx.window.CompositionEngine;
const compact={t:'Unter der stillen Oberfläche',b:64,m:[4,4],v:[
 ['Violine',40,0,[[3,1,2,62,31,'D4'],[3,3,.5,63,34,'Eb4']]],
 ['Klavier',0,1,[[1,0,1.5,38,35,'D2'],[1,0,1.5,45,31,'A2'],[32,2,2,38,25,'D2']]]
]};

test('notation prompt contains complete finished JSON and forbids musical changes',()=>{
 const json=JSON.stringify(compact),prompt=buildAbcNotationPrompt(json);
 assert.match(prompt,/Keine musikalischen Änderungen/);
 assert.match(prompt,/Unter der stillen Oberfläche/);
 assert.ok(prompt.endsWith(json));
 assert.equal(ABC_NOTATION_INSTRUCTION.includes('ABC-Notation'),true);
});
test('AI notation response is reduced only to ABC text',()=>{
 const raw='\`\`\`abc\nX:1\nT:Test\nM:4/4\nL:1/4\nK:C\nC D E F |\n\`\`\`';
 const abc=extractAbcOnly(raw);
 assert.match(abc,/^X:1/);assert.match(abc,/^K:C$/m);assert.doesNotMatch(abc,/\`\`\`/);
});
test('third call uses Sol and preserves original answer in protocol object',async()=>{
 const requests=[];
 const fetchImpl=async(_url,options)=>{requests.push(JSON.parse(options.body));return {ok:true,json:async()=>({
  output:[{type:'message',content:[{type:'output_text',text:'X:1\nT:Test\nM:4/4\nL:1/4\nK:C\nC |'}]}],
  usage:{input_tokens:10,output_tokens:20,total_tokens:30}
 })};};
 const r=await requestAbcNotation({scoreJson:JSON.stringify(compact),apiKey:'x',fetchImpl});
 assert.equal(requests[0].model,'gpt-5.6-sol');
 assert.equal(r.call.stage,'notation_abc');assert.match(r.call.response,/^X:1/);
});
test('original MIDI parser still reproduces every canonical note event',()=>{
 const score=engine.findScore(compact),midi=engine.buildMidi(score),parsed=parseMidi(midi);
 assert.equal(parsed.notes.length,score.tracks.reduce((n,t)=>n+t.notes.length,0));
 assert.equal(parsed.notes.find(n=>n.channel===0)?.program,40);
 assert.equal(parsed.notes.find(n=>n.channel===1)?.program,0);
});
test('historical UI no longer invokes the mechanical JSON-to-ABC converter',()=>{
 const ui=fs.readFileSync('src/historical-ui.js','utf8');
 assert.doesNotMatch(ui,/historicalScoreToAbc/);
 assert.match(ui,/record\.historicalAbc/);
 assert.match(ui,/createMidiPlayer/);
 assert.match(ui,/dataset\.source='original-midi'/);
 assert.match(ui,/dritter KI-Aufruf JSON → ABC/);
});
