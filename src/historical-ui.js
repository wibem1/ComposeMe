import {originalHistoricalPrompts,runHistoricalComposition} from './historical-compose.js?v=0.8.10';
import {createMidiPlayer,downloadOriginalMidi} from './historical-player.js?v=0.8.10';

const $=id=>document.getElementById(id);
const baseEngine=()=>window.CompositionEngine;
const activePlayers=new WeakMap();

export function initHistoricalControls(){
 const select=$('composition-process'),section=$('historical-controls'),reset=$('historical-reset'),
  first=$('historical-first-prompt'),second=$('historical-second-prompt'),
  concept=$('historical-concept'),pause=$('historical-pause'),
  proceed=$('historical-proceed'),task=$('task'),additional=$('additional'),
  model=$('model'),provider=$('provider');
 let firstWasEdited=false,secondAwaiter=null;
 const initial=()=>{
  const engine=baseEngine();if(!engine)return;
  const original=originalHistoricalPrompts(engine,task.value);
  if(!firstWasEdited)first.value=original.musicalDraft;
  if(!secondAwaiter&&!concept.value)second.value='Die vollständige zweite Originalanfrage erscheint hier nach dem ersten KI-Aufruf.\n\n'+original.midiTranslation;
 };
 function refresh(){
  section.hidden=select.value!=='historical';
  model.disabled=false;provider.disabled=false;
  additional.disabled=!section.hidden;
  if(!section.hidden)initial();
 }
 select.addEventListener('change',refresh);
 task.addEventListener('input',()=>{if(select.value==='historical'&&!secondAwaiter)initial();});
 first.addEventListener('input',()=>{firstWasEdited=true;});
 reset.addEventListener('click',()=>{firstWasEdited=false;initial();});
 proceed.addEventListener('click',()=>{if(!secondAwaiter)return;const resume=secondAwaiter;secondAwaiter=null;proceed.disabled=true;resume(second.value);});
 initial();refresh();
 function showRecord(record){
  if(record?.mode!=='historical')return;
  select.value='historical';refresh();concept.value=record.concept||'';
  const c1=record.historicalCalls?.find(c=>c.stage==='sound_concept');
  const c2=record.historicalCalls?.find(c=>c.stage==='score_realization');
  if(c1?.prompt){first.value=c1.prompt;firstWasEdited=c1.prompt!==originalHistoricalPrompts(baseEngine(),record.userInput).musicalDraft;}
  if(c2?.prompt)second.value=c2.prompt;
 }
 function abortWait(){if(secondAwaiter){secondAwaiter(null);secondAwaiter=null;proceed.disabled=true;}}
 async function run({apiKey,taskText,providerName,modelName,onProgress}){
  const engine=baseEngine();if(!engine)throw new Error('Historische Engine fehlt. Bitte die App vollständig neu laden.');
  const expected=originalHistoricalPrompts(engine,taskText).musicalDraft;
  if(!firstWasEdited)first.value=expected;concept.value='';
  const firstPrompt=first.value===expected?null:first.value;
  secondAwaiter=null;proceed.disabled=true;
  return runHistoricalComposition({
   engine,task:taskText,provider:providerName,model:modelName,apiKey,firstPrompt,onProgress,
   onConcept:async({concept:idea,proposal})=>{
    concept.value=idea;second.value=proposal;
    if(!pause.checked)return null;
    onProgress('Klangvorstellung fertig. Zweite Anfrage prüfen und „Komposition fortsetzen“ drücken.');
    return new Promise(resolve=>{secondAwaiter=resolve;proceed.disabled=false;});
   }
  });
 }
 return {run,showRecord,refresh,abortWait,isHistorical:()=>select.value==='historical'};
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
 const holder=document.createElement('div');holder.className='midi-player';holder.dataset.source='original-midi';
 const title=document.createElement('strong');title.textContent='SoundFont-Player · Original-MIDI';
 const play=document.createElement('button');play.type='button';play.textContent='▶ Abspielen';
 const stop=document.createElement('button');stop.type='button';stop.textContent='■ Stopp';
 const range=document.createElement('input');range.type='range';range.min='0';range.max='1000';range.value='0';range.step='1';
 const time=document.createElement('span');time.className='midi-time';
 const midi=document.createElement('button');midi.type='button';midi.textContent='Original-MIDI speichern';
 let player;
 try{
  player=createMidiPlayer(record,{onState:s=>{play.textContent=s.loading?'Klang wird geladen …':s.playing?'❚❚ Pause':'▶ Abspielen';play.disabled=Boolean(s.loading);range.value=s.duration?String(Math.round(1000*s.position/s.duration)):'0';time.textContent=formatTime(s.position)+' / '+formatTime(s.duration);}});
  time.textContent='0:00 / '+formatTime(player.duration);
 }catch(e){note.textContent='SoundFont-Player: '+e.message;play.disabled=true;stop.disabled=true;range.disabled=true;}
 play.addEventListener('click',async()=>{if(!player)return;try{if(play.textContent.includes('Pause'))player.pause();else await player.play();}catch(e){note.textContent='MIDI-Wiedergabefehler: '+e.message;}});
 stop.addEventListener('click',()=>player?.stop());
 range.addEventListener('input',async()=>{if(!player)return;await player.seek(player.duration*Number(range.value)/1000);});
 midi.addEventListener('click',()=>downloadOriginalMidi(record));
 holder.append(title,play,stop,range,time,midi);audio.replaceChildren(holder);if(player)activePlayers.set(audio,player);
}
