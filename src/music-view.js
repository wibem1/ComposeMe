export function normalizeAbcForAbcjs(abc){
 if(typeof abc!=='string'||!abc.trim())return '';
 const lines=abc.replace(/\r\n?/g,'\n').split('\n').filter(line=>!/^%%(?:stretchstaff|measurenb)\b/i.test(line.trim()));
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
 return kept.join('\n').trim();
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
export function renderMusic({abc,ABCJS,paper,audio}){paper.replaceChildren();audio.replaceChildren();if(!abc)return null;if(!ABCJS?.renderAbc)throw new Error('Notenmodul nicht geladen.');const normalized=normalizeAbcForAbcjs(abc);const visual=ABCJS.renderAbc(paper,normalized,{responsive:'resize',add_classes:true});if(!visual?.[0])throw new Error('ABC konnte nicht dargestellt werden.');if(ABCJS.synth?.supportsAudio?.()){const cursorControl=createCursorControl(paper);const control=new ABCJS.synth.SynthController();control.load(audio,cursorControl,{displayRestart:true,displayPlay:true,displayProgress:true,displayWarp:true});control.setTune(visual[0],false,{chordsOff:true});addTempoHint(audio,normalized);}return visual[0];}
