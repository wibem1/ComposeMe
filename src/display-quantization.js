// Display-only quantization for notation export.
// Playback MIDI and the stored composition remain untouched.
// The display copy uses an eighth-note grid (0.5 quarter-note beats), similar
// to DAW display quantization: free performance timing stays in the original,
// while notation is aligned to readable metric positions.
export const DISPLAY_GRID=0.5;

function snap(value,grid=DISPLAY_GRID){
 const n=Number(value);
 return Math.round((Number.isFinite(n)?n:0)/grid)*grid;
}

export function quantizeDisplaySpan(start,duration,grid=DISPLAY_GRID){
 const rawStart=Math.max(0,Number(start)||0);
 const rawDuration=Math.max(grid,Number(duration)||grid);
 const rawEnd=rawStart+rawDuration;
 const qStart=Math.max(0,snap(rawStart,grid));
 const qEnd=Math.max(qStart+grid,snap(rawEnd,grid));
 return {
  start:Number(qStart.toFixed(8)),
  duration:Number((qEnd-qStart).toFixed(8))
 };
}
