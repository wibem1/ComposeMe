export const PURE_MIDI_TECHNICAL_CONTRACT="TECHNISCHE AUSGABEANFORDERUNG – MIDI-EREIGNISSE:\nAntworte ausschließlich mit validem JSON, ohne Markdown und ohne Text außerhalb des JSON.\nDie Partitur steht entweder direkt im Wurzelobjekt oder im Feld \"score\".\nPartiturformat:\n{\n  \"title\": \"optional\",\n  \"bpm\": Zahl,\n  \"timeSignature\": [Zaehler, Nenner],\n  \"ppq\": 480,\n  \"tracks\": [{\n    \"name\": \"Instrument\",\n    \"program\": 0-127,\n    \"channel\": 0-15,\n    \"notes\": [[StartTick, DauerTicks, MIDIPitch, Velocity], ...],\n    \"cc\": [[StartTick, CCNummer, Wert], ...]\n  }]\n}\nZeitwerte werden ausschließlich als ganze MIDI-Ticks angegeben. PPQ ist fest 480 Ticks pro Viertelnote. StartTick und DauerTicks sind ganze Zahlen. Die Tick-Auflösung ist nur das technische Ausgabeformat und darf die musikalische Rhythmik nicht vereinfachen oder verändern. MIDI-Pitch, Velocity, CCNummer und CC-Wert verwenden die MIDI-Wertebereiche. Das CC-Feld ist optional und bildet MIDI-Control-Change-Ereignisse unverändert ab. Das technische Format macht keinerlei Vorgaben zu Stil, Harmonik, Melodik, Rhythmik, Form oder musikalischer Qualität.";
import {normalizeScoreJson} from './historical-compose.js';
import {diagnosticRequest,diagnosticResponse} from './api-diagnostic.js';
import {extractUsage,estimateCost} from './cost-control.js';


export function tickScoreToBeatScore(value){
 const root=value&&value.score&&Array.isArray(value.score.tracks)?value.score:value;
 if(!root||!Array.isArray(root.tracks))return value;
 if(root.ppq==null)return root;
 const ppq=Number(root.ppq);
 if(!Number.isFinite(ppq)||ppq<=0)throw new Error('Ungültiger PPQ-Wert.');
 const score={...root,tracks:root.tracks.map(track=>({
  ...track,
  notes:(track.notes||[]).map(note=>{
   if(!Array.isArray(note)||note.length<4)return note;
   const start=Number(note[0]),duration=Number(note[1]);
   if(!Number.isFinite(start)||!Number.isFinite(duration))return note;
   return [start/ppq,duration/ppq,...note.slice(2)];
  }),
  cc:Array.isArray(track.cc)?track.cc.map(event=>{
   if(!Array.isArray(event)||event.length<3)return event;
   const start=Number(event[0]);
   return Number.isFinite(start)?[start/ppq,...event.slice(1)]:event;
  }):track.cc
 }))};
 delete score.ppq;
 return score;
}

export function pureMidiPrompt(task,additionalInstructions=''){
 const clean=String(task||'').trim(),extra=String(additionalInstructions||'').trim();
 if(!clean)throw new Error('Kompositionsauftrag fehlt.');
 return extra?extra+'\n\nKOMPOSITIONSAUFTRAG:\n'+clean:clean;
}

function scoreBarCount(score){
 const ts=score?.timeSignature||[4,4],beats=(Number(ts[0])||4)*4/(Number(ts[1])||4);
 let end=0;for(const tr of score?.tracks||[])for(const n of tr.notes||[])end=Math.max(end,Number(n[0])+Number(n[1]));
 return Math.max(1,Math.ceil(end/beats));
}

export function formatPureMidiProtocol(record){
 const c=record?.historicalCalls?.[0];
 const lines=['VERFAHREN: Pure → MIDI/JSON. Ein einziger KI-Aufruf; keine musikalische Voranweisung, keine Klangvorstellung, kein Entwurf.',
  'NUTZERAUFTRAG: '+(record?.userInput||''),'ZUSÄTZLICHE ANGABEN: '+(record?.appAdditions||'(keine)'),
  'PROVIDER / MODELL: '+(record?.provider||'')+' / '+(record?.model||'')];
 if(c)lines.push('','=== EINZIGER KI-AUFRUF ===','VOLLSTÄNDIGE ANFRAGE:',c.prompt,'ORIGINALANTWORT:',c.response,
  'TOKENS: '+JSON.stringify(c.usage||{}),
  ...(c.recovery?['TECHNISCHE BEREINIGUNG:',c.recovery]:[]),
  ...(c.requestMetadata?['API-ANFRAGE (OHNE ZUGANGSDATEN):',JSON.stringify(c.requestMetadata,null,2)]:[]),
  ...(c.responseMetadata?['API-ANTWORTMETADATEN:',JSON.stringify(c.responseMetadata,null,2)]:[]));
 return lines.join('\n');
}

export async function runPureMidiComposition({engine,task,additionalInstructions='',provider='openai',model='gpt-5.6-sol',apiKey,onProgress=()=>{},fetchImpl=fetch}){
 const clean=String(task||'').trim(),extra=String(additionalInstructions||'').trim();
 if(!clean||!apiKey)throw new Error('Auftrag und API-Key fehlen.');
 if(!engine?.makeRequest||!engine?.actualRequest||!engine?.extractText||!engine?.extractJson||!engine?.findScore||!engine?.buildMidi)
  throw new Error('MIDI-Funktionen fehlen.');
 const prompt=pureMidiPrompt(clean,extra),call={stage:'pure_midi',prompt,response:'',usage:null,status:'started'};
 const partial=(error='',status='partial',score=null,midi=null)=>({mode:'historical',workflow:'pure-midi',historicalVersion:'pure-midi-v1',
  userInput:clean,appAdditions:extra,provider,model,actualRequest:prompt,aiResponse:call.response||'',
  historicalCalls:[{...call}],historicalScore:score,historicalMidi:midi,historicalScoreJson:call.normalized||'',
  technicalRecovery:call.recovery||'',title:score?.title||'',bars:score?scoreBarCount(score):null,
  usage:call.usage||{input:0,output:0,total:0,cached:0},estimatedCost:estimateCost(model,call.usage),error,runStatus:status});
 const tmpl=engine.makeRequest(provider,model,prompt,'pure_midi'),req=engine.actualRequest(tmpl,apiKey);
 call.requestMetadata=diagnosticRequest(tmpl,req);onProgress('Pure-MIDI-Komposition entsteht …');
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),180000);
 try{
  const res=await fetchImpl(req.url,{method:'POST',headers:req.headers,body:JSON.stringify(req.body),signal:abort.signal});
  if(!res.ok)throw new Error('API '+res.status+': '+(await res.text()).slice(0,450));
  const data=await res.json();call.response=engine.extractText(provider,data);
  if(!call.response?.trim())throw new Error('Leere KI-Antwort.');
  call.usage=extractUsage(provider,data);call.responseMetadata=diagnosticResponse(provider,data,res);call.status='completed';
  const parsed=normalizeScoreJson(call.response);call.normalized=parsed.text;if(parsed.repaired)call.recovery=parsed.explanation;
  const rawScore=engine.extractJson(parsed.text),score=engine.findScore(tickScoreToBeatScore(rawScore)),midi=Array.from(engine.buildMidi(score));
  onProgress('Pure-MIDI-Komposition fertig.');return partial('','completed',score,midi);
 }catch(e){call.status='failed';call.error=e.message;e.partialRecord=partial(e.message);throw e;}
 finally{clearTimeout(timer);}
}
