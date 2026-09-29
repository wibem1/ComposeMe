import {originalHistoricalPrompts,runHistoricalComposition} from './historical-compose.js';
import {createHistoricalPlayer,downloadOriginalMidi} from './historical-player.js';

const $=id=>document.getElementById(id);
const baseEngine=()=>window.CompositionEngine;

export function initHistoricalControls(){
 const select=$('composition-process'),section=$('historical-controls'),reset=$('historical-reset'),
  first=$('historical-first-prompt'),second=$('historical-second-prompt'),
  concept=$('historical-concept'),pause=$('historical-pause'),
  proceed=$('historical-proceed'),task=$('task'),additional=$('additional'),
  model=$('model'),provider=$('provider');
 let firstWasEdited=false,secondAwaiter=null;
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
 }
 function abortWait(){
  if(secondAwaiter){
   // Do not silently send an edited stage-2 prompt after navigation.
   secondAwaiter(null);secondAwaiter=null;proceed.disabled=true;
  }
 }
 async function run({apiKey,taskText,onProgress}){
  const engine=baseEngine();
  if(!engine)throw new Error('Historische Engine fehlt. Bitte die App vollständig neu laden.');
  const expected=originalHistoricalPrompts(engine,taskText).musicalDraft;
  if(!firstWasEdited)first.value=expected;
  concept.value='';
  const firstPrompt=first.value===expected?null:first.value;
  secondAwaiter=null;proceed.disabled=true;
  return runHistoricalComposition({
    engine,task:taskText,apiKey,firstPrompt,
    onProgress,
    onConcept:async({concept:idea,proposal})=>{
      concept.value=idea;
      second.value=proposal;
      if(!pause.checked)return null; // Exact historical auto mode: no prompt change.
      onProgress('Klangvorstellung fertig. Zweite Anfrage prüfen und „Komposition fortsetzen“ drücken.');
      return new Promise(resolve=>{secondAwaiter=resolve;proceed.disabled=false;});
    }
  });
 }
 return {run,showRecord,refresh,abortWait,isHistorical:()=>select.value==='historical'};
}
export function renderHistoricalScore({record,paper,audio}){
 const score=record?.historicalScore;
 paper.replaceChildren();audio.replaceChildren();
 if(!score)return;
 const title=document.createElement('h3');title.textContent=score.title||'Ohne Titel';
 const description=document.createElement('p');
 description.textContent=`${record.bars||'?'} Takte · ${score.bpm||'?'} BPM · ${score.tracks?.length||0} Spuren · Originale MIDI-Partitur`;
 const note=document.createElement('p');
 note.textContent='Die originale MIDI-Datei bleibt unverändert. Für eine hochwertige Klavierwiedergabe bitte MIDI exportieren und in einer DAW abspielen. Das ABC-Notenmodul verarbeitet diese Partitur noch nicht verlustfrei.';
 paper.append(title,description,note);
 const player=createHistoricalPlayer();
 const play=document.createElement('button');play.type='button';play.textContent='Anhören';
 const stop=document.createElement('button');stop.type='button';stop.textContent='Stopp';
 const midi=document.createElement('button');midi.type='button';midi.textContent='Original-MIDI speichern';
 play.addEventListener('click',async()=>{try{await player.play(score);}catch(e){note.textContent='Wiedergabefehler: '+e.message;}});
 stop.addEventListener('click',()=>player.stop());
 midi.addEventListener('click',()=>downloadOriginalMidi(record));
 audio.classList.add('historical-midi-controls');audio.append(play,stop,midi);
}
