// Display-only quantization for notation export.
// Playback MIDI and the stored composition remain untouched.
export const DISPLAY_GRID=0.25; // quarter of a beat = sixteenth-note grid in quarter-note beat units
export const NOTATION_VALUES=[4,3,2,1.5,1,0.75,0.5,0.25];

function snap(value,grid=DISPLAY_GRID){
 const n=Number(value);
 return Math.round((Number.isFinite(n)?n:0)/grid)*grid;
}

export function quantizeDisplaySpan(start,duration,grid=DISPLAY_GRID){
 const rawStart=Math.max(0,Number(start)||0);
 const rawDuration=Math.max(grid,Number(duration)||grid);
 const qStart=Math.max(0,snap(rawStart,grid));
 let qEnd=Math.max(qStart+grid,snap(rawStart+rawDuration,grid));
 if(qEnd<=qStart)qEnd=qStart+grid;
 return {start:Number(qStart.toFixed(8)),duration:Number((qEnd-qStart).toFixed(8))};
}

export function notationPieces(duration){
 let rest=Math.max(DISPLAY_GRID,Number(duration)||DISPLAY_GRID);
 const pieces=[];
 for(const value of NOTATION_VALUES){
  while(rest>=value-1e-8){
   pieces.push(value);
   rest=Number((rest-value).toFixed(8));
  }
 }
 if(rest>1e-8){
  const units=Math.max(1,Math.round(rest/DISPLAY_GRID));
  for(let i=0;i<units;i++)pieces.push(DISPLAY_GRID);
 }
 return pieces;
}
