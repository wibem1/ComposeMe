import {originalHistoricalPrompts,runHistoricalComposition,resumeHistoricalComposition} from './historical-compose.js?v=0.8.28';
import {createMidiPlayer,downloadOriginalMidi} from './historical-player.js?v=0.8.28';

const $=id=>document.getElementById(id);
const baseEngine=()=>window.CompositionEngine;
const activePlayers=new WeakMap();
const FIRST_PROMPT_KEY='composeme:historical:first-prompt:v1';
const SECOND_PROMPT_KEY='composeme:historical:second-prompt:v1';
const FIRST_TASK_MARKER='\\n\\nAUFTRAG:\\n';
const SECOND_TASK_MARKER='\\n\\nURSPRÜNGLICHER AUFTRAG:\\n';
const CONCEPT_MARKER='\\n\\nKLINGENDE VORSTELLUNG:\\n';
const TECHNICAL_MARKER='\\n\\nTECHNISCHES FORMAT (kompakt):';

function splitFirstPrompt(text){
 const s=String(text||''),i=s.indexOf(FIRST_TASK_MARKER);
 return i<0?{prefix:s,task:''}:{prefix:s.slice(0,i),task:s.slice(i+FIRST_TASK_MARKER.length)};
}
function buildFirstPrompt(prefix,task){
 return String(prefix||'')+FIRST_TASK_MARKER+String(task||'');
}
function loadSavedFirstPrompt(){
 try{
  const raw=localStorage.getItem(FIRST_PROMPT_KEY);
  if(!raw)return null;
  const parsed=JSON.parse(raw);
  if(parsed&&typeof parsed.prefix==='string')return parsed;
  if(parsed&&typeof parsed.prompt==='string'){
   const migrated={prefix:splitFirstPrompt(parsed.prompt).prefix};
   localStorage.setItem(FIRST_PROMPT_KEY,JSON.stringify(migrated));
   return migrated;
  }
  return null;
 }catch{return null;}
}
function saveFirstPrompt(text){
 const {prefix}=splitFirstPrompt(text);
 try{localStorage.setItem(FIRST_PROMPT_KEY,JSON.stringify({prefix}));}catch{}
}
function clearSavedFirstPrompt(){try{localStorage.removeItem(FIRST_PROMPT_KEY);}catch{}}

function splitSecondPrompt(text){
 const s=String(text||''),taskAt=s.indexOf(SECOND_TASK_MARKER);
 if(taskAt<0)return{prefix:s,task:'',concept:'',tail:''};
 const prefix=s.slice(0,taskAt),afterTask=s.slice(taskAt+SECOND_TASK_MARKER.length);
 const conceptAt=afterTask.indexOf(CONCEPT_MARKER);
 if(conceptAt<0)return{prefix,task:afterTask,concept:'',tail:''};
 const task=afterTask.slice(0,conceptAt),afterConcept=afterTask.slice(conceptAt+CONCEPT_MARKER.length);
 const technicalAt=afterConcept.indexOf(TECHNICAL_MARKER);
 if(technicalAt<0)return{prefix,task,concept:afterConcept,tail:''};
 return{
  prefix,task,concept:afterConcept.slice(0,technicalAt),
  tail:'TECHNISCHES FORMAT (kompakt):'+afterConcept.slice(technicalAt+TECHNICAL_MARKER.length)
 };
}
function buildSecondPrompt(prefix,task,concept,technicalTail=''){
 return String(prefix||'')+SECOND_TASK_MARKER+String(task||'')+CONCEPT_MARKER+String(concept||'')+
  (technicalTail?'\\n\\n'+technicalTail:'');
}
function loadSavedSecondPrompt(){
 try{
  const raw=localStorage.getItem(SECOND_PROMPT_KEY);
  if(!raw)return null;
  const parsed=JSON.parse(raw);
  if(parsed&&typeof parsed.prefix==='string'){
   const migratedPrefix=splitSecondPrompt(parsed.prefix).prefix;
   if(migratedPrefix!==parsed.prefix){
    const migrated={prefix:migratedPrefix};
    localStorage.setItem(SECOND_PROMPT_KEY,JSON.stringify(migrated));
    return migrated;
   }
   return parsed;
  }
  if(parsed&&typeof parsed.prompt==='string'){
   const migrated={prefix:splitSecondPrompt(parsed.prompt).prefix};
   localStorage.setItem(SECOND_PROMPT_KEY,JSON.stringify(migrated));
   return migrated;
  }
  return null;
 }catch{return null;}
}
function saveSecondPromptPrefix(text){
 const {prefix}=splitSecondPrompt(text);
 try{localStorage.setItem(SECOND_PROMPT_KEY,JSON.stringify({prefix}));}catch{}
}
function clearSavedSecondPrompt(){try{localStorage.removeItem(SECOND_PROMPT_KEY);}catch{}}

