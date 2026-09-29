// The original MIDI score remains canonical. This is only a preview player.
export function createHistoricalPlayer(){
 let active=null;
 function stop(){
  if(!active)return;
  const old=active;active=null;
  for(const osc of old.oscillators)try{osc.stop()}catch{}
  old.ctx.close().catch(()=>{});
 }
 async function play(score){
  stop();
  if(!score?.tracks?.length)throw new Error('Keine historische Komposition geladen.');
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx)throw new Error('Audiowiedergabe in diesem Browser nicht verfügbar.');
  const ctx=new Ctx(),spb=60/(Number(score.bpm)||120),t0=ctx.currentTime+.05,oscillators=[];
  await ctx.resume();
  for(const [ti,tr] of score.tracks.entries())for(const n of tr.notes||[]){
   if(!Array.isArray(n)||n.length<4)continue;
   const start=t0+Number(n[0])*spb,dur=Math.max(.03,Number(n[1])*spb);
   const freq=440*Math.pow(2,(Number(n[2])-69)/12),vel=Math.max(.02,Math.min(1,Number(n[3])/127));
   const o=ctx.createOscillator(),g=ctx.createGain();
   o.type=ti%3===1?'triangle':'sine';o.frequency.value=freq;
   g.gain.setValueAtTime(.0001,start);
   g.gain.exponentialRampToValueAtTime(.13*vel,start+.015);
   g.gain.setValueAtTime(.13*vel,Math.max(start+.02,start+dur-.05));
   g.gain.exponentialRampToValueAtTime(.0001,start+dur);
   o.connect(g).connect(ctx.destination);o.start(start);o.stop(start+dur+.02);
   oscillators.push(o);
  }
  active={ctx,oscillators};
 }
 return {play,stop};
}

export function downloadOriginalMidi(record){
 if(!Array.isArray(record?.historicalMidi))throw new Error('Keine originale MIDI-Datei vorhanden.');
 const midi=Uint8Array.from(record.historicalMidi);
 if(String.fromCharCode(...midi.subarray(0,4))!=='MThd')throw new Error('Ungültige MIDI-Daten.');
 const name=String(record.title||'Komposition').normalize('NFKD')
  .replace(/[^A-Za-z0-9_-]/g,'_').replace(/_+/g,'_').slice(0,65)||'Komposition';
 const url=URL.createObjectURL(new Blob([midi],{type:'audio/midi'}));
 const link=document.createElement('a');link.href=url;link.download=name+'.mid';
 document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
