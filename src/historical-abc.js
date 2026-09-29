// Purely technical notation projection of the canonical historical JSON score.
// It does not add, remove, transpose or otherwise musically alter notes.
function gcd(a,b){a=Math.abs(a);b=Math.abs(b);while(b){const t=a%b;a=b;b=t;}return a||1;}
function rational(x,maxDen=64){
 const n=Number(x);if(!Number.isFinite(n))return [0,1];
 let bestN=Math.round(n),bestD=1,bestErr=Math.abs(n-bestN);
 for(let d=2;d<=maxDen;d++){const p=Math.round(n*d),e=Math.abs(n-p/d);if(e<bestErr-1e-9){bestN=p;bestD=d;bestErr=e;}}
 const g=gcd(bestN,bestD);return [bestN/g,bestD/g];
}
function lengthSuffix(beats){
 // L:1/16 => one ABC unit = 1/4 of a quarter-note beat.
 const [n,d]=rational(Number(beats)*4,128);
 if(n===1&&d===1)return '';
 if(d===1)return String(n);
 if(n===1)return '/'+d;
 return n+'/'+d;
}
function safeId(name,fallback){
 const base=String(name||fallback).normalize('NFKD').replace(/[^A-Za-z0-9]/g,'').slice(0,12);
 return base||fallback;
}
function pitchFromMidi(midi){
 const pcs=['C','^C','D','^D','E','F','^F','G','^G','A','^A','B'];
 const p=Math.max(0,Math.min(127,Math.round(Number(midi)||60))),pc=pcs[p%12],oct=Math.floor(p/12)-1;
 return pitchToAbc(pc.replace('^','#')+oct,p);
}
function pitchToAbc(noteName,midi){
 const m=/^([A-Ga-g])([#b]?)(-?\d+)$/.exec(String(noteName||'').trim());
 if(!m)return pitchFromMidiFallback(midi);
 const letter=m[1].toUpperCase(),acc=m[2],oct=Number(m[3]);
 let core=(acc==='#'?'^':acc==='b'?'_':'=')+letter;
 if(oct>=5){core=core.slice(0,-1)+letter.toLowerCase();for(let i=5;i<oct;i++)core+="'";}
 else if(oct<4){for(let i=oct;i<4;i++)core+=',';}
 return core;
}
function pitchFromMidiFallback(midi){
 const p=Math.max(0,Math.min(127,Math.round(Number(midi)||60)));
 const names=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
 return pitchToAbc(names[p%12]+(Math.floor(p/12)-1),p);
}
function noteToken(event,dur,tied){
 const suffix=lengthSuffix(dur);
 const pitches=event.notes.map(n=>pitchToAbc(n[4],n[2]));
 const core=pitches.length===1?pitches[0]:'['+pitches.join('')+']';
 return core+suffix+(tied?'-':'');
}
function restToken(dur){return 'z'+lengthSuffix(dur);}
function beatsPerBar(score){
 const m=Array.isArray(score?.timeSignature)?score.timeSignature:[4,4];
 return (Number(m[0])||4)*(4/(Number(m[1])||4));
}
function totalBars(score){
 const bpb=beatsPerBar(score);let end=0;
 for(const tr of score?.tracks||[])for(const n of tr.notes||[])if(Array.isArray(n))end=Math.max(end,Number(n[0]||0)+Number(n[1]||0));
 return Math.max(1,Math.ceil(end/bpb-1e-9));
}
function splitPianoTrack(track){
 if(!/piano|klavier/i.test(String(track?.name||'')))return [{...track,staff:'single'}];
 const hi={...track,name:String(track.name||'Klavier')+' RH',notes:[],staff:'treble'};
 const lo={...track,name:String(track.name||'Klavier')+' LH',notes:[],staff:'bass'};
 for(const n of track.notes||[])(Number(n?.[2])>=60?hi.notes:lo.notes).push(n);
 return [hi,lo].filter(x=>x.notes.length);
}
function groupedEvents(notes){
 const byKey=new Map();
 for(const n of notes||[]){
  if(!Array.isArray(n)||n.length<4)continue;
  const key=Number(n[0]).toFixed(8)+'|'+Number(n[1]).toFixed(8);
  if(!byKey.has(key))byKey.set(key,{start:Number(n[0]),dur:Number(n[1]),notes:[]});
  byKey.get(key).notes.push(n);
 }
 return [...byKey.values()].sort((a,b)=>a.start-b.start||a.dur-b.dur);
}
function partitionVoices(events){
 const voices=[];
 for(const e of events){
  let v=voices.find(x=>x.end<=e.start+1e-8);
  if(!v){v={end:0,events:[]};voices.push(v);}
  v.events.push(e);v.end=Math.max(v.end,e.start+e.dur);
 }
 return voices.map(v=>v.events);
}
function splitAtBarlines(events,bpb){
 const segments=[];
 for(const e of events){
  let pos=e.start,remain=e.dur;
  while(remain>1e-9){
   const bar=Math.floor((pos+1e-9)/bpb),barEnd=(bar+1)*bpb;
   const dur=Math.min(remain,barEnd-pos);
   segments.push({...e,start:pos,dur,tied:remain>dur+1e-9});
   pos+=dur;remain-=dur;
  }
 }
 return segments.sort((a,b)=>a.start-b.start||a.dur-b.dur);
}
function voiceBody(events,bpb,bars){
 const segments=splitAtBarlines(events,bpb);let out=[],idx=0;
 for(let bar=0;bar<bars;bar++){
  const bs=bar*bpb,be=bs+bpb;let cursor=bs,tokens=[];
  while(idx<segments.length&&segments[idx].start<be-1e-9){
   const e=segments[idx++];
   if(e.start<bs-1e-9)continue;
   if(e.start>cursor+1e-9)tokens.push(restToken(e.start-cursor));
   tokens.push(noteToken(e,e.dur,e.tied));
   cursor=Math.max(cursor,e.start+e.dur);
  }
  if(cursor<be-1e-9)tokens.push(restToken(be-cursor));
  out.push(tokens.join(' ')+' |');
 }
 return out.join('\n');
}
function instrumentProgramDirective(program){return '%%MIDI program '+Math.max(0,Math.min(127,Number(program)||0));}
export function historicalScoreToAbc(score){
 if(!score?.tracks?.length)throw new Error('Keine JSON-Partitur für die Notendarstellung.');
 const meter=Array.isArray(score.timeSignature)?score.timeSignature:[4,4],bpb=beatsPerBar(score),bars=totalBars(score);
 const parts=[];for(const track of score.tracks)parts.push(...splitPianoTrack(track));
 const defs=[],bodies=[],ids=[],used=new Set();
 for(let pi=0;pi<parts.length;pi++){
  const part=parts[pi],events=groupedEvents(part.notes),voices=partitionVoices(events);
  const base=safeId(part.name,'V'+(pi+1));
  for(let vi=0;vi<voices.length;vi++){
   let id=base+(voices.length>1?String(vi+1):'');while(used.has(id))id+='x';used.add(id);ids.push({id,part,voiceIndex:vi});
   const clef=part.staff==='bass'?'bass':'treble';
   defs.push('V:'+id+' name="'+String(part.name||id).replace(/"/g,"'")+'" clef='+clef);
   bodies.push('[V:'+id+']\n'+instrumentProgramDirective(part.program)+'\n'+voiceBody(voices[vi],bpb,bars));
  }
 }
 const violin=ids.filter(x=>/violin|violine|vln/i.test(x.part.name)).map(x=>x.id);
 const prh=ids.filter(x=>/piano|klavier/i.test(x.part.name)&&x.part.staff==='treble').map(x=>x.id);
 const plh=ids.filter(x=>/piano|klavier/i.test(x.part.name)&&x.part.staff==='bass').map(x=>x.id);
 let scoreLine='';
 if(violin.length&&prh.length&&plh.length)scoreLine='%%score '+violin.join(' ')+' { '+prh.join(' ')+' '+plh.join(' ')+' }';
 else if(ids.length>1)scoreLine='%%score '+ids.map(x=>x.id).join(' ');
 const title=String(score.title||'Ohne Titel').replace(/\r?\n/g,' ').trim();
 return ['X:1','T:'+title,'M:'+meter[0]+'/'+meter[1],'L:1/16','Q:1/4='+Math.round(Number(score.bpm)||120),'K:C',scoreLine,...defs,'',...bodies].filter(x=>x!=='').join('\n')+'\n';
}
export function auditHistoricalAbc(score,abc){
 const expected=[];for(const tr of score?.tracks||[])for(const n of tr.notes||[])if(Array.isArray(n))expected.push([Number(n[0]),Number(n[1]),Number(n[2])]);
 const noteCount=(String(abc).match(/(?:^|[^A-Za-z])(?:\^|_|=)?[A-Ga-g][,']*/g)||[]).length;
 return {sourceNotes:expected.length,abcPitchTokens:noteCount,bars:totalBars(score),ok:noteCount>=expected.length};
}