export function initHistoricalControls(){
 const select=$('composition-process'),section=$('historical-controls'),reset=$('historical-reset'),resetSecond=$('historical-second-reset'),
  first=$('historical-first-prompt'),second=$('historical-second-prompt'),
  concept=$('historical-concept'),pause=$('historical-pause'),
  proceed=$('historical-proceed'),task=$('task'),additional=$('additional'),
  model=$('model'),provider=$('provider');
 let firstWasEdited=Boolean(loadSavedFirstPrompt()),secondWasEdited=Boolean(loadSavedSecondPrompt()),secondAwaiter=null,resumableRecord=null;
 const initial=()=>{
  const engine=baseEngine();if(!engine)return;
  const original=originalHistoricalPrompts(engine,task.value);
  const saved=loadSavedFirstPrompt();
  if(saved)first.value=buildFirstPrompt(saved.prefix,task.value);
  else if(!firstWasEdited)first.value=original.musicalDraft;
  const savedSecond=loadSavedSecondPrompt();
  if(savedSecond){
   const generated=splitSecondPrompt(original.midiTranslation);
   second.value=concept.value
    ?buildSecondPrompt(savedSecond.prefix,task.value,concept.value,generated.tail)
    :buildSecondPrompt(savedSecond.prefix,task.value,'',generated.tail);
  } else if(!secondAwaiter&&!concept.value&&!secondWasEdited)second.value='Die vollständige zweite Originalanfrage erscheint hier nach dem ersten KI-Aufruf.\n\n'+original.midiTranslation;
 };
 function refresh(){
  section.hidden=select.value!=='historical';
  model.disabled=false;provider.disabled=false;
  additional.disabled=!section.hidden;
  if(!section.hidden)initial();
 }
 select.addEventListener('change',refresh);
 task.addEventListener('input',()=>{if(select.value==='historical'&&!secondAwaiter)initial();});
 first.addEventListener('input',()=>{firstWasEdited=true;saveFirstPrompt(first.value);});
 second.addEventListener('input',()=>{secondWasEdited=true;saveSecondPromptPrefix(second.value);});
 reset.addEventListener('click',()=>{clearSavedFirstPrompt();firstWasEdited=false;initial();});
 resetSecond?.addEventListener('click',()=>{
  clearSavedSecondPrompt();secondWasEdited=false;
  const engine=baseEngine();if(!engine)return;
  const generated=originalHistoricalPrompts(engine,task.value,concept.value||'').midiTranslation;
  second.value=concept.value?generated:'Die vollständige zweite Originalanfrage erscheint hier nach dem ersten KI-Aufruf.\n\n'+generated;
 });
 proceed.addEventListener('click',()=>{
  if(secondAwaiter){const resume=secondAwaiter;secondAwaiter=null;proceed.disabled=true;resume(second.value);return;}
  if(resumableRecord)document.getElementById('compose-form')?.requestSubmit();
 });
 initial();refresh();
 function showRecord(record){
  if(record?.mode!=='historical')return;
  select.value='historical';refresh();concept.value=record.concept||'';
  const c1=record.historicalCalls?.find(c=>c.stage==='sound_concept');
  const c2=record.historicalCalls?.find(c=>c.stage==='score_realization');
  // Historical prompts are displayed for inspection, never implicitly reused as the next experiment's inputs.
  const savedFirst=loadSavedFirstPrompt();
  first.value=savedFirst
   ?buildFirstPrompt(savedFirst.prefix,record.userInput)
   :(c1?.prompt||originalHistoricalPrompts(baseEngine(),record.userInput).musicalDraft);
  firstWasEdited=Boolean(savedFirst);
  const savedSecond=loadSavedSecondPrompt();
  if(savedSecond){
   const basis=c2?.prompt||originalHistoricalPrompts(baseEngine(),record.userInput,record.concept||'').midiTranslation;
   const parts=splitSecondPrompt(basis);
   second.value=buildSecondPrompt(savedSecond.prefix,record.userInput,record.concept||parts.concept,parts.tail);
  } else if(c2?.prompt)second.value=c2.prompt;
  const stage1Done=record.historicalCalls?.some(c=>c.stage==='sound_concept'&&c.status==='completed'&&c.response?.trim());
  resumableRecord=record.runStatus==='partial'&&stage1Done&&record.concept?.trim()&&!record.historicalScore?record:null;
  proceed.textContent=resumableRecord?'Komposition fortsetzen':'Komposition fortsetzen';
  if(resumableRecord)proceed.disabled=false;
 }
 function abortWait(){if(secondAwaiter){secondAwaiter(null);secondAwaiter=null;proceed.disabled=true;}}
 async function run({apiKey,taskText,providerName,modelName,onStage1,onProgress}){
  const engine=baseEngine();if(!engine)throw new Error('Historische Engine fehlt. Bitte die App vollständig neu laden.');
  if(resumableRecord&&String(resumableRecord.userInput||'').trim()===String(taskText||'').trim()&&
     resumableRecord.provider===providerName&&resumableRecord.model===modelName){
    const record=resumableRecord;resumableRecord=null;proceed.disabled=true;
    return resumeHistoricalComposition({engine,record,apiKey,secondPrompt:second.value,onProgress});
  }
  const expected=originalHistoricalPrompts(engine,taskText).musicalDraft;
  // A saved custom first prompt is persistent across reloads and follows the current task.
  const saved=loadSavedFirstPrompt();
  if(saved){first.value=buildFirstPrompt(saved.prefix,taskText);firstWasEdited=true;}
  else if(!firstWasEdited)first.value=expected;
  concept.value='';
  const firstPrompt=first.value===expected?null:first.value;
  secondAwaiter=null;proceed.disabled=true;
  return runHistoricalComposition({
   engine,task:taskText,provider:providerName,model:modelName,apiKey,firstPrompt,onStage1,onProgress,
   onConcept:async({concept:idea,proposal})=>{
    concept.value=idea;
    const savedSecond=loadSavedSecondPrompt();
    if(savedSecond){
      const generated=splitSecondPrompt(proposal);
      second.value=buildSecondPrompt(savedSecond.prefix,taskText,idea,generated.tail);
      secondWasEdited=true;
    } else if(!secondWasEdited)second.value=proposal;
    if(!pause.checked)return secondWasEdited?second.value:null;
    onProgress('Klangvorstellung fertig. Zweite Anfrage prüfen und „Komposition fortsetzen“ drücken.');
    return new Promise(resolve=>{secondAwaiter=resolve;proceed.disabled=false;});
   }
  });
 }
 return {run,showRecord,refresh,abortWait,resumeId:()=>resumableRecord?.id||null,isHistorical:()=>select.value==='historical'};
}

