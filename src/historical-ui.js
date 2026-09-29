import {originalHistoricalPrompts,runHistoricalComposition,addHistoricalAbcNotation} from './historical-compose.js?v=0.8.2';
import {ABC_NOTATION_INSTRUCTION} from './historical-notation-ai.js?v=0.8.2';
import {createMidiPlayer,downloadOriginalMidi} from './historical-player.js?v=0.8.2';
import {normalizeAbcForAbcjs} from './music-view.js?v=0.8.2';

const $=id=>document.getElementById(id);
const baseEngine=()=>window.CompositionEngine;
const activePlayers=new WeakMap();

export function initHistoricalControls(){
 const select=$('composition-process'),section=$('historical-controls'),reset=$('historical-reset'),
  first=$('historical-first-prompt'),second=$('historical-second-prompt'),
  notationInstruction=$('historical-notation-instruction'),
  notationReset=$('historical-notation-reset'),
  concept=$('historical-concept'),pause=$('historical-pause'),
  proceed=$('historical-proceed'),task=$('task'),additional=$('additional'),
  model=$('model'),provider=$('provider');
 let firstWasEdited=false,secondAwaiter=null;
 if(notationInstruction&&!notationInstruction.value)notationInstruction.value=ABC_NOTATION_INSTRUCTION;
 const initial=()=>{
  const engine=baseEngine();
  if(!engine)return;
  const original=originalHistoricalPrompts(engine,task.value);
  if(!firstWasEdited)first.value=original.musicalDraft;
  if(!secondAwaiter&&!concept.value)second.value='Die vollständige zweite Originalanfrage erscheint hier nach dem ersten KI-Aufruf.\n\n'+original.midiTranslation;
 };
 function refresh(){
  section.hidden=select.value!=='historical';
  if(!section.hidden){
   if(provider.value!=='openai')provider.value='openai';
   provider.dispatchEvent(new Event('change'));
   const known=[...model.options].find(x=>x.value==='gpt-5.6-sol');
   if(known)model.value=known.value;
   model.disabled=true;provider.disabled=true;
   additional.disabled=true;
   additional.title='Im historischen Modus bleiben die ursprünglichen Anweisungen exakt; eigene musikalische Vorgaben gehören in den Kompositionsauftrag.';
   initial();
  }else{
   model.disabled=false;provider.disabled=false;additional.disabled=false;
  }
 }
 select.addEventListener('change',refresh);
 task.addEventListener('input',()=>{if(select.value==='historical'&&!secondAwaiter)initial();});
 first.addEventListener('input',()=>{firstWasEdited=true;});
 reset.addEventListener('click',()=>{firstWasEdited=false;initial();});
 notationReset?.addEventListener('click',()=>{notationInstruction.value=ABC_NOTATION_INSTRUCTION;});
 proceed.addEventListener('click',()=>{
  if(!secondAwaiter)return;
  const resume=secondAwaiter;secondAwaiter=null;proceed.disabled=true;
  resume(second.value);
 });
 initial();refresh();
 function showRecord(record){
  if(record?.mode!=='historical')return;
  select.value='historical';refresh();
  concept.value=record.concept||'';
  const c1=record.historicalCalls?.find(c=>c.stage==='sound_concept');
  const c2=record.historicalCalls?.find(c=>c.stage==='score_realization');
  if(c1?.prompt){first.value=c1.prompt;firstWasEdited=c1.prompt!==originalHistoricalPrompts(baseEngine(),record.userInput).musicalDraft;}
  if(c2?.prompt)second.value=c2.prompt;
  notationInstruction.value=record.historicalNotationInstruction||ABC_NOTATION_INSTRUCTION;
 }
 function abortWait(){if(secondAwaiter){secondAwaiter(null);secondAwaiter=null;proceed.disabled=true;}}
 async function run({apiKey,taskText,onProgress}){
  const engine=baseEngine();
  if(!engine)throw new Error('Historische Engine fehlt. Bitte die App vollständig neu laden.');
  const expected=originalHistoricalPrompts(engine,taskText).musicalDraft;
  if(!firstWasEdited)first.value=expected;
  concept.value='';
  const firstPrompt=first.value===expected?null:first.value;
  secondAwaiter=null;proceed.disabled=true;
  return runHistoricalComposition({
    engine,task:taskText,apiKey,firstPrompt,onProgress,
    notationInstruction:notationInstruction.value,
    onConcept:async({concept:idea,proposal})=>{
      concept.value=idea;second.value=proposal;
      if(!pause.checked)return null;
      onProgress('Klangvorstellung fertig. Zweite Anfrage prüfen und „Komposition fortsetzen“ drücken.');
      return new Promise(resolve=>{secondAwaiter=resolve;proceed.disabled=false;});
    }
  });
 }
 async function notateRecord({record,apiKey,onProgress}){
  return addHistoricalAbcNotation({record,apiKey,instruction:notationInstruction.value,onProgress});
 }
 return {run,notateRecord,showRecord,refresh,abortWait,isHistorical:()=>select.value==='historical'};
}

