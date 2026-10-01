import {diagnosticRequest,diagnosticResponse} from './api-diagnostic.js';
import {extractUsage,estimateCost} from './cost-control.js';

export const PURE_MIDI_FILE_TECHNICAL_CONTRACT=
'TECHNISCHE AUSGABEANFORDERUNG – MIDI-DATEI:\n'+
'Erzeuge die fertige Komposition direkt als binäre Standard-MIDI-Datei (.mid). Verwende dafür das Python-Tool / Code Interpreter. Lege die fertige Datei im Container ab. Keine JSON-Notenliste, kein LilyPond, kein ABC und kein MusicXML. Die musikalischen Entscheidungen triffst du frei; das Dateiformat darf die musikalische Gestaltung nicht vereinfachen.';

export function pureMidiFilePrompt(task,additionalInstructions=''){
 const clean=String(task||'').trim(),extra=String(additionalInstructions||'').trim();
 if(!clean)throw new Error('Kompositionsauftrag fehlt.');
 return extra?extra+'\n\nKOMPOSITIONSAUFTRAG:\n'+clean:clean;
}

function extractText(data){
 const parts=[];
 for(const item of data?.output||[])for(const c of item?.content||[])if(typeof c?.text==='string')parts.push(c.text);
 return parts.join('\n').trim();
}
function findContainerId(data){
 for(const item of data?.output||[])if(item?.type==='code_interpreter_call'&&typeof item.container_id==='string')return item.container_id;
 for(const item of data?.output||[])for(const c of item?.content||[])for(const a of c?.annotations||[])if(a?.type==='container_file_citation'&&a.container_id)return a.container_id;
 return null;
}
function citedMidi(data){
 for(const item of data?.output||[])for(const c of item?.content||[])for(const a of c?.annotations||[])
  if(a?.type==='container_file_citation'&&/\.midi?$/i.test(a.filename||''))return {fileId:a.file_id,filename:a.filename,containerId:a.container_id};
 return null;
}
async function fetchJson(url,apiKey){
 const r=await fetch(url,{headers:{Authorization:'Bearer '+apiKey}});
 if(!r.ok)throw new Error('Container-Dateiliste: API '+r.status);
 return r.json();
}
async function locateMidi(data,apiKey){
 const cited=citedMidi(data);if(cited)return cited;
 const containerId=findContainerId(data);if(!containerId)throw new Error('Kein Code-Interpreter-Container in der Antwort gefunden.');
 const list=await fetchJson('https://api.openai.com/v1/containers/'+encodeURIComponent(containerId)+'/files?limit=100&order=desc',apiKey);
 const f=(list.data||[]).find(x=>/\.midi?$/i.test(x.path||'')||/\.midi?$/i.test(x.filename||''));
 if(!f)throw new Error('Die KI hat keine .mid-Datei im Container erzeugt.');
 return {containerId,fileId:f.id,filename:(f.path||f.filename||'Komposition.mid').split('/').pop()};
}
async function downloadMidi(ref,apiKey){
 const r=await fetch('https://api.openai.com/v1/containers/'+encodeURIComponent(ref.containerId)+'/files/'+encodeURIComponent(ref.fileId)+'/content',
  {headers:{Authorization:'Bearer '+apiKey}});
 if(!r.ok)throw new Error('MIDI-Datei konnte nicht geladen werden: API '+r.status);
 const bytes=new Uint8Array(await r.arrayBuffer());
 if(bytes.length<14||String.fromCharCode(...bytes.slice(0,4))!=='MThd')throw new Error('Erzeugte Datei ist keine gültige Standard-MIDI-Datei.');
 return bytes;
}
export function formatPureMidiFileProtocol(record){
 const c=record?.historicalCalls?.[0];
 return ['VERFAHREN: Pure → MIDI-Datei. Ein KI-Aufruf mit Code Interpreter; die erzeugte binäre MIDI-Datei wird unverändert übernommen.',
 'NUTZERAUFTRAG: '+(record?.userInput||''),'ZUSÄTZLICHE ANGABEN: '+(record?.appAdditions||'(keine)'),
 'PROVIDER / MODELL: '+(record?.provider||'')+' / '+(record?.model||''),
 ...(c?['','=== EINZIGER KI-AUFRUF ===','VOLLSTÄNDIGE ANFRAGE:',c.prompt,'ORIGINALANTWORT:',c.response||'(keine Textantwort)',
 'DATEI: '+(record?.generatedFilename||''),'TOKENS: '+JSON.stringify(c.usage||{}),
 ...(c.requestMetadata?['API-ANFRAGE (OHNE ZUGANGSDATEN):',JSON.stringify(c.requestMetadata,null,2)]:[]),
 ...(c.responseMetadata?['API-ANTWORTMETADATEN:',JSON.stringify(c.responseMetadata,null,2)]:[])]:[])].join('\n');
}

export async function runPureMidiFileComposition({task,additionalInstructions='',provider='openai',model='gpt-6-sol',apiKey,onProgress=()=>{},fetchImpl=fetch}){
 const clean=String(task||'').trim(),extra=String(additionalInstructions||'').trim();
 if(provider!=='openai')throw new Error('Der direkte MIDI-Datei-Test ist derzeit nur mit OpenAI verfügbar.');
 if(!clean||!apiKey)throw new Error('Auftrag und API-Key fehlen.');
 const prompt=pureMidiFilePrompt(clean,extra),body={model,input:[{role:'user',content:[{type:'input_text',text:prompt}]}],
  tools:[{type:'code_interpreter',container:{type:'auto'}}],tool_choice:'required',include:['code_interpreter_call.outputs'],store:false};
 const req={url:'https://api.openai.com/v1/responses',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},body};
 const call={stage:'pure_midi_file',prompt,response:'',usage:null,status:'started',requestMetadata:diagnosticRequest({body},{...req})};
 const partial=(error='',midi=null)=>({mode:'historical',workflow:'pure-midi-file',historicalVersion:'pure-midi-file-v1',
  userInput:clean,appAdditions:extra,provider,model,actualRequest:prompt,aiResponse:call.response||'',historicalCalls:[{...call}],
  historicalScore:null,historicalMidi:midi,title:'',bars:null,generatedFilename:'',usage:call.usage||{input:0,output:0,total:0,cached:0},
  estimatedCost:estimateCost(model,call.usage),error,runStatus:error?'partial':'completed'});
 onProgress('KI erzeugt direkte MIDI-Datei …');
 try{
  const res=await fetchImpl(req.url,{method:'POST',headers:req.headers,body:JSON.stringify(body)});
  if(!res.ok)throw new Error('API '+res.status+': '+(await res.text()).slice(0,450));
  const data=await res.json();call.response=extractText(data);call.usage=extractUsage(provider,data);call.responseMetadata=diagnosticResponse(provider,data,res);call.status='completed';
  const ref=await locateMidi(data,apiKey),bytes=await downloadMidi(ref,apiKey);
  const rec=partial('',Array.from(bytes));rec.generatedFilename=ref.filename||'Komposition.mid';rec.title=(rec.generatedFilename||'Komposition.mid').replace(/\.midi?$/i,'');
  onProgress('Direkte MIDI-Datei fertig.');return rec;
 }catch(e){call.status='failed';call.error=e.message;e.partialRecord=partial(e.message);throw e;}
}
