import {diagnosticRequest,diagnosticResponse} from './api-diagnostic.js';
/* Originaler Musik-Ablauf V0.4.24, isoliert von der aktuellen Klangvorstellung.
 * Die KI komponiert zuerst vollständig und übersetzt danach werkgetreu;
 * MIDI entsteht unverändert lokal. */
import {classicDraftPrompt,classicTranslationPrompt,classicIdeaPrompt,CLASSIC_VERSION} from './classic-prompts.js';
import {extractUsage,estimateCost} from './cost-control.js';
import {normalizeScoreJson} from './historical-compose.js';

function scoreBarCount(score){
 const ts=score?.timeSignature||[4,4],beats=(Number(ts[0])||4)*4/(Number(ts[1])||4);
 let end=0;for(const tr of score?.tracks||[])for(const n of tr.notes||[])end=Math.max(end,Number(n[0])+Number(n[1]));
 return Math.max(1,Math.ceil(end/beats));
}
function snapshot({task,provider,model,calls,draft='',score=null,midi=null,idea='',error='',status='partial'}){
 const usage=calls.filter(c=>c.status==='completed').reduce((u,c)=>({
  input:u.input+(c.usage?.input||0),output:u.output+(c.usage?.output||0),
  total:u.total+(c.usage?.total||0),cached:u.cached+(c.usage?.cached||0)
 }),{input:0,output:0,total:0,cached:0});
 return {mode:'historical',workflow:'classic-0.4.24',historicalVersion:CLASSIC_VERSION,
  userInput:task,appAdditions:'',provider,model,actualRequest:calls.map(c=>c.prompt).join('\n\n---\n\n'),
  aiResponse:calls.find(c=>c.stage==='midi_translation')?.response||'',
  historicalCalls:calls.map(c=>({...c})),concept:draft,musicalDraft:draft,compositionIdea:idea,
  historicalScore:score,historicalMidi:midi,historicalScoreJson:calls.find(c=>c.stage==='midi_translation')?.normalized||'',
  technicalRecovery:calls.find(c=>c.stage==='midi_translation')?.recovery||'',
  title:score?.title||'',bars:score?scoreBarCount(score):null,usage,estimatedCost:estimateCost(model,usage),
  error,runStatus:status};
}
export function formatClassicProtocol(record){
 const labels={musical_draft:'1. MUSIKALISCHER ENTWURF',midi_translation:'2. TECHNISCHE ÜBERTRAGUNG',composition_idea_afterwards:'3. NACHTRÄGLICHE BESCHREIBUNG'};
 const lines=['VERFAHREN: Originalanweisungen aus MiniComposer 0.4.24.','NUTZERAUFTRAG: '+record.userInput,
  'PROVIDER / MODELL: '+record.provider+' / '+record.model];
 for(const c of record.historicalCalls||[]){
  lines.push('','=== '+(labels[c.stage]||c.stage)+' ===','VOLLSTÄNDIGE ANFRAGE:',c.prompt,
   'ORIGINALANTWORT:',c.response,'TOKENS: '+JSON.stringify(c.usage||{}));
  if(c.recovery)lines.push('TECHNISCHE BEREINIGUNG:',c.recovery);
  if(c.requestMetadata)lines.push('API-ANFRAGE (OHNE ZUGANGSDATEN):',JSON.stringify(c.requestMetadata,null,2));
  if(c.responseMetadata)lines.push('API-ANTWORTMETADATEN:',JSON.stringify(c.responseMetadata,null,2));
  if(c.error)lines.push('FEHLER:',c.error);
 }
 return lines.join('\n');
}
export async function runClassicComposition({
 engine,task,provider='openai',model='gpt-5.6-sol',apiKey,
 onStage1=()=>{},onStage2=()=>{},onProgress=()=>{},fetchImpl=fetch
}){
 const clean=String(task||'').trim();
 if(!clean||!apiKey)throw new Error('Auftrag und API-Key fehlen.');
 if(!engine?.makeRequest||!engine?.actualRequest||!engine?.extractText||!engine?.extractJson||!engine?.findScore||!engine?.buildMidi)
  throw new Error('Historische MIDI-Funktionen fehlen.');
 const calls=[];let draft='',score=null,midi=null,idea='';
 const partial=(error='',status='partial')=>snapshot({task:clean,provider,model,calls,draft,score,midi,idea,error,status});
 const call=async(stage,prompt)=>{
  const c={stage,prompt,response:'',usage:null,status:'started'};calls.push(c);
  const tmpl=engine.makeRequest(provider,model,prompt,stage),req=engine.actualRequest(tmpl,apiKey);
  c.requestMetadata=diagnosticRequest(tmpl,req);
  onProgress({musical_draft:'Musikalischer Entwurf entsteht …',midi_translation:'Entwurf wird technisch übertragen …',composition_idea_afterwards:'Komposition wird beschrieben …'}[stage]);
  const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),180000);
  try{
   const res=await fetchImpl(req.url,{method:'POST',headers:req.headers,body:JSON.stringify(req.body),signal:abort.signal});
   if(!res.ok)throw new Error('API '+res.status+': '+(await res.text()).slice(0,450));
   const data=await res.json();
   c.response=engine.extractText(provider,data);
   if(!c.response?.trim())throw new Error('Leere KI-Antwort ('+stage+').');
   c.usage=extractUsage(provider,data);c.responseMetadata=diagnosticResponse(provider,data,res);c.status='completed';
   return c.response;
  }catch(e){c.status='failed';c.error=e.message;throw e;}
  finally{clearTimeout(timer);}
 };
 try{
  draft=await call('musical_draft',classicDraftPrompt(clean));onStage1(partial());
  const raw=await call('midi_translation',classicTranslationPrompt(clean,draft));
  const parsed=normalizeScoreJson(raw),translation=calls.at(-1);
  translation.normalized=parsed.text;if(parsed.repaired)translation.recovery=parsed.explanation;
  score=engine.findScore(engine.extractJson(parsed.text));
  midi=Array.from(engine.buildMidi(score));onStage2(partial());
  try{idea=await call('composition_idea_afterwards',classicIdeaPrompt(clean,draft,raw));}
  catch(e){onProgress('Musik fertig; Beschreibung fehlgeschlagen: '+e.message);return partial(e.message,'completed_without_description');}
  onProgress('Komposition fertig.');return partial('','completed');
 }catch(e){e.partialRecord=partial(e.message);throw e;}
}
