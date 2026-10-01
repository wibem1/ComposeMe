import {quantizeDisplaySpan} from './display-quantization.js';

export function displayQuantizedScore(score){
 if(!score||!Array.isArray(score.tracks))throw new Error('Partitur fehlt.');
 return {
  ...score,
  tracks:score.tracks.map(track=>({
   ...track,
   notes:(track.notes||[]).map(note=>{
    if(!Array.isArray(note)||note.length<4)return note;
    const q=quantizeDisplaySpan(note[0],note[1]);
    return [q.start,q.duration,...note.slice(2)];
   }),
   cc:Array.isArray(track.cc)?track.cc.map(event=>Array.isArray(event)?[...event]:event):track.cc
  }))
 };
}

export function buildDisplayMidi(score,buildMidi){
 if(typeof buildMidi!=='function')throw new Error('MIDI-Builder fehlt.');
 return buildMidi(displayQuantizedScore(score));
}
