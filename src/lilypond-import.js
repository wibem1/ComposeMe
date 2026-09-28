// LilyPond -> ABC bridge for common Minimal Composer output.
// Unsupported syntax is rejected instead of silently changing music.
function blockFrom(text,start){
 let depth=1,end=start;
 while(depth&&end<text.length){if(text[end]==='{')depth++;else if(text[end]==='}')depth--;end++;}
 if(depth)throw Error('Unvollständiger LilyPond-Block.');
 return {body:text.slice(start,end-1),end};
}
function pitchSpec(token){
 const m=/^([a-g])((?:isis|eses|is|es)?)([',]*)$/.exec(token);
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
 const accidental=spec.acc==='isis'?'^^':spec.acc==='eses'?'__':spec.acc==='is'?'^':spec.acc==='es'?'_':'';
 const base=octave===4?letter:octave>4?letter.toLowerCase()+"'".repeat(octave-5):letter+','.repeat(4-octave);
 return accidental+base;
}
function keyInfo(part){
 const m=part.match(/\\key\s+([a-g](?:isis|eses|is|es)?)\s+\\(major|minor)\b/);
 if(!m)throw Error('Keine unterstützte Tonart gefunden.');
 const names={c:'C',d:'D',e:'E',f:'F',g:'G',a:'A',b:'B',fis:'F#',cis:'C#',gis:'G#',dis:'D#',ais:'A#',bes:'Bb',ees:'Eb',aes:'Ab',des:'Db',ges:'Gb'};
 const tonic=names[m[1]];if(!tonic)throw Error('Tonart derzeit nicht unterstützt: '+m[1]);
 return tonic+(m[2]==='minor'?'m':'');
}
function cleanMusicBody(body){
 let x=body;
 x=x.replace(/<<\s*\{([^{}]*)\}\s*\\\\\s*\{([^{}]*)\}\s*>>/g,(_,a,b)=>{const norm=s=>s.replace(/\\fermata\b/g,' ').replace(/\s+/g,' ').trim();return norm(a)===norm(b)?a:' <<UNSUPPORTED_POLYPHONY>> ';});
 // Preserve tuplet ratios as parser markers. Common AI output uses flat (non-nested) tuplet blocks.
 let changed=true;
 while(changed){
  changed=false;
  x=x.replace(/\\tuplet\s+(\d+)\/(\d+)(?:\s+\d+)?\s*\{([^{}]*)\}/g,(_,n,m,inner)=>{changed=true;return ' @T'+n+'/'+m+'@ '+inner+' @E@ ';});
 }
 x=x.replace(/\\(?:stemUp|stemDown|numericTimeSignature|break|mergeDifferentlyDottedOn|mergeDifferentlyHeadedOn)\b/g,' ');
 x=x.replace(/\\barNumberCheck\s+#\d+/g,' ');
 x=x.replace(/\\bar\s+"[^"]*"/g,' ');
 x=x.replace(/[_^]\\markup\s*\{\s*\\italic\s*\{[^{}]*\}\s*\}/g,' ');
 x=x.replace(/[_^]?\\markup\s*\{\s*\\italic\s*"[^"]*"\s*\}/g,' ');
 x=x.replace(/[_^]?\s*\\(?:p{1,3}|f{1,3}|mf|mp|sfz|fermata)\b/g,' ');
 x=x.replace(/\\(?:>|<|!)/g,' ');
 x=x.replace(/\\tempo\s+(?:"[^"]+"\s*)?\d+\.?\s*=\s*\d+/g,' ');
 x=x.replace(/\\tempo\s+"[^"]+"/g,' ');
 x=x.replace(/\\(?:sustainOn|sustainOff|crescendo|diminuendo|prall|staccatissimo|tenuto|accent|marcato|espressivo|arpeggio)\b/g,' ');
 x=x.replace(/\\~|~/g,' ');
 x=x.replace(/-\.|->|--/g,' ');
 x=x.replace(/\\clef\s+"?(?:treble|bass)"?/g,' ');
 x=x.replace(/\\key\s+[a-g](?:isis|eses|is|es)?\s+\\(?:major|minor)\b/g,' ');
 x=x.replace(/\\time\s+(\d+)\/(\d+)/g,' @M$1/$2@ ');
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
  const refs=[...staff.matchAll(/\\([A-Za-z][A-Za-z0-9_]*)\b/g)].map(x=>x[1]);
  const ref=refs.find(name=>defs.has(name)&&name!=='global');
  if(!ref)continue;
  let music=defs.get(ref).replace(/\\global\b/g,global);
  const clef=staff.match(/\\clef\s+"?(treble|bass)"?/)?.[1]??music.match(/\\clef\s+"?(treble|bass)"?/)?.[1];
  if(!clef)continue;
  const instrument=m[0].match(/instrumentName\s*=\s*"([^"]+)"/)?.[1]??(ref.toLowerCase().includes('violin')?'Violine':'');
  found.push({clef,name:instrument||ref,part:music});
 }
 return found.length>=2?found:null;
}
function directEnsembleStaves(text){
 const scorePos=text.indexOf('\\score');if(scorePos<0)return null;
 const open=text.indexOf('{',scorePos);if(open<0)return null;
 const score=blockFrom(text,open+1).body,defs=namedBlocks(text),global=defs.get('global')??'';
 const re=/\\new Staff(?:\s*=\s*"[^"]+")?\s*(?:\\with\s*\{[^{}]*\}\s*)?\{/g;
 const found=[];
 for(const m of score.matchAll(re)){
  const staff=blockFrom(score,m.index+m[0].length).body.replace(/\\global\b/g,global);
  const clef=staff.match(/\\clef\s+"?(treble|bass)"?/)?.[1];
  if(!clef)continue;
  const instrument=m[0].match(/instrumentName\s*=\s*"([^"]+)"/)?.[1]??'';
  found.push({clef,name:instrument,part:staff});
 }
 if(found.length<2)return null;
 if(found.length===3){
  if(!found[0].name)found[0].name='Violine';
  if(!found[1].name)found[1].name='Klavier rechts';
  if(!found[2].name)found[2].name='Klavier links';
 }
 return found;
}
function referencedVariableStaves(text){
 const defs=new Map(),defRe=/\b([A-Za-z][A-Za-z0-9_]*)\s*=\s*\\(relative|fixed)\s+([a-g](?:isis|eses|is|es)?[',]*)\s*\{/g;
 for(const m of text.matchAll(defRe)){
  const b=blockFrom(text,m.index+m[0].length);
  defs.set(m[1],(m[0]+b.body+'}'));
 }
 const scorePos=text.indexOf('\\score');if(scorePos<0)return null;
 const open=text.indexOf('{',scorePos);if(open<0)return null;
 const score=blockFrom(text,open+1).body,global=namedBlocks(text).get('global')??'';
 const re=/\\new Staff(?:\s*=\s*"[^"]+")?\s*(?:\\with\s*\{[^{}]*\}\s*)?\\([A-Za-z][A-Za-z0-9_]*)\b/g;
 const found=[];
 for(const m of score.matchAll(re)){
  const ref=m[1],def=defs.get(ref);if(!def)continue;
  const part=def.replace(/\\global\b/g,global);
  const explicit=part.match(/\\clef\s+"?(treble|bass)"?/)?.[1];
  const inferred=/violin|vln/i.test(ref)?'treble':/(?:piano)?(?:rh|right|rechts|upper)/i.test(ref)?'treble':/(?:piano)?(?:lh|left|links|lower)/i.test(ref)?'bass':null;
  const clef=explicit??inferred;if(!clef)continue;
  const withName=m[0].match(/instrumentName\s*=\s*"([^"]+)"/)?.[1];
  const name=withName??(/violin|vln/i.test(ref)?'Violine':clef==='bass'?'Klavier links':'Klavier rechts');
  found.push({clef,name,part});
 }
 return found.length>=2?found:null;
}
function contextVoiceStaves(text){
 const defs=new Map(),defRe=/\b([A-Za-z][A-Za-z0-9_]*)\s*=\s*\\(relative|fixed)\s+([a-g](?:isis|eses|is|es)?[',]*)\s*\{/g;
 for(const m of text.matchAll(defRe)){
  const b=blockFrom(text,m.index+m[0].length);
  defs.set(m[1],m[0]+b.body+'}');
 }
 const refs=[...text.matchAll(/\\context Voice\s*=\s*"[^"]+"\s*\{\s*\\([A-Za-z][A-Za-z0-9_]*)\s*\}/g)];
 if(refs.length<2)return null;
 const found=[];
 for(const m of refs){
  const ref=m[1],part=defs.get(ref);if(!part)continue;
  const clef=part.match(/\\clef\s+"?(treble|bass)"?/)?.[1];if(!clef)continue;
  const prefix=text.slice(0,m.index);
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
 const blocks=namedBlocks(text),global=blocks.get('global')??'';
 const found=[],re=/\b([A-Za-z][A-Za-z0-9_]*)\s*=\s*\\(relative|fixed)\s+([a-g](?:isis|eses|is|es)?[',]*)\s*\{/g;
 for(const m of text.matchAll(re)){
  const b=blockFrom(text,m.index+m[0].length),whole=(m[0]+b.body+'}').replace(/\\global\b/g,global);
  const explicit=whole.match(/\\clef\s+"?(treble|bass)"?/)?.[1];
  const inferred=/^(?:upper|right|rechts)$/i.test(m[1])?'treble':/^(?:lower|left|links)$/i.test(m[1])?'bass':null;
  const clef=explicit??inferred;
  if(clef)found.push({clef,name:clef==='bass'?'Klavier links':'Klavier rechts',part:(explicit?'':'\\clef '+clef+' ')+whole});
 }
 const treble=found.find(x=>x.clef==='treble'),bass=found.find(x=>x.clef==='bass');
 return treble&&bass?[treble,bass]:null;
}
function meterUnits(meter){
 const m=/^(\d+)\/(\d+)$/.exec(meter);if(!m)throw Error('Ungültige Taktart: '+meter);
 const units=Number(m[1])*8/Number(m[2]);
 if(!['3/4','4/4','6/8'].includes(meter))throw Error('Derzeit nur 3/4, 4/4 und 6/8 unterstützt.');
 return units;
}
function abcLength(length){
 if(length===1)return '';
 if(Number.isInteger(length))return String(length);
 const doubled=Math.round(length*2);
 return doubled%2===1?doubled+'/2':String(length);
}
function parsePart(item){
 const part=item.part,clef=part.match(/\\clef\s+"?(treble|bass)"?/)?.[1]??item.clef;
 if(!clef)throw Error('Nur Violin- und Bassschlüssel unterstützt.');
 const firstMeter=part.match(/\\time\s+(\d+\/\d+)/)?.[1];
 if(!firstMeter)throw Error('Keine unterstützte Taktart gefunden.');
 meterUnits(firstMeter);
 const key=keyInfo(part),mode=part.match(/\\(fixed|relative)\s+([a-g](?:isis|eses|is|es)?[',]*)\s*\{/);
 let body,modeType,anchor;
 if(mode){const b=blockFrom(part,mode.index+mode[0].length);body=cleanMusicBody(b.body);modeType=mode[1];anchor=mode[2];}
 else{body=cleanMusicBody(part);modeType='absolute';anchor='c';}
 const tokenRe=/@M\d+\/\d+@|@T\d+\/\d+@|@E@|<[^>]+>\d*\.?|q\d*\.?|[rR]\d*\.?|[a-g](?:isis|eses|is|es)?[',]*\d*\.?|\|/g;
 const matches=[...body.matchAll(tokenRe)],tokens=matches.map(m=>m[0]);
 let cursor=0,unsupported='';
 for(const m of matches){
  const gap=body.slice(cursor,m.index);
  if(gap.trim()){unsupported=gap.trim();break;}
  cursor=m.index+m[0].length;
 }
 if(!unsupported&&body.slice(cursor).trim())unsupported=body.slice(cursor).trim();
 if(unsupported)throw Error('Nicht unterstützte LilyPond-Anweisung im Notenblock: '+unsupported.replace(/\s+/g,' ').slice(0,120));
 const beamBar=events=>{let out='';for(let i=0;i<events.length;i++){const e=events[i],prev=events[i-1];const join=prev&&prev.length===1&&e.length===1&&prev.start%2===0&&e.start===prev.start+1;out+=(i&&!join?' ':'')+e.abc;}return out;};
 let previous=absoluteAnchor(anchor),lastLength=null,lastChord=null,bar=[],duration=0,currentMeter=firstMeter,tupletFactor=1,pendingTuplet='';const bars=[];
 const convertPitch=token=>{
  const spec=pitchSpec(token),step='cdefgab'.indexOf(spec.letter);let octave;
  if(modeType==='fixed'||modeType==='absolute')octave=3+[...spec.marks].reduce((n,c)=>n+(c==="'"?1:-1),0);
  else{const prevStep=((previous%7)+7)%7;let delta=step-prevStep;while(delta>3)delta-=7;while(delta< -3)delta+=7;previous+=delta+7*[...spec.marks].reduce((n,c)=>n+(c==="'"?1:-1),0);octave=Math.floor(previous/7);}
  return abcPitch(spec,octave);
 };
 const pushBar=()=>{
  // LilyPond itself permits incomplete/irregular measures in valid input.
  // Preserve the explicit bar structure instead of rejecting music solely
  // because its summed durations do not exactly equal the current meter.
  bars.push({abc:beamBar(bar),meter:currentMeter});bar=[];duration=0;
 };
 for(const token of tokens){
  if(token.startsWith('@T')){
   const tm=/^@T(\d+)\/(\d+)@$/.exec(token);if(!tm)throw Error('Ungültige Tuplet-Angabe.');
   tupletFactor=Number(tm[2])/Number(tm[1]);pendingTuplet='('+tm[1]+':'+tm[2];continue;
  }
  if(token==='@E@'){tupletFactor=1;continue;}
  if(token.startsWith('@M')){
   if(bar.length||duration)throw Error('Taktwechsel nur an Taktgrenzen unterstützt.');
   const next=token.slice(2,-1);meterUnits(next);currentMeter=next;continue;
  }
  if(token==='|'){if(!bar.length&&duration===0)continue;pushBar();continue;}
  const m=/^(<([^>]+)>|q|[rR]|([a-g](?:isis|eses|is|es)?[',]*))(\d*)(\.)?$/.exec(token);
  if(!m)throw Error('Nicht unterstütztes Notenereignis: '+token);
  const lilyLength=m[4]?Number(m[4]):lastLength;if(![1,2,4,8,16,32].includes(lilyLength))throw Error('Nicht unterstützter Notenwert.');
  lastLength=lilyLength;let length=8/lilyLength;if(m[5])length*=1.5;const actualLength=length*tupletFactor,start=duration;duration+=actualLength;
  let abc;if(m[1]==='r'||m[1]==='R')abc='z'+abcLength(length);
  else if(m[1]==='q'){
   if(!lastChord)throw Error('q ohne vorherigen Akkord.');
   abc=lastChord+abcLength(length);
  }else if(m[2]){
   const chordTokens=m[2].trim().split(/\s+/),notes=[];let firstReference=null;
   for(const chordToken of chordTokens){notes.push(convertPitch(chordToken));if(firstReference===null&&modeType==='relative')firstReference=previous;}
   if(firstReference!==null)previous=firstReference;
   lastChord='['+notes.join('')+']';abc=lastChord+abcLength(length);
  }else{
   abc=convertPitch(m[3])+abcLength(length);
  }
  if(pendingTuplet){abc=pendingTuplet+abc;pendingTuplet='';}
  bar.push({abc,length:actualLength,start});
 }
 if(bar.length)pushBar();
 return {...item,clef,key,bars,firstMeter};
}
function safeName(name){return String(name||'').replace(/"/g,'').trim();}
export function lilyToAbc(input){
 const text=input.replace(/%[^\n]*/g,'');
 if(!/\\version\s+"[^"]+"/.test(text))throw Error('Keine LilyPond-Version gefunden.');
 const title=text.match(/title\s*=\s*"([^"]*)"/)?.[1]??'LilyPond-Import';
 let items=referencedVariableStaves(text)??ensembleStaves(text)??contextVoiceStaves(text)??directEnsembleStaves(text);
 if(!items&&text.includes('\\new PianoStaff'))items=directPianoStaves(text)??namedRelativePiano(text);
 if(!items)throw Error('Keine unterstützten Notensysteme gefunden.');
 const parsed=items.map(parsePart),key=parsed[0].key,bars=parsed[0].bars.length,initialMeter=parsed[0].firstMeter;
 if(parsed.some(x=>x.key!==key))throw Error('Die Systeme verwenden unterschiedliche Tonarten.');
 if(parsed.some(x=>x.bars.length!==bars))throw Error('Die Systeme haben unterschiedlich viele Takte.');
 const meterMap=parsed[0].bars.map(x=>x.meter);
 // In LilyPond a time-signature command can appear in only one staff while visually governing the score.
 // Use the first staff as the score-level meter map; other staves keep the same bar boundaries.
 if(parsed.some(x=>x.firstMeter!==initialMeter))throw Error('Die Systeme beginnen mit unterschiedlichen Taktarten.');
 const tempoMatch=text.match(/\\tempo\s+(?:"[^"]+"\s*)?(\d+)(\.)?\s*=\s*(\d+)/);
 const tempoBeat=tempoMatch?(tempoMatch[1]+(tempoMatch[2]?'.':'')):'4',tempo=Number(tempoMatch?.[3]??80);
 const qBeat=tempoBeat==='4.'?'3/8':tempoBeat==='4'?'1/4':tempoBeat==='8.'?'3/16':'1/'+tempoBeat.replace('.','');
 const ids=parsed.length===2?['RH','LH']:parsed.map((_,i)=>'V'+(i+1));
 const score=parsed.length===2?'{RH LH}':parsed.length===3?'V1 {V2 V3}':ids.join(' ');
 const lines=['X:1','T:'+title,'M:'+initialMeter,'L:1/8','Q:'+qBeat+'='+tempo,'K:'+key,'%%barsperstaff 4','%%score '+score];
 parsed.forEach((x,i)=>lines.push('V:'+ids[i]+' clef='+x.clef+' name="'+safeName(x.name)+'"'));
 parsed.forEach((x,i)=>{
  let meter=initialMeter;
  const rendered=x.bars.map((b,bi)=>{const scoreMeter=meterMap[bi]??meter;const prefix=bi>0&&scoreMeter!==meter?'[M:'+scoreMeter+'] ':'';meter=scoreMeter;return prefix+b.abc;});
  lines.push('[V:'+ids[i]+'] '+rendered.join(' | ')+' |]');
 });
 return lines.join('\n');
}
