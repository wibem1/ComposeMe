import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import crypto from 'node:crypto';
import {buildMusicXmlNotationPrompt,extractMusicXmlOnly,MUSICXML_NOTATION_INSTRUCTION,requestMusicXmlNotation} from '../src/historical-notation-ai.js';
import {parseMidi} from '../src/historical-player.js';

const ctx={window:{},crypto:crypto.webcrypto,TextEncoder,structuredClone,Uint8Array,ArrayBuffer};
vm.runInNewContext(fs.readFileSync('experiments/sound-concept-149/historical-engine.js','utf8'),ctx);
const engine=ctx.window.CompositionEngine;
const compact={t:'Unter der stillen Oberfläche',b:64,m:[4,4],v:[
 ['Violine',40,0,[[3,1,2,62,31,'D4'],[3,3,.5,63,34,'Eb4']]],
 ['Klavier',0,1,[[1,0,1.5,38,35,'D2'],[1,0,1.5,45,31,'A2'],[32,2,2,38,25,'D2']]]
]};
const xml='<?xml version="1.0" encoding="UTF-8"?><score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Klavier</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure></part></score-partwise>';

test('MusicXML notation prompt contains full finished JSON and forbids musical changes',()=>{
 const json=JSON.stringify(compact),prompt=buildMusicXmlNotationPrompt(json);
 assert.match(prompt,/Keine musikalischen Änderungen/);
 assert.match(prompt,/MusicXML 4\.0/);
 assert.match(prompt,/EINEN Part mit zwei Staves/);
 assert.match(prompt,/Unter der stillen Oberfläche/);
 assert.ok(prompt.endsWith(json));
 assert.equal(MUSICXML_NOTATION_INSTRUCTION.includes('MusicXML'),true);
});
test('AI notation response is reduced to complete MusicXML only',()=>{
 const out=extractMusicXmlOnly('Hier ist die Datei:\n'+xml);
 assert.match(out,/^<\?xml/);assert.match(out,/<score-partwise/);assert.doesNotMatch(out,/Hier ist/);
});
test('third call uses Sol and preserves raw MusicXML answer',async()=>{
 const requests=[];
 const fetchImpl=async(_url,options)=>{requests.push(JSON.parse(options.body));return {ok:true,json:async()=>({
  output:[{type:'message',content:[{type:'output_text',text:xml}]}],
  usage:{input_tokens:10,output_tokens:20,total_tokens:30}
 })};};
 const r=await requestMusicXmlNotation({scoreJson:JSON.stringify(compact),apiKey:'x',fetchImpl});
 assert.equal(requests[0].model,'gpt-5.6-sol');
 assert.equal(requests[0].max_output_tokens,64000);
 assert.equal(requests[0].reasoning?.effort,'none');
 assert.equal(r.call.stage,'notation_musicxml');assert.equal(r.call.response,xml);assert.match(r.musicXml,/<score-partwise/);
});
test('incomplete MusicXML response keeps raw text and API reason on the failed call',async()=>{
 const partial='<?xml version="1.0"?><score-partwise version="4.0"><part-list>';
 const fetchImpl=async()=>({ok:true,json:async()=>({
  status:'incomplete',incomplete_details:{reason:'max_output_tokens'},
  output:[{type:'message',content:[{type:'output_text',text:partial}]}],
  usage:{input_tokens:10,output_tokens:64000,total_tokens:64010}
 })});
 await assert.rejects(()=>requestMusicXmlNotation({scoreJson:JSON.stringify(compact),apiKey:'x',fetchImpl}),err=>{
  assert.match(err.message,/unvollständig/);
  assert.equal(err.notationCall?.response,partial);
  assert.equal(err.notationCall?.apiStatus,'incomplete');
  assert.equal(err.notationCall?.incompleteDetails?.reason,'max_output_tokens');
  assert.equal(err.notationCall?.status,'failed');
  return true;
 });
});
test('original MIDI parser still reproduces every canonical note event',()=>{
 const score=engine.findScore(compact),midi=engine.buildMidi(score),parsed=parseMidi(midi);
 assert.equal(parsed.notes.length,score.tracks.reduce((n,t)=>n+t.notes.length,0));
 assert.equal(parsed.notes.find(n=>n.channel===0)?.program,40);
 assert.equal(parsed.notes.find(n=>n.channel===1)?.program,0);
});
test('SoundFont player keeps original MIDI as source and has no oscillator fallback',()=>{
 const player=fs.readFileSync('src/historical-player.js','utf8'),html=fs.readFileSync('index.html','utf8');
 assert.match(player,/WebAudioFontPlayer/);
 assert.match(player,/FluidR3_GM_sf2_file/);
 assert.match(player,/fluidR3Info\(program\)/);
 assert.doesNotMatch(player,/findInstrument\(program\)/);
 assert.match(player,/queueWaveTable/);
 assert.match(player,/cancelQueue/);
 assert.match(player,/n\\.velocity\/127/);
 assert.doesNotMatch(player,/velocity\/127\\*\\.8/);
 assert.doesNotMatch(player,/createOscillator/);
 assert.match(html,/WebAudioFontPlayer\.js/);
});
test('historical notation uses MusicXML renderer and not historical ABC conversion',()=>{
 const ui=fs.readFileSync('src/historical-ui.js','utf8'),html=fs.readFileSync('index.html','utf8');
 assert.doesNotMatch(ui,/historicalScoreToAbc|normalizeAbcForAbcjs/);
 assert.match(ui,/historicalMusicXml/);
 assert.match(ui,/OpenSheetMusicDisplay/);
 assert.match(ui,/JSON → MusicXML/);
 assert.match(html,/opensheetmusicdisplay@2\.1\.3/);
 assert.match(ui,/SoundFont-Player · Original-MIDI/);
 assert.match(ui,/dataset\.source='original-midi'/);
});
