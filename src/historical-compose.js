/* Slim transparent adapter for the preserved Minimal Composer 0.5.99 engine.
 * Exactly two musical AI stages: sound concept -> finished JSON composition.
 * MIDI is created locally by the preserved historical engine. No notation AI call.
 */
import {recoverSingleClosingBracket} from '../experiments/sound-concept-149/technical-recovery.js';
import {extractUsage,estimateCost} from './cost-control.js';

export function originalHistoricalPrompts(engine,task,concept='',provider='openai',model='gpt-5.6-sol') {
  if(!engine?.createPrompts)throw new Error('Die historische Engine wurde nicht geladen.');
  const snapshot={visibleTask:String(task).trim(),provider,model};
  return engine.createPrompts(snapshot,concept);
}

const compositionCalls=record=>(record?.historicalCalls||[]).filter(c=>c.stage==='sound_concept'||c.stage==='score_realization');
const stageLabel=stage=>stage==='sound_concept'?'=== 1. KLANGVORSTELLUNG ===':'=== 2. KOMPOSITION ===';

export function normalizeScoreJson(text){
 let cleaned=String(text??'').trim(),fenceRemoved=false;
 const fenced=cleaned.match(/^\`\`\`(?:json)?[ \\t]*\\r?\\n([\\s\\S]*?)\\r?\\n\`\`\`[ \\t]*$/i);
 if(fenced){cleaned=fenced[1].trim();fenceRemoved=true;}
 const repair=recoverSingleClosingBracket(cleaned);
 const notes=[];
 if(fenceRemoved)notes.push('Äußerer Markdown-Codeblock entfernt; JSON-Inhalt unverändert.');
 if(repair.repaired)notes.push(repair.explanation);
 return {text:repair.text,repaired:fenceRemoved||repair.repaired,explanation:notes.join(' ')};
}

export function formatHistoricalProtocol(record){
 const calls=compositionCalls(record);
 const lines=['VERFAHREN: Zweistufiger historischer Ablauf aus Minimal Composer 0.5.99.',
  'NUTZERAUFTRAG: '+(record.userInput||''),'PROVIDER / MODELL: '+(record.provider||'')+' / '+(record.model||'')];
 for(const call of calls){
  lines.push('',stageLabel(call.stage),
   'TATSÄCHLICHE KI-ANFRAGE (vollständig):',call.prompt,
   'ORIGINALANTWORT DER KI (unverändert):',call.response,
   'TOKENS: '+JSON.stringify(call.usage||{}));
  if(call.recovery)lines.push('TECHNISCHE KORREKTUR:',call.recovery);
 }
 if(record.technicalRecovery)lines.push('','TECHNISCHE KORREKTUR DER JSON-PARTITUR:',record.technicalRecovery);
 return lines.join('\n');
}

function sumUsage(calls){
 return calls.reduce((a,c)=>({input:a.input+(c.usage?.input||0),output:a.output+(c.usage?.output||0),
 total:a.total+(c.usage?.total||0),cached:a.cached+(c.usage?.cached||0)}),{input:0,output:0,total:0,cached:0});
}

function newPartial({task,provider,model,calls,concept='',error='',runStatus='partial'}) {
 const musicalCalls=calls.filter(c=>c.stage==='sound_concept'||c.stage==='score_realization');
 const usage=sumUsage(musicalCalls);
 return {mode:'historical',historicalVersion:'1.4.0-experiment',userInput:task,appAdditions:'',
 provider,model,actualRequest:musicalCalls.map(c=>c.prompt).join('\n\n---\n\n'),aiResponse:'',
 historicalCalls:musicalCalls,concept,technicalRecovery:'',historicalScore:null,historicalMidi:null,
 historicalScoreJson:'',usage,estimatedCost:estimateCost(model,usage),error,runStatus};
}

export async function runHistoricalComposition({
 engine,task,provider='openai',model='gpt-5.6-sol',apiKey,
 firstPrompt=null,secondPrompt=null,
 onConcept=async()=>null,onStage1=()=>{},onProgress=()=>{},fetchImpl=fetch
}){
 const cleanTask=String(task||'').trim();
 if(!cleanTask||!apiKey)throw new Error('Auftrag und API-Key fehlen.');
 if(!engine?.compose||!engine?.createPrompts)throw new Error('Die historische Engine fehlt.');
 const snapshot={visibleTask:cleanTask,provider,model};
 const calls=[];
 let concept='',scoreJson='';
 const requestModel=async({snapshot,key,promptText,stage})=>{
  const originalPrompt=promptText;
  let finalPrompt=originalPrompt;
  if(stage==='sound_concept'){
   if(firstPrompt!=null)finalPrompt=firstPrompt;
  }else if(stage==='score_realization'){
   const proposal=secondPrompt ?? originalPrompt;
   const stage1Record=newPartial({task:cleanTask,provider,model,calls,concept,runStatus:'stage1_completed'});
   onStage1(stage1Record);
   finalPrompt=await onConcept({concept,proposal,original:originalPrompt,partialRecord:stage1Record});
   if(finalPrompt==null)finalPrompt=proposal;
  }
  if(typeof finalPrompt!=='string'||!finalPrompt.trim())throw new Error('Leere KI-Anweisung.');
  const template=engine.makeRequest(snapshot.provider,snapshot.model,finalPrompt,stage);
  const request=engine.actualRequest(template,key);
  const call={stage,prompt:finalPrompt,response:'',usage:null,recovery:null,status:'started'};
  calls.push(call);
  onProgress(stage==='sound_concept'?'Klangvorstellung entsteht …':'Musik wird komponiert …');
  const started=Date.now();
  const abort=new AbortController();
  const timeout=setTimeout(()=>abort.abort(),180000);
  let data,original;
  try{
   const res=await fetchImpl(request.url,{method:'POST',headers:request.headers,body:JSON.stringify(request.body),signal:abort.signal});
   if(!res.ok)throw new Error('API '+res.status+': '+(await res.text()).slice(0,450));
   data=await res.json();
   original=engine.extractText(snapshot.provider,data);
   if(!original?.trim())throw new Error('Die KI hat keinen Text zurückgegeben.');
  }catch(error){
   call.status='failed';call.elapsedMs=Date.now()-started;call.error=error?.message||String(error);
   throw error;
  }finally{clearTimeout(timeout);}
  call.response=original;
  call.status='completed';call.elapsedMs=Date.now()-started;
  call.usage=extractUsage(snapshot.provider,data);
  if(stage==='sound_concept'){
   concept=original;
   onProgress('Klangvorstellung fertig.');
   return original;
  }
  try{
   const repair=normalizeScoreJson(original);
   if(repair.repaired)call.recovery=repair.explanation;
   scoreJson=repair.text;
   return repair.text;
  }catch(err){throw new Error('Die KI-Partitur ist technisch ungültig: '+err.message);}
 };
 try{
  const output=await engine.compose({
   snapshot,key:apiKey,runId:'composeme-'+Date.now(),now:()=>new Date().toISOString(),
   requestModel,usedTitles:[]
  });
  const record=newPartial({task:cleanTask,provider,model,calls,concept,runStatus:'completed'});
  record.aiResponse=calls.find(c=>c.stage==='score_realization')?.response??'';
  record.historicalScore=output.run.score;
  record.historicalMidi=Array.from(output.midiBytes);
  record.historicalScoreJson=scoreJson;
  record.title=output.run.score?.title||'Ohne Titel';
  record.technicalRecovery=calls.find(c=>c.stage==='score_realization'&&c.recovery)?.recovery||'';
  record.bars=output.run.profile?.barCount;
  onProgress('Komposition fertig.');
  return record;
 }catch(error){
  error.partialRecord=newPartial({task:cleanTask,provider,model,calls,concept,error:error.message});
  throw error;
 }
}


function scoreBarCount(score){
 const ts=Array.isArray(score?.timeSignature)?score.timeSignature:[4,4];
 const beats=(Number(ts[0])||4)*(4/(Number(ts[1])||4));
 let end=0;
 for(const tr of(score?.tracks||[]))for(const n of(tr.notes||[]))if(Array.isArray(n))end=Math.max(end,(Number(n[0])||0)+(Number(n[1])||0));
 return Math.max(1,Math.ceil(end/Math.max(.25,beats)));
}

export async function resumeHistoricalComposition({
 engine,record,apiKey,secondPrompt=null,onProgress=()=>{},fetchImpl=fetch
}){
 if(!engine?.makeRequest||!engine?.actualRequest||!engine?.extractText||!engine?.extractJson||!engine?.findScore||!engine?.buildMidi)
  throw new Error('Die historische Engine fehlt.');
 if(!record?.concept?.trim())throw new Error('Keine gespeicherte Klangvorstellung zum Fortsetzen vorhanden.');
 if(!apiKey)throw new Error('API-Key fehlt.');
 const task=String(record.userInput||'').trim(),provider=record.provider||'openai',model=record.model||'gpt-5.6-sol';
 const snapshot={visibleTask:task,provider,model};
 const calls=(record.historicalCalls||[]).map(call=>structuredClone(call));
 const generated=engine.createPrompts(snapshot,record.concept).midiTranslation;
 const previous=calls.filter(call=>call.stage==='score_realization').at(-1)?.prompt;
 const prompt=String(secondPrompt||previous||generated).trim();
 if(!prompt)throw new Error('Zweite KI-Anweisung ist leer.');
 const template=engine.makeRequest(provider,model,prompt,'score_realization');
 const request=engine.actualRequest(template,apiKey);
 const call={stage:'score_realization',prompt,response:'',usage:null,recovery:null,status:'started',resumed:true};
 calls.push(call);onProgress('Komposition wird fortgesetzt …');
 const started=Date.now(),abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),180000);
 let data,original;
 try{
  const res=await fetchImpl(request.url,{method:'POST',headers:request.headers,body:JSON.stringify(request.body),signal:abort.signal});
  if(!res.ok)throw new Error('API '+res.status+': '+(await res.text()).slice(0,450));
  data=await res.json();original=engine.extractText(provider,data);
  if(!original?.trim())throw new Error('Die KI hat keinen Text zurückgegeben.');
 }catch(error){
  call.status='failed';call.elapsedMs=Date.now()-started;call.error=error?.message||String(error);
  error.partialRecord={...newPartial({task,provider,model,calls,concept:record.concept,error:call.error}),id:record.id};
  throw error;
 }finally{clearTimeout(timeout);}
 call.response=original;call.status='completed';call.elapsedMs=Date.now()-started;call.usage=extractUsage(provider,data);
 let repair;
 try{repair=normalizeScoreJson(original);if(repair.repaired)call.recovery=repair.explanation;}
 catch(err){
  const error=new Error('Die KI-Partitur ist technisch ungültig: '+err.message);
  error.partialRecord={...newPartial({task,provider,model,calls,concept:record.concept,error:error.message}),id:record.id};
  throw error;
 }
 const obj=engine.extractJson(repair.text),score=engine.findScore(obj),midiBytes=engine.buildMidi(score);
 const result=newPartial({task,provider,model,calls,concept:record.concept,runStatus:'completed'});
 result.aiResponse=original;result.historicalScore=score;result.historicalMidi=Array.from(midiBytes);
 result.historicalScoreJson=repair.text;result.title=score.title||'Ohne Titel';result.technicalRecovery=repair.repaired?repair.explanation:'';
 result.bars=scoreBarCount(score);result.error='';onProgress('Komposition fertig.');
 return result;
}
