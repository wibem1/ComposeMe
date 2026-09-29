// Technical recovery only. Never alters pitches, durations, velocities, or the historical prompts.
// Retain the ORIGINAL model response verbatim in the communication protocol.
export function recoverSingleClosingBracket(original) {
  if (typeof original !== 'string' || !original.trim()) throw new TypeError('Leere Partitur.');
  try { JSON.parse(original); return {text:original,repaired:false,explanation:''}; }
  catch(originalError) {
    const trimmed=original.trimEnd();
    if (!trimmed.endsWith(']}' ) || !trimmed.startsWith('{')) throw originalError;
    // Only one exact missing terminal closing square bracket, nothing else.
    const candidate=trimmed.slice(0,-1)+']'+trimmed.slice(-1);
    let score;
    try { score=JSON.parse(candidate); } catch { throw originalError; }
    if (!score || typeof score!=='object' || !Array.isArray(score.v) || !Array.isArray(score.m) || !Number.isFinite(score.b)) throw originalError;
    if(!score.v.every(track=>Array.isArray(track)&&track.length>=4&&Array.isArray(track[3])&&track[3].every(note=>Array.isArray(note)&&note.length>=5))) throw originalError;
    return {text:candidate,repaired:true,explanation:'Eine fehlende schließende eckige Klammer unmittelbar vor dem letzten } ergänzt; keine Noten verändert.'};
  }
}
