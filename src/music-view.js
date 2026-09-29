import {alignScoreVoiceLines} from './voice-line-sync.js';
import {beamSimpleEighths} from './metric-beaming.js';
export function normalizeAbcForAbcjs(abc){
 if(typeof abc!=='string'||!abc.trim())return '';
 const lines=abc.replace(/\r\n?/g,'\n').split('\n').filter(line=>line.trim()!==''&&!/^%%(?:stretchstaff|measurenb)\b/i.test(line.trim()));
 const kIndex=lines.findIndex(line=>/^K\s*:/.test(line.trim()));
 if(kIndex<0)return abc.trim();
 const movable=[],kept=[];
 for(let i=0;i<lines.length;i++){
  const line=lines[i],trim=line.trim();
  if(i>kIndex&&/^V\s*:/.test(trim)&&/\b(?:clef|name|snm|sname|staves?)\s*=/.test(trim)){movable.push(line);continue;}
  kept.push(line);
 }
 const newK=kept.findIndex(line=>/^K\s*:/.test(line.trim()));
 if(movable.length)kept.splice(newK,0,...movable);
 const voices=new Map();
 for(const line of kept){
  const m=/^V\s*:\s*([^\s]+)(.*)$/.exec(line.trim());
  if(m)voices.set(m[1],m[2]);
 }
 for(let i=0;i<kept.length;i++){
  const m=/^%%score\s+\(([^()\s]+)\)\s+\(([^()\s]+)\s+([^()\s]+)\)\s*$/.exec(kept[i].trim());
  if(!m)continue;
  const [,solo,rh,lh]=m;
  const rhProps=voices.get(rh)??'',lhProps=voices.get(lh)??'';
  if(/clef\s*=\s*treble\b/.test(rhProps)&&/clef\s*=\s*bass\b/.test(lhProps)){
   kept[i]='%%score '+solo+' {'+rh+' '+lh+'}';
  }
 }
 const programs=new Map();
 for(const [id,props] of voices){
  const label=(id+' '+props).toLowerCase();
  if(/violin|violine|vln/.test(label))programs.set(id,40);
  else if(/pno|piano|klavier/.test(label))programs.set(id,0);
 }
 if(programs.size){
  const seen=new Set(),scoped=[];
  for(const line of kept){
   const m=/^\[V:([^\]]+)\]/.exec(line.trim());
   if(m&&programs.has(m[1])&&!seen.has(m[1])){
    scoped.push('V:'+m[1]);
    scoped.push('%%MIDI program '+programs.get(m[1]));
    seen.add(m[1]);
   }
   scoped.push(line);
  }
  kept.length=0;kept.push(...scoped);
 }
 return beamSimpleEighths(alignScoreVoiceLines(kept.join('\n').trim()));
}

