// Deterministic technical conversion of the existing historical JSON score to MusicXML.
// No AI call and no musical recomposition. Notes, starts, durations, velocities, written pitches
// and explicit instrument/voice separation are preserved.
function esc(s){return String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[ch]));}
function writtenPitch(name){
 const m=String(name||'').trim().match(/^([A-Ga-g])([#b]{0,2})(-?\d+)$/);
 if(!m)return null;
 const step=m[1].toUpperCase(),acc=m[2]||'';
 const alter=[...acc].reduce((n,ch)=>n+(ch==='#'?1:-1),0);
 return {step,alter,octave:Number(m[3])};
}
function pitchXml(midi,name){
 const written=writtenPitch(name);
 if(written)return '<pitch><step>'+written.step+'</step>'+(written.alter?'<alter>'+written.alter+'</alter>':'')+'<octave>'+written.octave+'</octave></pitch>';
 const names=[['C',0],['C',1],['D',0],['E',-1],['E',0],['F',0],['F',1],['G',0],['A',-1],['A',0],['B',-1],['B',0]];
 const n=Math.max(0,Math.min(127,Math.round(Number(midi)||60))),x=names[n%12];
 return '<pitch><step>'+x[0]+'</step>'+(x[1]?'<alter>'+x[1]+'</alter>':'')+'<octave>'+(Math.floor(n/12)-1)+'</octave></pitch>';
}
function typeXml(q){
 const values=[[4,'whole',0],[3,'half',1],[2,'half',0],[1.5,'quarter',1],[1,'quarter',0],[.75,'eighth',1],[.5,'eighth',0],[.375,'16th',1],[.25,'16th',0],[.125,'32nd',0]];
 const x=values.find(v=>Math.abs(v[0]-q)<1e-7);
 return x?'<type>'+x[1]+'</type>'+('<dot/>'.repeat(x[2])):'';
}
function restXml(q,voice,staff,div){return '<note><rest/><duration>'+Math.round(q*div)+'</duration><voice>'+voice+'</voice>'+typeXml(q)+(staff?'<staff>'+staff+'</staff>':'')+'</note>';}
function noteXml(n,voice,staff,div,chord=false,tieStart=false,tieStop=false){
 const ties=(tieStop?'<tie type="stop"/>':'')+(tieStart?'<tie type="start"/>':'');
 const notations=(tieStop||tieStart)?'<notations>'+(tieStop?'<tied type="stop"/>':'')+(tieStart?'<tied type="start"/>':'')+'</notations>':'';
 return '<note dynamics="'+Math.round((n.velocity/127)*100)+'">'+(chord?'<chord/>':'')+pitchXml(n.pitch,n.name)+'<duration>'+Math.round(n.duration*div)+'</duration><voice>'+voice+'</voice>'+typeXml(n.duration)+ties+(staff?'<staff>'+staff+'</staff>':'')+notations+'</note>';
}
function trackNotes(track){return (track?.notes||[]).filter(n=>Array.isArray(n)&&n.length>=4).map(n=>({start:Number(n[0])||0,duration:Math.max(.125,Number(n[1])||.25),pitch:Math.round(Number(n[2])||60),velocity:Math.max(1,Math.min(127,Math.round(Number(n[3])||80))),name:typeof n[4]==='string'?n[4]:undefined}));}
function splitAcrossMeasures(notes,barQ,bars,staff){
 const out=Array.from({length:bars},()=>[]);
 for(const n of notes){const end=n.start+n.duration;let cursor=n.start,part=0;while(cursor<end-1e-8){const bi=Math.max(0,Math.min(bars-1,Math.floor(cursor/barQ))),measureEnd=(bi+1)*barQ,d=Math.min(end,measureEnd)-cursor;out[bi].push({start:cursor-bi*barQ,duration:d,pitch:n.pitch,velocity:n.velocity,name:n.name,tieStop:part>0,tieStart:cursor+d<end-1e-8,staff});cursor+=d;part++;}}
 return out;
}
function groupChords(notes){
 const groups=[];
 for(const n of [...notes].sort((a,b)=>a.start-b.start||a.duration-b.duration||a.pitch-b.pitch)){let g=groups.find(x=>Math.abs(x.start-n.start)<1e-8&&Math.abs(x.duration-n.duration)<1e-8&&x.tieStart===n.tieStart&&x.tieStop===n.tieStop);if(!g){g={start:n.start,duration:n.duration,tieStart:n.tieStart,tieStop:n.tieStop,notes:[]};groups.push(g);}g.notes.push(n);}
 return groups.sort((a,b)=>a.start-b.start||a.duration-b.duration);
}
function allocateVoices(groups){
 const voices=[];
 for(const g of groups){let chosen=-1,bestEnd=-Infinity;for(let i=0;i<voices.length;i++){const end=voices[i].end;if(end<=g.start+1e-8&&end>bestEnd){chosen=i;bestEnd=end;}}if(chosen<0){chosen=voices.length;voices.push({end:0,groups:[]});}voices[chosen].groups.push(g);voices[chosen].end=Math.max(voices[chosen].end,g.start+g.duration);}
 return voices;
}
function voiceStream(groups,staff,voice,barQ,div){let out='',cursor=0;for(const g of groups){if(g.start>cursor+1e-8)out+=restXml(g.start-cursor,voice,staff,div);g.notes.forEach((n,i)=>{out+=noteXml({...n,duration:g.duration},voice,staff,div,i>0,g.tieStart,g.tieStop);});cursor=Math.max(cursor,g.start+g.duration);}if(cursor<barQ-1e-8)out+=restXml(barQ-cursor,voice,staff,div);return out;}
function splitTrackName(name){const s=String(name||'').trim(),m=s.match(/^(.*?)\s*::\s*(.+)$/);return m?{instrument:m[1].trim()||s,voice:m[2].trim()}:{instrument:s,voice:''};}
function isKeyboardName(name){return /klavier|piano|keyboard|keys|flügel|grand piano|electric piano/i.test(String(name||''));}
function medianPitch(notes){const p=notes.map(n=>n.pitch).sort((a,b)=>a-b);return p.length?p[Math.floor(p.length/2)]:60;}
function clefFor(name,channel,notes){const low=String(name||'').toLowerCase();if(Number(channel)===9)return {sign:'percussion',line:2};if(/viola|bratsche/.test(low))return {sign:'C',line:3};if(/cello|violoncello|kontrabass|double bass|contrabass|bassoon|fagott|tuba|posaune|trombone|e-bass|electric bass|bass guitar/.test(low))return {sign:'F',line:4};return medianPitch(notes)<55?{sign:'F',line:4}:{sign:'G',line:2};}
function staffForVoice(voice,notes,keyboard){if(!keyboard)return 1;const v=String(voice||'').toLowerCase();if(/bass|linke|left|unterstimme|lower/.test(v))return 2;if(/oberstimme|rechte|right|melodie|sopran|upper/.test(v))return 1;return medianPitch(notes)<60?2:1;}
function makeParts(tracks){
 const groups=[];
 tracks.forEach((track,index)=>{const notes=trackNotes(track);if(!notes.length)return;const parsed=splitTrackName(track?.name||('Instrument '+(index+1)));let group=groups.find(g=>g.name===parsed.instrument);if(!group){group={name:parsed.instrument,program:Math.max(0,Math.min(127,Math.round(Number(track?.program)||0))),channel:Math.max(0,Math.min(15,Math.round(Number(track?.channel)||index)))+1,voices:[]};groups.push(group);}group.voices.push({label:parsed.voice||'',notes,sourceIndex:index});});
 return groups.map((g,i)=>{const all=g.voices.flatMap(v=>v.notes),keyboard=isKeyboardName(g.name);return {...g,id:'P'+(i+1),keyboard,clef:clefFor(g.name,g.channel-1,all),voices:g.voices.map(v=>({...v,staff:staffForVoice(v.label,v.notes,keyboard)}))};});
}
export function historicalScoreToMusicXML(score){
 if(!score||!Array.isArray(score.tracks))throw new Error('Historische Partitur fehlt.');
 const parts=makeParts(score.tracks);if(!parts.length)throw new Error('Historische Partitur enthält keine Noten.');
 const ts=Array.isArray(score.timeSignature)?score.timeSignature:[4,4],num=Number(ts[0])||4,den=Number(ts[1])||4,barQ=num*4/den,div=8;
 const end=parts.flatMap(p=>p.voices).flatMap(v=>v.notes).reduce((m,n)=>Math.max(m,n.start+n.duration),0),bars=Math.max(1,Math.ceil(end/barQ));
 const bpm=Math.max(1,Math.round(Number(score.bpm)||120)),measureDuration=Math.round(barQ*div);
 let out='<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<score-partwise version="4.0"><work><work-title>'+esc(score.title||'ComposeMe')+'</work-title></work><part-list>';
 for(const p of parts)out+='<score-part id="'+p.id+'"><part-name>'+esc(p.name)+'</part-name><score-instrument id="'+p.id+'-I1"><instrument-name>'+esc(p.name)+'</instrument-name></score-instrument><midi-instrument id="'+p.id+'-I1"><midi-channel>'+p.channel+'</midi-channel><midi-program>'+(p.program+1)+'</midi-program></midi-instrument></score-part>';
 out+='</part-list>';
 parts.forEach((p,pi)=>{const perVoice=p.voices.map(v=>({v,measures:splitAcrossMeasures(v.notes,barQ,bars,v.staff)}));out+='<part id="'+p.id+'">';for(let bi=0;bi<bars;bi++){out+='<measure number="'+(bi+1)+'">';if(bi===0){out+='<attributes><divisions>'+div+'</divisions><time><beats>'+num+'</beats><beat-type>'+den+'</beat-type></time>';if(p.keyboard)out+='<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>';else out+='<clef><sign>'+p.clef.sign+'</sign><line>'+p.clef.line+'</line></clef>';out+='</attributes>';if(pi===0)out+='<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>'+bpm+'</per-minute></metronome></direction-type><sound tempo="'+bpm+'"/></direction>';}const streams=[];let nextVoice=1;for(const item of perVoice){const groups=groupChords(item.measures[bi]),subvoices=allocateVoices(groups);for(const sub of subvoices)streams.push({staff:item.v.staff,voice:nextVoice++,groups:sub.groups});}if(!streams.length)streams.push({staff:p.keyboard?1:null,voice:1,groups:[]});streams.forEach((s,i)=>{if(i)out+='<backup><duration>'+measureDuration+'</duration></backup>';out+=voiceStream(s.groups,p.keyboard?s.staff:null,s.voice,barQ,div);});out+='</measure>';}out+='</part>';});
 return out+'</score-partwise>';
}