function formatTime(sec){const s=Math.max(0,Math.round(Number(sec)||0));return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');}
function renderMidiControls(record,audio,note){
 const old=activePlayers.get(audio);old?.stop?.();
 const holder=document.createElement('div');holder.className='midi-player';holder.dataset.source='original-midi';
 const title=document.createElement('strong');title.textContent='MIDI-Player · Original-MIDI';
 const play=document.createElement('button');play.type='button';play.textContent='▶ Abspielen';
 const stop=document.createElement('button');stop.type='button';stop.textContent='■ Stopp';
 const range=document.createElement('input');range.type='range';range.min='0';range.max='1000';range.value='0';range.step='1';range.setAttribute('aria-label','MIDI-Wiedergabeposition');
 const time=document.createElement('span');time.className='midi-time';
 const midi=document.createElement('button');midi.type='button';midi.textContent='Original-MIDI speichern';
 let player;
 try{
  player=createMidiPlayer(record,{onState:s=>{
   play.textContent=s.playing?'❚❚ Pause':'▶ Abspielen';
   range.value=s.duration?String(Math.round(1000*s.position/s.duration)):'0';
   time.textContent=formatTime(s.position)+' / '+formatTime(s.duration);
  }});
  time.textContent='0:00 / '+formatTime(player.duration);
 }catch(e){note.textContent='MIDI-Player: '+e.message;play.disabled=true;stop.disabled=true;range.disabled=true;}
 play.addEventListener('click',async()=>{if(!player)return;try{if(play.textContent.includes('Pause'))player.pause();else await player.play();}catch(e){note.textContent='MIDI-Wiedergabefehler: '+e.message;}});
 stop.addEventListener('click',()=>player?.stop());
 range.addEventListener('input',async()=>{if(!player)return;await player.seek(player.duration*Number(range.value)/1000);});
 midi.addEventListener('click',()=>downloadOriginalMidi(record));
 holder.append(title,play,stop,range,time,midi);audio.replaceChildren(holder);
 if(player)activePlayers.set(audio,player);
}

function renderHistoricalNotation(record,paper){
 if(!record?.historicalAbc?.trim())return false;
 const abc=normalizeAbcForAbcjs(record.historicalAbc);
 if(!window.ABCJS?.renderAbc)throw new Error('ABC-Notenmodul nicht geladen.');
 const visual=window.ABCJS.renderAbc(paper,abc,{responsive:'resize',add_classes:true});
 if(!visual?.[0])throw new Error('KI-ABC konnte nicht dargestellt werden.');
 const source=document.createElement('small');source.className='notation-source';
 source.textContent='Notenansicht: dritter KI-Aufruf JSON → ABC. Die Wiedergabe bleibt unabhängig davon beim Original-MIDI.';
 paper.append(source);
 return true;
}

export function renderHistoricalScore({record,paper,audio,onRequestNotation=null}){
 const score=record?.historicalScore;
 activePlayers.get(audio)?.stop?.();activePlayers.delete(audio);
 paper.replaceChildren();audio.replaceChildren();
 if(!score)return;
 const heading=document.createElement('div');heading.className='historical-score-heading';
 const title=document.createElement('h3');title.textContent=score.title||'Ohne Titel';
 const description=document.createElement('p');
 description.textContent=`${record.bars||'?'} Takte · ${score.bpm||'?'} BPM · ${score.tracks?.length||0} Originalspuren`;
 const note=document.createElement('p');note.className='historical-score-note';
 note.textContent='Die Komposition und Wiedergabe beruhen auf dem Original-MIDI. ABC ist nur eine nachgelagerte Notationsfassung.';
 heading.append(title,description,note);paper.append(heading);
 let rendered=false;
 try{rendered=renderHistoricalNotation(record,paper);}catch(e){
  const warning=document.createElement('div');warning.className='notation-warning';warning.textContent='Notenansicht: '+e.message;paper.append(warning);
 }
 if(!rendered){
  const info=document.createElement('p');info.className='notation-warning';
  info.textContent=record.notationError?'KI-Notation fehlgeschlagen: '+record.notationError:'Für dieses Stück liegt noch keine KI-ABC-Notation vor.';
  paper.append(info);
  if(onRequestNotation){
   const btn=document.createElement('button');btn.type='button';btn.className='historical-notate-button';btn.textContent='ABC durch KI erzeugen';
   btn.addEventListener('click',()=>onRequestNotation(record,btn));
   paper.append(btn);
  }
 }
 renderMidiControls(record,audio,note);
}
