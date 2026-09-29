/* Transparent adapter for the preserved Minimal Composer 0.5.99 engine.
 * The original two musical stages remain unchanged. A third, post-composition
 * AI call may translate the already finished JSON score into ABC notation.
 */
import {recoverSingleClosingBracket} from '../experiments/sound-concept-149/technical-recovery.js';
import {extractUsage,estimateCost} from './cost-control.js';
import {requestAbcNotation,ABC_NOTATION_INSTRUCTION} from './historical-notation-ai.js?v=0.8.3';

export function originalHistoricalPrompts(engine,task,concept='') {
  if(!engine?.createPrompts)throw new Error('Die historische Engine wurde nicht geladen.');
  const snapshot={visibleTask:String(task).trim(),provider:'openai',model:'gpt-5.6-sol'};
  return engine.createPrompts(snapshot,concept);
}

const stageLabel=stage=>stage==='sound_concept'
 ?'=== 1. KLANGVORSTELLUNG ==='
 :stage==='score_realization'
  ?'=== 2. KOMPOSITION ==='
  :'=== 3. NOTATION: JSON → ABC ===';

export function formatHistoricalProtocol(record){
 const lines=['VERFAHREN: Historische Composition Engine 1.4.0-experiment; die beiden musikalischen KI-Aufrufe bleiben unverändert.',
  'NUTZERAUFTRAG: '+(record.userInput||''),'PROVIDER / MODELL: OpenAI / '+(record.model||'')];
 for(const call of record.historicalCalls||[]){
  lines.push('',stageLabel(call.stage),
   'TATSÄCHLICHE KI-ANFRAGE (vollständig):',call.prompt,
   'ORIGINALANTWORT DER KI (unverändert):',call.response,
   'TOKENS: '+JSON.stringify(call.usage||{}));
  if(call.recovery)lines.push('TECHNISCHE KORREKTUR:',call.recovery);
 }
 if(record.technicalRecovery)lines.push('','TECHNISCHE KORREKTUR DER JSON-PARTITUR:',record.technicalRecovery);
 if(record.notationError)lines.push('','NOTATIONSFEHLER:',record.notationError);
 return lines.join('\n');
}

function sumUsage(calls){
 return calls.reduce((a,c)=>({input:a.input+(c.usage?.input||0),output:a.output+(c.usage?.output||0),
 total:a.total+(c.usage?.total||0),cached:a.cached+(c.usage?.cached||0)}),{input:0,output:0,total:0,cached:0});
}

function newPartial({task,model,calls,concept='',error=''}) {
 const usage=sumUsage(calls);
 return {mode:'historical',historicalVersion:'1.4.0-experiment',userInput:task,appAdditions:'',
 provider:'openai',model,actualRequest:calls.map(c=>c.prompt).join('\n\n---\n\n'),aiResponse:'',
 historicalCalls:calls,concept,technicalRecovery:'',historicalScore:null,historicalMidi:null,
 historicalScoreJson:'',historicalAbc:'',historicalNotationInstruction:ABC_NOTATION_INSTRUCTION,
 notationError:'',usage,estimatedCost:estimateCost(model,usage),error};
}

function recoveredScoreJson(raw){
 const repair=recoverSingleClosingBracket(String(raw||''));
 return {text:repair.text,recovery:repair.repaired?repair.explanation:''};
}

export async function addHistoricalAbcNotation({
 record,apiKey,model='gpt-5.6-sol',instruction=ABC_NOTATION_INSTRUCTION,
 fetchImpl=fetch,onProgress=()=>{}
}){
 if(!record?.historicalScore)throw new Error('Keine fertige historische Komposition vorhanden.');
 const existing=(record.historicalCalls||[]).filter(c=>c.stage!=='notation_abc');
 const source=record.historicalScoreJson?.trim()
  ?{text:record.historicalScoreJson,recovery:''}
  :recoveredScoreJson(record.aiResponse||existing.find(c=>c.stage==='score_realization')?.response||'');
 const result=await requestAbcNotation({scoreJson:source.text,apiKey,model,instruction,fetchImpl,onProgress});
 const calls=[...existing,result.call],usage=sumUsage(calls);
 return {...record,historicalCalls:calls,historicalScoreJson:source.text,historicalAbc:result.abc,
  historicalNotationInstruction:instruction,notationError:'',actualRequest:calls.map(c=>c.prompt).join('\n\n---\n\n'),
  usage,estimatedCost:estimateCost(model,usage)};
}

export async function runHistoricalComposition({
 engine,task,model='gpt-5.6-sol',apiKey,
 firstPrompt=null,secondPrompt=null,
 notationInstruction=ABC_NOTATION_INSTRUCTION,createNotation=true,
 onConcept=async()=>null,onProgress=()=>{},fetchImpl=fetch
}){
 const cleanTask=String(task||'').trim();
 if(!cleanTask||!apiKey)throw new Error('Auftrag und API-Key fehlen.');
 if(!engine?.compose||!engine?.createPrompts)throw new Error('Die historische Engine fehlt.');
 const snapshot={visibleTask:cleanTask,provider:'openai',model};
 const calls=[];
 let concept='',scoreJson='';
 const requestModel=async({snapshot,key,promptText,stage})=>{
  const originalPrompt=promptText;
  let finalPrompt=originalPrompt;
  if(stage==='sound_concept'){
   if(firstPrompt!=null)finalPrompt=firstPrompt;
  }else if(stage==='score_realization'){
   const proposal=secondPrompt ?? originalPrompt;
   finalPrompt=await onConcept({concept,proposal,original:originalPrompt});
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
   const repair=recoverSingleClosingBracket(original);
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
  let record=newPartial({task:cleanTask,model,calls,concept});
  record.aiResponse=calls.find(c=>c.stage==='score_realization')?.response??'';
  record.historicalScore=output.run.score;
  record.historicalMidi=Array.from(output.midiBytes);
  record.historicalScoreJson=scoreJson;
  record.title=output.run.score?.title||'Ohne Titel';
  record.technicalRecovery=calls.find(c=>c.stage==='score_realization'&&c.recovery)?.recovery||'';
  record.bars=output.run.profile?.barCount;
  if(createNotation){
   try{
    record=await addHistoricalAbcNotation({record,apiKey,model,instruction:notationInstruction,fetchImpl,onProgress});
   }catch(err){
    record.notationError=err.message;
    record.usage=sumUsage(record.historicalCalls||[]);
    record.estimatedCost=estimateCost(model,record.usage);
    onProgress('Komposition fertig; ABC-Notation konnte nicht erzeugt werden.');
   }
  }
  return record;
 }catch(error){
  error.partialRecord=newPartial({task:cleanTask,model,calls,concept,error:error.message});
  throw error;
 }
}
