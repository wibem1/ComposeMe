// Deliberately narrow LilyPond importer. Reject unknown syntax rather than changing notes.
export function lilyToAbc(input){
 const text=input.replace(/%[^\n]*/g,'');
 const version=text.match(/\\version\s+"([^"]+)"/);
 if(!version)throw Error('Keine LilyPond-Version gefunden.');
 const title=text.match(/title\s*=\s*"([^"]*)"/)?.[1]??'LilyPond-Import';
 const staves=[...text.matchAll(/\\new Staff\s*\{/g)];
 if(staves.length!==2||!text.includes('\\new PianoStaff'))throw Error('Derzeit nur PianoStaff mit genau zwei Staff-Systemen.');
 const parts=staves.map((m)=>{
  let depth=1,end=m.index+m[0].length;
  while(depth&&end<text.length){if(text[end]==='{')depth++;if(text[end]==='}')depth--;end++;}
  if(depth)throw Error('Unvollständiges Staff-System.');
  return text.slice(m.index+m[0].length,end-1);
 });
 const beamBar=(events)=>{let output='';for(let i=0;i<events.length;i++){const e=events[i],prev=events[i-1];const pair=prev&&prev.length===1&&e.length===1&&prev.start%2===0&&e.start===prev.start+1;output+=(i&&!pair?' ':'')+e.abc;}return output;};
 const parse=(part)=>{
  const clef=part.match(/\\clef\s+(treble|bass)\b/)?.[1];
  if(!clef)throw Error('Nur Violin- und Bassschlüssel unterstützt.');
  if(!/\\key\s+c\s+\\major\b/.test(part))throw Error('Derzeit nur C-Dur unterstützt.');
  if(!/\\time\s+4\/4\b/.test(part))throw Error('Derzeit nur 4/4 unterstützt.');
  const mode=part.match(/\\(fixed|relative)\s+c('{0,2})\s*\{/);
  if(!mode)throw Error("Unterstützt werden \\fixed c, \\fixed c' und \\relative c''.");
  if(mode[1]==='relative'&&mode[2]!=="''")throw Error("Derzeit wird \\relative c'' erwartet.");
  let start=mode.index+mode[0].length,depth=1,end=start;
  while(depth&&end<part.length){if(part[end]==='{')depth++;if(part[end]==='}')depth--;end++;}
  if(depth)throw Error('Unvollständiger Notenblock.');
  const remainder=part.slice(0,mode.index)+part.slice(end);
  const permitted=/\\(?:clef\s+(?:treble|bass)|key\s+c\s+\\major|time\s+4\/4|tempo\s+(?:"[^"]+"\s*)?4\s*=\s*\d+)\s*/g;
  if(remainder.replace(permitted,'').trim())throw Error('Nicht unterstützte Anweisung außerhalb des Notenblocks.');
  let body=part.slice(start,end-1).replace(/\\bar\s+"\|\."/, '');
  const tokens=body.match(/<[^>]+>\d*|[a-g](?:'{1,2}|,{1,2})?\d*|\|/g)??[];
  if(tokens.join('').replace(/\s/g,'')!==body.replace(/\s/g,''))throw Error('Nicht unterstützte Noten oder Anweisungen.');
  let previous=5*7;const pitch=(p)=>{const m=p.match(/^([a-g])('{0,2}|,{1,2})$/);if(!m)throw Error('Ungültige Tonhöhe: '+p);const marks=m[2];const letter=m[1].toUpperCase();let octave;if(mode[1]==='fixed'){octave=3+(marks.startsWith("'")?marks.length:-marks.length);}else{const step='cdefgab'.indexOf(m[1]);const prevStep=((previous%7)+7)%7;let delta=step-prevStep;while(delta>3)delta-=7;while(delta< -3)delta+=7;previous+=delta+7*(marks.startsWith("'")?marks.length:-marks.length);octave=Math.floor(previous/7);}if(octave===4)return letter;if(octave>4)return letter.toLowerCase()+"'".repeat(octave-5);return letter+','.repeat(4-octave);};
  const bars=[];let bar=[],duration=0,lastLength=null;
  for(const token of tokens){
   if(token==='|'){if(duration!==8)throw Error('Takt hat nicht genau vier Viertel.');bars.push(beamBar(bar));bar=[];duration=0;continue;}
   const match=token.match(/^(<([^>]+)>|([a-g][',]*))(\d*)$/);
   if(!match)throw Error('Nicht unterstütztes Notenereignis: '+token);
   const length=match[4]?Number(match[4]):lastLength;if(![1,2,4,8].includes(length))throw Error('Nicht unterstützter Notenwert.');
   lastLength=length;const abcLength=8/length;duration+=abcLength;
   const notes=match[2]?match[2].trim().split(/\s+/).map(pitch):[pitch(match[3])];
   bar.push({abc:(notes.length>1?'['+notes.join('')+']':notes[0])+(abcLength===1?'':abcLength),length:abcLength,start:duration-abcLength});
  }
  if(bar.length){if(duration!==8)throw Error('Letzter Takt unvollständig.');bars.push(beamBar(bar));}
  return {clef,bars};
 };
 const [top,bottom]=parts.map(parse);
 if(top.bars.length!==bottom.bars.length||top.bars.length!==8)throw Error('Beide Systeme müssen acht Takte enthalten.');
 const tempo=Number(text.match(/\\tempo\s+(?:"[^"]+"\s*)?4\s*=\s*(\d+)/)?.[1]??80);
 return ['X:1','T:'+title,'M:4/4','L:1/8','Q:1/4='+tempo,'K:C','%%score {RH LH}','V:RH clef=treble','V:LH clef=bass','[V:RH] '+top.bars.join(' | ')+' |]','[V:LH] '+bottom.bars.join(' | ')+' |]'].join('\n');
}
