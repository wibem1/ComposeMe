// Display-only quantization for notation export.
// Playback MIDI and the stored composition remain untouched.
export const DISPLAY_GRID=0.25; // sixteenth-note onset grid in quarter-note beat units

// Conventional readable note lengths: undotted and singly dotted values.
// Deliberately excludes double-dotted values such as 1.75 or 3.5 beats.
export const DISPLAY_DURATIONS=[0.25,0.375,0.5,0.75,1,1.5,2,3,4,6,8,12,16];

function snap(value,grid=DISPLAY_GRID){
 const n=Number(value);
 return Math.round((Number.isFinite(n)?n:0)/grid)*grid;
}

function nearestDuration(value){
 const raw=Math.max(DISPLAY_GRID,Number(value)||DISPLAY_GRID);
 let best=DISPLAY_DURATIONS[0],distance=Math.abs(raw-best);
 for(const candidate of DISPLAY_DURATIONS){
  const d=Math.abs(raw-candidate);
  if(d<distance-1e-8||(Math.abs(d-distance)<1e-8&&candidate>best)){
   best=candidate;distance=d;
  }
 }
 if(raw>DISPLAY_DURATIONS.at(-1))return Math.max(DISPLAY_GRID,snap(raw));
 return best;
}

export function quantizeDisplaySpan(start,duration,grid=DISPLAY_GRID){
 const rawStart=Math.max(0,Number(start)||0);
 const qStart=Math.max(0,snap(rawStart,grid));
 const qDuration=nearestDuration(duration);
 return {start:Number(qStart.toFixed(8)),duration:Number(qDuration.toFixed(8))};
}