function abcPitchToMidi(token){
 const m=/^(?:\^{1,2}|_{1,2}|=)?([A-Ga-g])([,']*)/.exec(token);
 if(!m)return null;
 const pc={C:0,D:2,E:4,F:5,G:7,A:9,B:11}[m[1].toUpperCase()];
 let midi=(m[1]===m[1].toLowerCase()?72:60)+pc;
 for(const ch of m[2])midi+=ch==="'"?12:-12;
 return midi;
}
export function analyzeInstrumentRanges(abc){
 if(typeof abc!=='string'||!abc.trim())return [];
 const lines=abc.replace(/\r\n?/g,'\n').split('\n');
 const labels=new Map();
 for(const line of lines){
  const m=/^V\s*:\s*([^\s]+)(.*)$/.exec(line.trim());
  if(m)labels.set(m[1],(m[1]+' '+m[2]).toLowerCase());
 }
 const pitches=new Map();
 for(const line of lines){
  const vm=/^\[V:([^\]]+)\]\s*(.*)$/.exec(line.trim());
  if(!vm)continue;
  const id=vm[1],label=labels.get(id)??id.toLowerCase();
  if(!/violin|violine|vln/.test(label))continue;
  const clean=vm[2].replace(/"[^"]*"/g,' ').replace(/![^!]*!/g,' ').replace(/%.*$/,' ');
  const tokens=clean.match(/(?:\^{1,2}|_{1,2}|=)?[A-Ga-g][,']*/g)??[];
  for(const token of tokens){
   const midi=abcPitchToMidi(token);
   if(midi!=null)(pitches.get(id)??(pitches.set(id,[]),pitches.get(id))).push(midi);
  }
 }
 const warnings=[];
 for(const [id,vals] of pitches){
  if(vals.length<4)continue;
  const sorted=[...vals].sort((a,b)=>a-b);
  const median=sorted[Math.floor(sorted.length/2)],max=sorted[sorted.length-1];
  if(median>=84&&max>=96){
   warnings.push({voice:id,type:'suspicious-high-register',median,max,message:'Auffällige Violinenlage: Die Stimme liegt überwiegend sehr hoch. Bitte ABC-Oktavierung prüfen.'});
  }
 }
 return warnings;
}
export function extractAbc(text){if(typeof text!=='string')return '';const cleaned=text.replace(/^\s*\`\`\`(?:abc)?\s*/i,'').replace(/\s*\`\`\`\s*$/,'').trim();const start=cleaned.search(/^X\s*:/m);return start<0?'':cleaned.slice(start).trim();}
function tempoFromAbc(abc){const m=abc.match(/^Q:\s*(?:1\/4\s*=\s*)?(\d+)/m);return m?Number(m[1]):null;}
function createCursorControl(paper){
 let cursor=null;
 const remove=()=>{cursor?.remove();cursor=null;};
 const ensure=()=>{
  if(cursor?.isConnected)return cursor;
  const svg=paper.querySelector('svg');if(!svg)return null;
  cursor=document.createElementNS('http://www.w3.org/2000/svg','line');
  cursor.setAttribute('class','playback-cursor');
  cursor.setAttribute('aria-hidden','true');
  svg.append(cursor);return cursor;
 };
 return {
  onStart(){ensure();},
  onEvent(ev){
   if(!ev||ev.left==null||ev.top==null||ev.height==null)return;
   const line=ensure();if(!line)return;
   line.setAttribute('x1',String(ev.left));line.setAttribute('x2',String(ev.left));
   line.setAttribute('y1',String(ev.top));line.setAttribute('y2',String(ev.top+ev.height));
   line.style.display='';
  },
  onFinished(){if(cursor)cursor.style.display='none';},
  remove
 };
}
function addTempoHint(audio,abc){
 const bpm=tempoFromAbc(abc);if(!bpm)return;
 const hint=document.createElement('small');hint.className='tempo-hint';
 const update=()=>{
  const warp=audio.querySelector('input[type="number"]');
  const percent=warp?.value||'100';
  hint.textContent='Geschwindigkeit: '+percent+' % · Kompositionstempo: '+bpm+' BPM';
 };
 update();audio.append(hint);
 audio.addEventListener('input',event=>{if(event.target instanceof HTMLInputElement&&event.target.type==='number')update();});
 audio.addEventListener('change',event=>{if(event.target instanceof HTMLInputElement&&event.target.type==='number')update();});
}
export function renderMusic({abc,ABCJS,paper,audio}){paper.replaceChildren();audio.replaceChildren();if(!abc)return null;if(!ABCJS?.renderAbc)throw new Error('Notenmodul nicht geladen.');const normalized=normalizeAbcForAbcjs(abc);const visual=ABCJS.renderAbc(paper,normalized,{responsive:'resize',add_classes:true});if(!visual?.[0])throw new Error('ABC konnte nicht dargestellt werden.');const rangeWarnings=analyzeInstrumentRanges(normalized);for(const item of rangeWarnings){const warning=document.createElement('div');warning.className='notation-warning';warning.setAttribute('role','status');warning.textContent=item.message;paper.append(warning);}if(ABCJS.synth?.supportsAudio?.()){const cursorControl=createCursorControl(paper);const control=new ABCJS.synth.SynthController();control.load(audio,cursorControl,{displayRestart:true,displayPlay:true,displayProgress:true,displayWarp:true});control.setTune(visual[0],false,{chordsOff:true});addTempoHint(audio,normalized);}return visual[0];}