function formatTime(sec){const s=Math.max(0,Math.round(Number(sec)||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
export function renderHistoricalScore({record,paper,audio}){
 const score=record?.historicalScore;
 activePlayers.get(audio)?.stop?.();activePlayers.delete(audio);
 paper.replaceChildren();audio.replaceChildren();if(!score)return;
 const meta=document.createElement('p');meta.className='historical-score-meta';
 meta.textContent=`${score.title||'Ohne Titel'} · ${record.bars||'?'} Takte · ${score.bpm||'?'} BPM · ${score.tracks?.length||0} Originalspuren`;
 const note=document.createElement('p');note.className='historical-score-note';
 note.textContent='Komposition fertig. Wiedergabe und MIDI basieren direkt auf der erzeugten Original-Partitur. Notensatz ist bewusst ausgelagert.';
 paper.append(meta,note);
 const holder=document.createElement('section');holder.className='midi-player';holder.dataset.source='original-midi';
 const heading=document.createElement('div');heading.className='midi-player-heading';
 const title=document.createElement('strong');title.textContent='MIDI-Player · SoundFont';
 const state=document.createElement('span');state.className='midi-player-state';state.textContent='Bereit';
 heading.append(title,state);
 const controls=document.createElement('div');controls.className='midi-player-controls';
 const play=document.createElement('button');play.type='button';play.textContent='▶';play.title='Abspielen';play.setAttribute('aria-label','Abspielen');
 const stop=document.createElement('button');stop.type='button';stop.textContent='■';stop.title='Stopp';stop.setAttribute('aria-label','Stopp');
 const range=document.createElement('input');range.type='range';range.min='0';range.max='1000';range.value='0';range.step='1';range.setAttribute('aria-label','Wiedergabeposition');
 const time=document.createElement('span');time.className='midi-time';
 const actions=document.createElement('div');actions.className='midi-player-actions';
 const midi=document.createElement('button');midi.type='button';midi.textContent='Original-MIDI speichern';
 actions.append(midi);
 let player,playing=false;
 try{
  player=createMidiPlayer(record,{onState:s=>{
   playing=Boolean(s.playing);
   state.textContent=s.loading?'SoundFont wird geladen …':playing?'Wiedergabe':'SoundFont bereit';
   play.textContent=playing?'❚❚':'▶';play.title=playing?'Pause':'Abspielen';play.setAttribute('aria-label',play.title);
   play.disabled=Boolean(s.loading);
   range.value=s.duration?String(Math.round(1000*s.position/s.duration)):'0';
   time.textContent=formatTime(s.position)+' / '+formatTime(s.duration);
  }});
  time.textContent='0:00 / '+formatTime(player.duration);
 }catch(e){note.textContent='SoundFont-Player: '+e.message;state.textContent='Nicht verfügbar';play.disabled=true;stop.disabled=true;range.disabled=true;}
 play.addEventListener('click',async()=>{if(!player)return;try{if(playing)player.pause();else await player.play();}catch(e){state.textContent='Fehler';note.textContent='MIDI-Wiedergabefehler: '+e.message;}});
 stop.addEventListener('click',()=>player?.stop());
 range.addEventListener('input',async()=>{if(!player)return;try{await player.seek(player.duration*Number(range.value)/1000);}catch(e){state.textContent='Fehler';note.textContent='MIDI-Wiedergabefehler: '+e.message;}});
 midi.addEventListener('click',()=>downloadOriginalMidi(record));
 controls.append(play,stop,range,time);holder.append(heading,controls,actions);audio.replaceChildren(holder);if(player)activePlayers.set(audio,player);
}
