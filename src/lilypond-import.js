// LilyPond -> ABC bridge for common Minimal Composer output.
// Unsupported syntax is rejected instead of silently changing music.
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
function abcPitch(spec,octave){
 const letter=spec.letter.toUpperCase();
 const accidental=spec.acc==='is'?'^':spec.acc==='es'?'_':'';
 const base=octave===4?letter:octave>4?letter.toLowerCase()+"'".repeat(octave-5):letter+','.repeat(4-octave);
 return accidental+base;
}
function keyInfo(part){
 const m=part.match(/\\key\s+([a-g](?:is|es)?)\s+\\(major|minor)\b/);
 if(!m)throw Error('Keine unterstützte Tonart gefunden.');
 const names={c:'C',d:'D',e:'E',f:'F',g:'G',a:'A',b:'B',fis:'F#',cis:'C#',gis:'G#',dis:'D#',ais:'A#',bes:'Bb',ees:'Eb',aes:'Ab',des:'Db',ges:'Gb'};
 const tonic=names[m[1]];if(!tonic)throw Error('Tonart derzeit nicht unterstützt: '+m[1]);
 return tonic+(m[2]==='minor'?'m':'');
}
function cleanMusicBody(body){
 let x=body;
 x=x.replace(/\\(?:stemUp|stemDown|numericTimeSignature|break|mergeDifferentlyDottedOn|mergeDifferentlyHeadedOn)\b/g,' ');
 x=x.replace(/\\barNumberCheck\s+#\d+/g,' ');
 x=x.replace(/\\bar\s+"[^"]*"/g,' ');
 x=x.replace(/[_^]\\markup\s*\{\s*\\italic\s*\{[^{}]*\}\s*\}/g,' ');
 x=x.replace(/[_^]?\s*\\(?:p{1,3}|f{1,3}|mf|mp|sfz|fermata)\b/g,' ');
 x=x.replace(/\\(?:>|<|!)/g,' ');
 x=x.replace(/\\tempo\s+(?:"[^"]+"\s*)?\d+\s*=\s*\d+/g,' ');
 x=x.replace(/\\clef\s+"?(?:treble|bass)"?/g,' ');
 x=x.replace(/\\key\s+[a-g](?:is|es)?\s+\\(?:major|minor)\b/g,' ');
 x=x.replace(/\\time\s+\d+\/\d+/g,' ');
 x=x.replace(/[\[\]()]/g,' ');
 return x;
}
function namedBlocks(text){
 const out=new Map(),re=/\b([A-Za-z][A-Za-z0-9_]*)\s*=\s*\{/g;
 for(const m of text.matchAll(re)){
  const b=blockFrom(text,m.index+m[0].length);
  out.set(m[1],b.body);
 }
 return out;
}
function ensembleStaves(text){
 const scorePos=text.indexOf('\\score');if(scorePos<0)return null;
 const open=text.indexOf('{',scorePos);if(open<0)return null;
 const score=blockFrom(text,open+1).body,defs=namedBlocks(text),global=defs.get('global')??'';
 const re=/\\new Staff(?:\s*=\s*"[^"]+")?\s*(?:\\with\s*\{[^{}]*\}\s*)?\{/g;
 const found=[];
 for(const m of score.matchAll(re)){
  const b=blockFrom(score,m.index+m[0].length),staff=b.body;
  const clef=staff.match(/\\clef\s+"?(treble|bass)"?/)?.[1];
  const refs=[...staff.matchAll(/\\([A-Za-z][A-Za-z0-9_]*)\b/g)].map(x=>x[1]);
  const ref=refs.find(name=>defs.has(name)&&name!=='global');
  if(!clef||!ref)continue;
  let music=defs.get(ref).replace(/\\global\b/g,global);
  const instrument=m[0].match(/instrumentName\s*=\s*"([^"]+)"/)?.[1]??(ref.toLowerCase().includes('violin')?'Violine':'');
  found.push({clef,name:instrument||ref,part:'\\clef '+clef+' '+music});
 }
 return found.length>=2?found:null;
}
function contextVoiceStaves(text){
 const scorePos=text.indexOf('\\score');if(scorePos<0)return null;
 const open=text.indexOf('{',scorePos);if(open<0)return null;
 const score=blockFrom(text,open+1).body;
 const defs=new Map(),defRe=/\b([A-Za-z][A-Za-z0-9_]*)\s*=\s*\\(relative|fixed)\s+([a-g](?:is|es)?[',]*)\s*\{/g;
 for(const m of text.matchAll(defRe)){
  const b=blockFrom(text,m.index+m[0].length);
  defs.set(m[1],m[0]+b.body+'}');
 }
 const refs=[...score.matchAll(/\\context Voice\s*=\s*"[^"]+"\s*\{\s*\\([A-Za-z][A-Za-z0-9_]*)\s*\}/g)];
 if(refs.length<2)return null;
 const found=[];
 for(const m of refs){
  const ref=m[1],part=defs.get(ref);if(!part)continue;
  const clef=part.match(/\\clef\s+"?(treble|bass)"?/)?.[1];if(!clef)continue;
  const prefix=score.slice(0,m.index);
  const labels=[...prefix.matchAll(/\\set\s+(Staff|PianoStaff)\.instrumentName\s*=\s*"([^"]+)"/g)];
  const label=labels.at(-1);
  let name=ref;
  if(label?.[1]==='Staff')name=label[2];
  else if(label?.[1]==='PianoStaff')name=label[2]+' '+(clef==='bass'?'links':'rechts');
  found.push({clef,name,part});
 }
 return found.length>=2?found:null;
}
function directPianoStaves(text){
 const matches=[...text.matchAll(/\\new Staff(?:\s*=\s*"[^"]+")?\s*\{/g)];
 if(matches.length!==2)return null;
 return matches.map((m,i)=>({clef:i?'bass':'treble',name:i?'Klavier links':'Klavier rechts',part:blockFrom(text,m.index+m[0].length).body}));
}
function namedRelativePiano(text){
 const found=[],re=/\b([A-Za-z][A-Za-z0-9_]*)\s*=\s*\\(relative|fixed)\s+([a-g](?:is|es)?[',]*)\s*\{/g;
 for(const m of text.matchAll(re)){
  const b=blockFrom(text,m.index+m[0].length),whole=m[0]+b.body+'}';
  const clef=whole.match(/\\clef\s+"?(treble|bass)"?/)?.[1];
  if(clef)found.push({clef,name:clef==='bass'?'Klavier links':'Klavier rechts',part:whole});
 }
 const treble=found.find(x=>x.clef==='treble'),bass=found.find(x=>x.clef==='bass');
 return treble&&bass?[treble,bass]:null;
}
function parsePart(item){
 const part=item.part,clef=part.match(/\\clef\s+"?(treble|bass)"?/)?.[1]??item.clef;
 if(!clef)throw Error('Nur Violin- und Bassschlüssel unterstützt.');
 if(!/(?:\\numericTimeSignature\s*)?\\time\s+4\/4\b/.test(part))throw Error('Derzeit nur 4/4 unterstützt.');
 const key=keyInfo(part),mode=part.match(/\\(fixed|relative)\s+([a-g](?:is|es)?[',]*)\s*\{/);
 let body,modeType,anchor;
 if(mode){const b=blockFrom(part,mode.index+mode[0].length);body=cleanMusicBody(b.body);modeType=mode[1];anchor=mode[2];}
 else{body=cleanMusicBody(part);modeType='absolute';anchor='c';}
 const tokens=body.match(/<[^>]+>\d*|r\d*|[a-g](?:is|es)?[',]*\d*|\|/g)??[];
 if(tokens.join('').replace(/\s/g,'')!==body.replace(/\s/g,''))throw Error('Nicht unterstützte LilyPond-Anweisung im Notenblock.');
 const beamBar=events=>{let out='';for(let i=0;i<events.length;i++){const e=events[i],prev=events[i-1];const join=prev&&prev.length===1&&e.length===1&&prev.start%2===0&&e.start===prev.start+1;out+=(i&&!join?' ':'')+e.abc;}return out;};
 let previous=absoluteAnchor(anchor),lastLength=null,bar=[],duration=0;const bars=[];
 const convertPitch=token=>{
  const spec=pitchSpec(token),step='cdefgab'.indexOf(spec.letter);let octave;
  if(modeType==='fixed'||modeType==='absolute')octave=3+[...spec.marks].reduce((n,c)=>n+(c==="'"?1:-1),0);
  else{const prevStep=((previous%7)+7)%7;let delta=step-prevStep;while(delta>3)delta-=7;while(delta< -3)delta+=7;previous+=delta+7*[...spec.marks].reduce((n,c)=>n+(c==="'"?1:-1),0);octave=Math.floor(previous/7);}
  return abcPitch(spec,octave);
 };
 const pushBar=()=>{if(duration!==8)throw Error('Takt hat nicht genau vier Viertel.');bars.push(beamBar(bar));bar=[];duration=0;};
 for(const token of tokens){
  if(token==='|'){if(!bar.length&&duration===0)continue;pushBar();continue;}
  const m=/^(<([^>]+)>|r|([a-g](?:is|es)?[',]*))(\d*)$/.exec(token);
  if(!m)throw Error('Nicht unterstütztes Notenereignis: '+token);
  const lilyLength=m[4]?Number(m[4]):lastLength;if(![1,2,4,8].includes(lilyLength))throw Error('Nicht unterstützter Notenwert.');
  lastLength=lilyLength;const length=8/lilyLength,start=duration;duration+=length;
  let abc;if(m[1]==='r')abc='z'+(length===1?'':length);
  else if(m[2]){
   const chordTokens=m[2].trim().split(/\s+/),notes=[];let firstReference=null;
   for(const chordToken of chordTokens){notes.push(convertPitch(chordToken));if(firstReference===null&&modeType==='relative')firstReference=previous;}
   if(firstReference!==null)previous=firstReference;
   abc='['+notes.join('')+']'+(length===1?'':length);
  }else{
   abc=convertPitch(m[3])+(length===1?'':length);
  }
  bar.push({abc,length,start});
 }
 if(bar.length)pushBar();
 return {...item,clef,key,bars};
}
function safeName(name){return String(name||'').replace(/"/g,'').trim();}
export function lilyToAbc(input){
 const text=input.replace(/%[^\n]*/g,'');
 if(!/\\version\s+"[^"]+"/.test(text))throw Error('Keine LilyPond-Version gefunden.');
 const title=text.match(/title\s*=\s*"([^"]*)"/)?.[1]??'LilyPond-Import';
 let items=ensembleStaves(text)??contextVoiceStaves(text);
 if(!items&&text.includes('\\new PianoStaff'))items=directPianoStaves(text)??namedRelativePiano(text);
 if(!items)throw Error('Keine unterstützten Notensysteme gefunden.');
 const parsed=items.map(parsePart),key=parsed[0].key,bars=parsed[0].bars.length;
 if(parsed.some(x=>x.key!==key))throw Error('Die Systeme verwenden unterschiedliche Tonarten.');
 if(parsed.some(x=>x.bars.length!==bars))throw Error('Die Systeme haben unterschiedlich viele Takte.');
 const tempo=Number(text.match(/\\tempo\s+(?:"[^"]+"\s*)?4\s*=\s*(\d+)/)?.[1]??80);
 const ids=parsed.length===2?['RH','LH']:parsed.map((_,i)=>'V'+(i+1));
 const score=parsed.length===2?'{RH LH}':parsed.length===3?'V1 {V2 V3}':ids.join(' ');
 const lines=['X:1','T:'+title,'M:4/4','L:1/8','Q:1/4='+tempo,'K:'+key,'%%barsperstaff 4','%%score '+score];
 parsed.forEach((x,i)=>lines.push('V:'+ids[i]+' clef='+x.clef+' name="'+safeName(x.name)+'"'));
 parsed.forEach((x,i)=>lines.push('[V:'+ids[i]+'] '+x.bars.join(' | ')+' |]'));
 return lines.join('\n');
}
