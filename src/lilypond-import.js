// LilyPond -> ABC bridge for the notation patterns used by Minimal Composer.
// It accepts direct PianoStaff staves and common LilyPond named-voice exports.
// Unsupported syntax is rejected instead of silently changing notes.
function blockFrom(text,start){
 let depth=1,end=start;
 while(depth&&end<text.length){if(text[end]==='{')depth++;else if(text[end]==='}')depth--;end++;}
 if(depth)throw Error('Unvollständiger LilyPond-Block.');
 return {body:text.slice(start,end-1),end};
}
function pitchSpec(token){
 const m=/^([a-g])((?:is|es)?)([',]*)$/.exec(token);
 if(!m)throw Error('Ungültige Tonhöhe: '+token);
 return {letter:m[1],acc:m[2],marks:m[3]};
}
function absoluteAnchor(token){
 const p=pitchSpec(token),step='cdefgab'.indexOf(p.letter);
 const octave=3+[...p.marks].reduce((n,c)=>n+(c==="'"?1:-1),0);
 return octave*7+step;
}
function abcPitch(spec,octave,key){
 const letter=spec.letter.toUpperCase();
 let accidental='';
 if(spec.acc==='is')accidental='^';
 else if(spec.acc==='es')accidental='_';
 const base=octave===4?letter:octave>4?letter.toLowerCase()+"'".repeat(octave-5):letter+','.repeat(4-octave);
 return accidental+base;
}
function keyInfo(part){
 const m=part.match(/\\key\s+([a-g](?:is|es)?)\s+\\(major|minor)\b/);
 if(!m)throw Error('Keine unterstützte Tonart gefunden.');
 const names={c:'C',d:'D',e:'E',f:'F',g:'G',a:'A',b:'B',fis:'F#',cis:'C#',gis:'G#',dis:'D#',ais:'A#',bes:'Bb',ees:'Eb',aes:'Ab',des:'Db',ges:'Gb'};
 const tonic=names[m[1]];
 if(!tonic)throw Error('Tonart derzeit nicht unterstützt: '+m[1]);
 return {abc:tonic+(m[2]==='minor'?'m':'')};
}
function cleanMusicBody(body){
 let x=body;
 // layout / articulation / dynamics that do not change pitch or duration
 x=x.replace(/\\(?:stemUp|stemDown|numericTimeSignature|break|mergeDifferentlyDottedOn|mergeDifferentlyHeadedOn)\b/g,' ');
 x=x.replace(/\\barNumberCheck\s+#\d+/g,' ');
 x=x.replace(/\\bar\s+"[^"]*"/g,' ');
 x=x.replace(/[_^]\\markup\s*\{\s*\\italic\s*\{[^{}]*\}\s*\}/g,' ');
 x=x.replace(/[_^]\s*\\(?:p{1,3}|f{1,3}|mf|mp|sfz|fermata)\b/g,' ');
 x=x.replace(/\\tempo\s+(?:"[^"]+"\s*)?\d+\s*=\s*\d+/g,' ');
 x=x.replace(/\\clef\s+"?(?:treble|bass)"?/g,' ');
 x=x.replace(/\\key\s+[a-g](?:is|es)?\s+\\(?:major|minor)\b/g,' ');
 x=x.replace(/\\time\s+\d+\/\d+/g,' ');
 x=x.replace(/[\[\]]/g,' ');
 return x;
}
function extractDirectStaves(text){
 const matches=[...text.matchAll(/\\new Staff\s*\{/g)];
 if(matches.length!==2)return null;
 return matches.map(m=>blockFrom(text,m.index+m[0].length).body);
}
function extractNamedVoices(text){
 const found=[];
 const re=/\b([A-Za-z][A-Za-z0-9_]*)\s*=\s*\\(relative|fixed)\s+([a-g](?:is|es)?[',]*)\s*\{/g;
 for(const m of text.matchAll(re)){
  const b=blockFrom(text,m.index+m[0].length);
  const whole=m[0]+b.body+'}';
  const clef=whole.match(/\\clef\s+"?(treble|bass)"?/)?.[1];
  if(clef)found.push({name:m[1],clef,whole});
 }
 const treble=found.find(x=>x.clef==='treble'),bass=found.find(x=>x.clef==='bass');
 return treble&&bass?[treble.whole,bass.whole]:null;
}
function parsePart(part){
 const clef=part.match(/\\clef\s+"?(treble|bass)"?/)?.[1];
 if(!clef)throw Error('Nur Violin- und Bassschlüssel unterstützt.');
 if(!/(?:\\numericTimeSignature\s*)?\\time\s+4\/4\b/.test(part))throw Error('Derzeit nur 4/4 unterstützt.');
 const key=keyInfo(part);
 const mode=part.match(/\\(fixed|relative)\s+([a-g](?:is|es)?[',]*)\s*\{/);
 if(!mode)throw Error('Keine unterstützte \\fixed- oder \\relative-Stimme gefunden.');
 const b=blockFrom(part,mode.index+mode[0].length);
 let body=cleanMusicBody(b.body);
 const tokens=body.match(/<[^>]+>\d*|r\d*|[a-g](?:is|es)?[',]*\d*|\|/g)??[];
 if(tokens.join('').replace(/\s/g,'')!==body.replace(/\s/g,''))throw Error('Nicht unterstützte LilyPond-Anweisung im Notenblock.');
 const beamBar=(events)=>{
  let out='';
  for(let i=0;i<events.length;i++){
   const e=events[i],prev=events[i-1];
   const join=prev&&prev.length===1&&e.length===1&&prev.start%2===0&&e.start===prev.start+1;
   out+=(i&&!join?' ':'')+e.abc;
  }
  return out;
 };
 let previous=absoluteAnchor(mode[2]),lastLength=null,bar=[],duration=0;const bars=[];
 const convertPitch=token=>{
  const spec=pitchSpec(token);const step='cdefgab'.indexOf(spec.letter);let octave;
  if(mode[1]==='fixed'){
   octave=3+[...spec.marks].reduce((n,c)=>n+(c==="'"?1:-1),0);
  }else{
   const prevStep=((previous%7)+7)%7;let delta=step-prevStep;
   while(delta>3)delta-=7;while(delta< -3)delta+=7;
   const octaveShift=[...spec.marks].reduce((n,c)=>n+(c==="'"?1:-1),0);
   previous+=delta+7*octaveShift;octave=Math.floor(previous/7);
  }
  return abcPitch(spec,octave,key);
 };
 const pushBar=()=>{
  if(duration!==8)throw Error('Takt hat nicht genau vier Viertel.');
  bars.push(beamBar(bar));bar=[];duration=0;
 };
 for(const token of tokens){
  if(token==='|'){if(duration===0&&!bar.length)continue;pushBar();continue;}
  const m=/^(<([^>]+)>|r|([a-g](?:is|es)?[',]*))(\d*)$/.exec(token);
  if(!m)throw Error('Nicht unterstütztes Notenereignis: '+token);
  const lilyLength=m[4]?Number(m[4]):lastLength;
  if(![1,2,4,8].includes(lilyLength))throw Error('Nicht unterstützter Notenwert.');
  lastLength=lilyLength;const length=8/lilyLength,start=duration;duration+=length;
  let abc;
  if(m[1]==='r')abc='z'+(length===1?'':length);
  else{
   const notes=m[2]?m[2].trim().split(/\s+/).map(convertPitch):[convertPitch(m[3])];
   abc=(notes.length>1?'['+notes.join('')+']':notes[0])+(length===1?'':length);
  }
  bar.push({abc,length,start});
 }
 if(bar.length)pushBar();
 return {clef,key:key.abc,bars};
}
export function lilyToAbc(input){
 const text=input.replace(/%[^\n]*/g,'');
 if(!/\\version\s+"[^"]+"/.test(text))throw Error('Keine LilyPond-Version gefunden.');
 if(!text.includes('\\new PianoStaff'))throw Error('Kein PianoStaff gefunden.');
 const title=text.match(/title\s*=\s*"([^"]*)"/)?.[1]??'LilyPond-Import';
 const parts=extractDirectStaves(text)??extractNamedVoices(text);
 if(!parts)throw Error('Keine zwei unterstützten Klavierstimmen gefunden.');
 const [top,bottom]=parts.map(parsePart);
 if(top.key!==bottom.key)throw Error('Die beiden Systeme verwenden unterschiedliche Tonarten.');
 if(top.bars.length!==bottom.bars.length)throw Error('Die beiden Systeme haben unterschiedlich viele Takte.');
 if(!top.bars.length)throw Error('Keine Takte gefunden.');
 const tempo=Number(text.match(/\\tempo\s+(?:"[^"]+"\s*)?4\s*=\s*(\d+)/)?.[1]??80);
 return ['X:1','T:'+title,'M:4/4','L:1/8','Q:1/4='+tempo,'K:'+top.key,'%%score {RH LH}','V:RH clef=treble','V:LH clef=bass','[V:RH] '+top.bars.join(' | ')+' |]','[V:LH] '+bottom.bars.join(' | ')+' |]'].join('\n');
}
