import {quantizeDisplaySpan} from './display-quantization.js';

function quantizedNotes(track){
 return (track.notes||[]).filter(note=>Array.isArray(note)&&note.length>=4).map(note=>{
  const q=quantizeDisplaySpan(note[0],note[1]);
  return [q.start,q.duration,...note.slice(2)];
 });
}

function groupChordEvents(notes){
 const groups=[];
 for(const note of [...notes].sort((a,b)=>a[0]-b[0]||a[1]-b[1]||a[2]-b[2])){
  const start=Number(note[0])||0,end=start+(Number(note[1])||0);
  let group=groups.find(g=>Math.abs(g.start-start)<1e-8&&Math.abs(g.end-end)<1e-8);
  if(!group){group={start,end,notes:[]};groups.push(group);}
  group.notes.push(note);
 }
 return groups.sort((a,b)=>a.start-b.start||a.end-b.end);
}

export function splitNotationVoices(track){
 const notes=quantizedNotes(track);
 if(!notes.length)return [{...track,notes:[],cc:Array.isArray(track.cc)?track.cc.map(e=>Array.isArray(e)?[...e]:e):track.cc}];

 const voices=[];
 for(const group of groupChordEvents(notes)){
  let target=-1,bestEnd=-Infinity;
  for(let i=0;i<voices.length;i++){
   if(voices[i].end<=group.start+1e-8&&voices[i].end>bestEnd){target=i;bestEnd=voices[i].end;}
  }
  if(target<0){target=voices.length;voices.push({end:0,notes:[]});}
  voices[target].notes.push(...group.notes);
  voices[target].end=Math.max(voices[target].end,group.end);
 }

 if(voices.length===1)return [{...track,notes:voices[0].notes,cc:Array.isArray(track.cc)?track.cc.map(e=>Array.isArray(e)?[...e]:e):track.cc}];

 const meanPitch=voice=>{
  const pitches=voice.notes.map(n=>Number(n[2])).filter(Number.isFinite);
  return pitches.length?pitches.reduce((a,b)=>a+b,0)/pitches.length:0;
 };
 const ordered=[...voices].sort((a,b)=>meanPitch(b)-meanPitch(a));
 const piano=/klavier|piano/i.test(String(track.name||''));
 return ordered.map((voice,index)=>({
  ...track,
  name:piano&&ordered.length===2
   ?`${track.name||'Klavier'} :: ${index===0?'rechte Hand':'linke Hand'}`
   :`${track.name||'Instrument'} :: Stimme ${index+1}`,
  notes:voice.notes,
  // CC is notation-irrelevant; keep it only once to avoid duplicate controller events.
  cc:index===0&&Array.isArray(track.cc)?track.cc.map(e=>Array.isArray(e)?[...e]:e):[]
 }));
}

export function displayQuantizedScore(score){
 if(!score||!Array.isArray(score.tracks))throw new Error('Partitur fehlt.');
 return {
  ...score,
  tracks:score.tracks.flatMap(track=>splitNotationVoices(track))
 };
}

export function buildDisplayMidi(score,buildMidi){
 if(typeof buildMidi!=='function')throw new Error('MIDI-Builder fehlt.');
 return buildMidi(displayQuantizedScore(score));
}
