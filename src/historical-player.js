// MIDI player whose ONLY musical source is the original MIDI byte stream.
// Audio uses WebAudioFont SoundFont presets; timing, pitches, velocities, programs and channels
// are read from the original MIDI file rather than reconstructed from ABC.
function readU16(b,o){return (b[o]<<8)|b[o+1];}
function readU32(b,o){return ((b[o]<<24)>>>0)|(b[o+1]<<16)|(b[o+2]<<8)|b[o+3];}
function readVlq(b,o){let v=0,i=o,x;do{if(i>=b.length)throw Error('Defekte MIDI-VLQ.');x=b[i++];v=(v<<7)|(x&127);}while(x&128);return [v,i];}
function ascii(b,o,n){return String.fromCharCode(...b.slice(o,o+n));}
export function parseMidi(bytes){
 const b=bytes instanceof Uint8Array?bytes:Uint8Array.from(bytes||[]);
 if(b.length<14||ascii(b,0,4)!=='MThd')throw Error('Ungültige MIDI-Datei.');
 const hlen=readU32(b,4),format=readU16(b,8),ntrks=readU16(b,10),division=readU16(b,12);
 if(division&0x8000)throw Error('SMPTE-MIDI wird noch nicht unterstützt.');
 const ppq=division;let off=8+hlen,events=[],programs=new Array(16).fill(0),trackNames=[];
 for(let ti=0;ti<ntrks;ti++){
  if(ascii(b,off,4)!=='MTrk')throw Error('MIDI-Track fehlt.');
  const len=readU32(b,off+4),end=off+8+len;let p=off+8,tick=0,running=null;
  while(p<end){
   let d;[d,p]=readVlq(b,p);tick+=d;
   let status=b[p++];if(status<0x80){if(running==null)throw Error('Ungültiger Running Status.');p--;status=running;}else if(status<0xF0)running=status;
   if(status===0xFF){
    const type=b[p++];let l;[l,p]=readVlq(b,p);const data=b.slice(p,p+l);p+=l;
    if(type===0x51&&l===3)events.push({tick,type:'tempo',mpqn:(data[0]<<16)|(data[1]<<8)|data[2]});
    if(type===0x03)trackNames[ti]=new TextDecoder().decode(data);
    continue;
   }
   if(status===0xF0||status===0xF7){let l;[l,p]=readVlq(b,p);p+=l;continue;}
   const kind=status&0xF0,ch=status&15;
   if(kind===0xC0||kind===0xD0){
    const a=b[p++];if(kind===0xC0){programs[ch]=a;events.push({tick,type:'program',channel:ch,program:a});}
    continue;
   }
   const a=b[p++],c=b[p++];
   if(kind===0x90)events.push({tick,type:c===0?'off':'on',channel:ch,pitch:a,velocity:c,track:ti});
   else if(kind===0x80)events.push({tick,type:'off',channel:ch,pitch:a,velocity:c,track:ti});
  }
  off=end;
 }
 events.sort((a,b)=>a.tick-b.tick||order(a)-order(b));
 const tempos=events.filter(e=>e.type==='tempo');if(!tempos.length||tempos[0].tick!==0)tempos.unshift({tick:0,type:'tempo',mpqn:500000});
 let lastTick=0,lastSec=0,lastMpqn=tempos[0].mpqn;const tempoPoints=[{tick:0,seconds:0,mpqn:lastMpqn}];
 for(const t of tempos){
  if(t.tick===0){lastMpqn=t.mpqn;tempoPoints[0].mpqn=t.mpqn;continue;}
  lastSec+=(t.tick-lastTick)*lastMpqn/(1e6*ppq);lastTick=t.tick;lastMpqn=t.mpqn;tempoPoints.push({tick:t.tick,seconds:lastSec,mpqn:lastMpqn});
 }
 const tickToSec=tick=>{
  let point=tempoPoints[0];for(const p of tempoPoints){if(p.tick>tick)break;point=p;}
  return point.seconds+(tick-point.tick)*point.mpqn/(1e6*ppq);
 };
 const currentPrograms=new Array(16).fill(0),active=new Map(),notes=[];let duration=0;
 for(const e of events){
  if(e.type==='program'){currentPrograms[e.channel]=e.program;continue;}
  if(e.type==='on'){
   const key=e.track+'|'+e.channel+'|'+e.pitch;
   const stack=active.get(key)||[];stack.push({...e,program:currentPrograms[e.channel],startSec:tickToSec(e.tick)});active.set(key,stack);
  }else if(e.type==='off'){
   const key=e.track+'|'+e.channel+'|'+e.pitch,stack=active.get(key);if(!stack?.length)continue;
   const on=stack.shift(),endSec=tickToSec(e.tick);notes.push({start:on.startSec,end:Math.max(on.startSec+.01,endSec),pitch:on.pitch,velocity:on.velocity,channel:on.channel,program:on.program,track:on.track});
   duration=Math.max(duration,endSec);
  }
 }
 return {format,ppq,notes,duration,trackNames,tempoPoints};
}
function order(e){return e.type==='tempo'?0:e.type==='program'?1:e.type==='off'?2:3;}
function waitForLoader(player){
 return new Promise((resolve,reject)=>{
  let done=false;
  const timer=setTimeout(()=>{if(!done){done=true;reject(new Error('SoundFont-Laden hat zu lange gedauert.'));}},30000);
  try{
   player.loader.waitLoad(()=>{if(done)return;done=true;clearTimeout(timer);resolve();});
  }catch(err){clearTimeout(timer);reject(err);}
 });
}
async function loadSoundFonts(ctx,parsed,player){
 const melodic=[...new Set(parsed.notes.filter(n=>n.channel!==9).map(n=>n.program))];
 const drums=[...new Set(parsed.notes.filter(n=>n.channel===9).map(n=>n.pitch))];
 const presets=new Map(),drumPresets=new Map();
 for(const program of melodic){
  const id=player.loader.findInstrument(program);
  const info=player.loader.instrumentInfo(id);
  if(!info)throw new Error('Kein SoundFont-Instrument für GM-Programm '+program+'.');
  player.loader.startLoad(ctx,info.url,info.variable);
  presets.set(program,info);
 }
 for(const pitch of drums){
  const id=player.loader.findDrum(pitch);
  const info=player.loader.drumInfo(id);
  if(!info)continue;
  player.loader.startLoad(ctx,info.url,info.variable);
  drumPresets.set(pitch,info);
 }
 await waitForLoader(player);
 for(const info of presets.values())if(!window[info.variable])throw new Error('SoundFont konnte nicht geladen werden: '+info.title);
 return {presets,drumPresets};
}
function scheduleSoundFontNote(player,ctx,dest,n,start,end,presets,drumPresets){
 const duration=Math.max(.03,end-start),volume=Math.max(.02,Math.min(.95,n.velocity/127*.8));
 if(n.channel===9){
  const info=drumPresets.get(n.pitch);if(!info||!window[info.variable])return;
  player.queueWaveTable(ctx,dest,window[info.variable],start,n.pitch,duration,volume);
  return;
 }
 const info=presets.get(n.program);
 if(!info||!window[info.variable])throw new Error('SoundFont-Preset fehlt für GM-Programm '+n.program+'.');
 player.queueWaveTable(ctx,dest,window[info.variable],start,n.pitch,duration,volume);
}
export function createMidiPlayer(record,{onState=()=>{}}={}){
 const midi=Uint8Array.from(record?.historicalMidi||[]),parsed=parseMidi(midi);
 let ctx=null,soundfont=null,position=0,startedAt=0,raf=0,playing=false,loading=false,presets=null,drumPresets=null;
 const Ctx=()=>window.AudioContext||window.webkitAudioContext;
 const current=()=>playing?Math.min(parsed.duration,position+(ctx.currentTime-startedAt)):position;
 function cancelAudio(){
  cancelAnimationFrame(raf);raf=0;
  try{if(soundfont&&ctx)soundfont.cancelQueue(ctx);}catch{}
  if(ctx){ctx.close().catch(()=>{});ctx=null;}
  soundfont=null;presets=null;drumPresets=null;loading=false;
 }
 function tick(){if(!playing)return;const now=current();onState({playing,loading:false,position:now,duration:parsed.duration,engine:'soundfont'});if(now>=parsed.duration-.01){playing=false;position=0;cancelAudio();onState({playing,loading:false,position,duration:parsed.duration,engine:'soundfont'});return;}raf=requestAnimationFrame(tick);}
 async function play(){
  if(playing||loading)return;
  const Klass=Ctx();if(!Klass)throw Error('AudioContext ist nicht verfügbar.');
  if(typeof window.WebAudioFontPlayer!=='function')throw Error('SoundFont-Engine wurde nicht geladen.');
  ctx=new Klass();await ctx.resume();soundfont=new window.WebAudioFontPlayer();loading=true;
  onState({playing:false,loading:true,position,duration:parsed.duration,engine:'soundfont'});
  try{
   ({presets,drumPresets}=await loadSoundFonts(ctx,parsed,soundfont));
  }catch(err){cancelAudio();onState({playing:false,loading:false,position,duration:parsed.duration,engine:'soundfont'});throw err;}
  loading=false;playing=true;startedAt=ctx.currentTime;
  const t0=ctx.currentTime+.06;
  for(const n of parsed.notes){
   if(n.end<=position)continue;
   const start=t0+Math.max(0,n.start-position),end=t0+Math.max(.03,n.end-position);
   scheduleSoundFontNote(soundfont,ctx,ctx.destination,n,start,end,presets,drumPresets);
  }
  onState({playing,loading:false,position,duration:parsed.duration,engine:'soundfont'});raf=requestAnimationFrame(tick);
 }
 function pause(){if(!playing&&!loading)return;position=playing?current():position;playing=false;cancelAudio();onState({playing:false,loading:false,position,duration:parsed.duration,engine:'soundfont'});}
 function stop(){playing=false;position=0;cancelAudio();onState({playing:false,loading:false,position,duration:parsed.duration,engine:'soundfont'});}
 async function seek(seconds){
  const was=playing;if(was)pause();position=Math.max(0,Math.min(parsed.duration,Number(seconds)||0));onState({playing:false,loading:false,position,duration:parsed.duration,engine:'soundfont'});if(was)await play();
 }
 return {play,pause,stop,seek,get position(){return current();},get duration(){return parsed.duration;},parsed,engine:'soundfont'};
}
export function downloadOriginalMidi(record){
 if(!Array.isArray(record?.historicalMidi))throw new Error('Keine originale MIDI-Datei vorhanden.');
 const midi=Uint8Array.from(record.historicalMidi);
 if(String.fromCharCode(...midi.subarray(0,4))!=='MThd')throw new Error('Ungültige MIDI-Daten.');
 const name=String(record.title||'Komposition').normalize('NFKD').replace(/[^A-Za-z0-9_-]/g,'_').replace(/_+/g,'_').slice(0,65)||'Komposition';
 const url=URL.createObjectURL(new Blob([midi],{type:'audio/midi'})),link=document.createElement('a');
 link.href=url;link.download=name+'.mid';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
}
