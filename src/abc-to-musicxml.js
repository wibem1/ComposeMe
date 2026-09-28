const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');

const KEY_FIFTHS={
  C:0,G:1,D:2,A:3,E:4,B:5,'F#':6,'C#':7,
  F:-1,Bb:-2,Eb:-3,Ab:-4,Db:-5,Gb:-6,Cb:-7,
  Am:0,Em:1,Bm:2,'F#m':3,'C#m':4,'G#m':5,'D#m':6,'A#m':7,
  Dm:-1,Gm:-2,Cm:-3,Fm:-4,Bbm:-5,Ebm:-6,Abm:-7
};
const SHARPS=['F','C','G','D','A','E','B'],FLATS=['B','E','A','D','G','C','F'];

function parseFraction(text){
 const m=/^(\d+)\s*\/\s*(\d+)$/.exec(String(text).trim());
 if(!m||!Number(m[2]))throw Error('MusicXML: ungültiger Bruch '+text);
 return Number(m[1])/Number(m[2]);
}
function keyInfo(raw){
 const key=String(raw||'C').trim().split(/\s+/)[0].replace(/min$/i,'m');
 const fifths=KEY_FIFTHS[key];
 if(fifths==null)throw Error('MusicXML: Tonart derzeit nicht unterstützt: '+raw);
 const altered=new Map();
 if(fifths>0)for(let i=0;i<fifths;i++)altered.set(SHARPS[i],1);
 if(fifths<0)for(let i=0;i<-fifths;i++)altered.set(FLATS[i],-1);
 return {fifths,altered};
}
function timeInfo(raw){
 const m=/^(\d+)\s*\/\s*(\d+)$/.exec(String(raw||'4/4').trim());
 if(!m)throw Error('MusicXML: ungültige Taktart: '+raw);
 return {beats:Number(m[1]),beatType:Number(m[2])};
}
function voiceName(id,props){
 const m=/\bname\s*=\s*"([^"]+)"/.exec(props);
 if(m)return m[1];
 if(/vln|violin/i.test(id+' '+props))return 'Violine';
 if(/pno|piano|rh|lh/i.test(id+' '+props))return 'Klavier';
 return id;
}
function voiceProgram(id,props){
 const label=(id+' '+props).toLowerCase();
 return /vln|violin|violine/.test(label)?41:1;
}
function parseScoreGroups(score,voiceIds){
 if(!score)return voiceIds.map(id=>[id]);
 const rest=score.replace(/^%%score\s*/,'').trim();
 const groups=[];let i=0;
 while(i<rest.length){
  if(/\s/.test(rest[i])){i++;continue;}
  if(rest[i]==='{'){
   const end=rest.indexOf('}',i+1);if(end<0)throw Error('MusicXML: ungültige %%score-Anordnung.');
   const ids=rest.slice(i+1,end).trim().split(/\s+/).filter(Boolean);
   if(ids.length)groups.push(ids);i=end+1;continue;
  }
  if(rest[i]==='('){
   const end=rest.indexOf(')',i+1);if(end<0)throw Error('MusicXML: ungültige %%score-Anordnung.');
   const ids=rest.slice(i+1,end).trim().split(/\s+/).filter(Boolean);
   for(const id of ids)groups.push([id]);
   i=end+1;continue;
  }
  const m=/^[A-Za-z0-9_-]+/.exec(rest.slice(i));
  if(m){groups.push([m[0]]);i+=m[0].length;continue;}
  i++;
 }
 const known=new Set(groups.flat());
 for(const id of voiceIds)if(!known.has(id))groups.push([id]);
 return groups.length?groups:voiceIds.map(id=>[id]);
}
function cleanBody(body){
 return body
  .replace(/"[^"]*"/g,' ')
  .replace(/![^!]*!/g,' ')
  .replace(/\+[^+]*\+/g,' ')
  .replace(/\{[^{}]*\}/g,' ')
  .replace(/\[[KMQ]:[^\]]+\]/g,' ')
  .replace(/%\S.*$/gm,' ')
  .replace(/\(\d+(?::\d+(?::\d+)?)?/g,' ')
  .replace(/[()<>~-]/g,' ');
}
function splitMeasures(body){
 const cleaned=cleanBody(body).replace(/\|\]/g,'|').replace(/\|\|/g,'|').replace(/:\|/g,'|').replace(/\|:/g,'|');
 return cleaned.split('|').map(x=>x.trim()).filter(Boolean);
}
function parseLen(suffix,unitWhole){
 if(!suffix)return unitWhole;
 if(/^\d+$/.test(suffix))return unitWhole*Number(suffix);
 if(/^\/+$/.test(suffix))return unitWhole/Math.pow(2,suffix.length);
 let m=/^\/(\d+)$/.exec(suffix);if(m)return unitWhole/Number(m[1]);
 m=/^(\d+)\/(\d*)$/.exec(suffix);if(m)return unitWhole*Number(m[1])/(m[2]?Number(m[2]):2);
 throw Error('MusicXML: ungültige Notenlänge '+suffix);
}
function pitchData(token,keyAlter,state){
 const m=/^(\^\^|\^|__|_|=)?([A-Ga-g])([,']*)$/.exec(token);
 if(!m)throw Error('MusicXML: ungültige Tonhöhe '+token);
 const accidental=m[1]||'',step=m[2].toUpperCase();
 let octave=m[2]===m[2].toLowerCase()?5:4;
 for(const ch of m[3])octave+=ch==="'"?1:-1;
 const stateKey=step+octave;
 let alter;
 if(accidental){
  alter=accidental==='^^'?2:accidental==='^'?1:accidental==='__'?-2:accidental==='_'?-1:0;
  state.set(stateKey,alter);
 }else alter=state.has(stateKey)?state.get(stateKey):(keyAlter.get(step)||0);
 return {step,octave,alter};
}
function typeForWhole(whole){
 const candidates=[
  [1,'whole'],[0.75,'half',true],[0.5,'half'],[0.375,'quarter',true],[0.25,'quarter'],
  [0.1875,'eighth',true],[0.125,'eighth'],[0.09375,'16th',true],[0.0625,'16th'],
  [0.03125,'32nd'],[0.015625,'64th']
 ];
 for(const [value,type,dot] of candidates)if(Math.abs(whole-value)<1e-9)return {type,dot:Boolean(dot)};
 return {type:null,dot:false};
}
function noteXml({pitch,rest,durationWhole,divisions,staff,chord=false}){
 const duration=Math.round(durationWhole*4*divisions);
 if(duration<=0)throw Error('MusicXML: ungültige Dauer.');
 const t=typeForWhole(durationWhole);
 const pitchXml=rest?'<rest/>':('<pitch><step>'+pitch.step+'</step>'+(pitch.alter?'<alter>'+pitch.alter+'</alter>':'')+'<octave>'+pitch.octave+'</octave></pitch>');
 return '<note>'+(chord?'<chord/>':'')+pitchXml+'<duration>'+duration+'</duration>'+(t.type?'<type>'+t.type+'</type>':'')+(t.dot?'<dot/>':'')+(staff?'<staff>'+staff+'</staff>':'')+'</note>';
}
function parseMeasure(body,{unitWhole,keyAlter,divisions,staff}){
 const events=[];let i=0,total=0;const accidentalState=new Map();
 const lenPattern='(?:\\d+(?:\\/\\d*)?|\\/+\\d*)?';
 while(i<body.length){
  if(/\s/.test(body[i])){i++;continue;}
  if(body[i]==='['){
   const end=body.indexOf(']',i+1);if(end<0)throw Error('MusicXML: offener Akkord.');
   const inside=body.slice(i+1,end).trim();
   if(/^[A-Z]:/.test(inside)){i=end+1;continue;}
   const notes=inside.match(/(?:\^\^|\^|__|_|=)?[A-Ga-g][,']*/g);
   if(!notes?.length)throw Error('MusicXML: ungültiger Akkord.');
   let j=end+1;const lm=new RegExp('^('+lenPattern+')').exec(body.slice(j));const suffix=lm?.[1]||'';j+=suffix.length;
   const whole=parseLen(suffix,unitWhole);
   notes.forEach((n,k)=>events.push(noteXml({pitch:pitchData(n,keyAlter,accidentalState),durationWhole:whole,divisions,staff,chord:k>0})));
   total+=whole;i=j;continue;
  }
  const tokenRe=new RegExp('^((?:\\^\\^|\\^|__|_|=)?[A-Ga-g][,\\']*|[zZx])('+lenPattern+')');
  const m=tokenRe.exec(body.slice(i));
  if(!m)throw Error('MusicXML: nicht unterstützte ABC-Syntax bei „'+body.slice(i,i+24)+'“.');
  const whole=parseLen(m[2]||'',unitWhole),rest=/^[zZx]$/.test(m[1]);
  events.push(noteXml({pitch:rest?null:pitchData(m[1],keyAlter,accidentalState),rest,durationWhole:whole,divisions,staff}));
  total+=whole;i+=m[0].length;
 }
 return {xml:events.join(''),whole:total};
}
function parseAbc(abc){
 const lines=String(abc||'').replace(/\r\n?/g,'\n').split('\n');
 const header=new Map(),voices=new Map(),bodies=new Map();let score='';
 for(const raw of lines){
  const line=raw.trim();if(!line||line.startsWith('%')&&!line.startsWith('%%score'))continue;
  let m=/^%%score\b(.*)$/.exec(line);if(m){score='%%score '+m[1].trim();continue;}
  m=/^V:([A-Za-z0-9_-]+)\s*(.*)$/.exec(line);
  if(m){if(!voices.has(m[1]))voices.set(m[1],m[2]);continue;}
  m=/^\[V:([A-Za-z0-9_-]+)\]\s*(.*)$/.exec(line);
  if(m){bodies.set(m[1],(bodies.get(m[1])||'')+' '+m[2]);continue;}
  m=/^([A-Z]):\s*(.*)$/.exec(line);
  if(m){if(!header.has(m[1]))header.set(m[1],m[2]);continue;}
  if(/^%%MIDI\b/.test(line))continue;
  if(/^[A-Za-z0-9_-]+:\s/.test(line))continue;
  throw Error('MusicXML: nicht unterstützte ABC-Zeile: '+line.slice(0,80));
 }
 if(!voices.size){
  voices.set('V1','');
  const bodyLines=lines.filter(x=>!/^\s*(?:[A-Z]:|%)/.test(x)).join(' ');
  bodies.set('V1',bodyLines);
 }
 for(const id of voices.keys())if(!bodies.has(id))throw Error('MusicXML: Musik für Stimme '+id+' fehlt.');
 return {header,voices,bodies,score};
}
export function abcToMusicXml(abc){
 const {header,voices,bodies,score}=parseAbc(abc);
 const meter=timeInfo(header.get('M')||'4/4'),unitWhole=parseFraction(header.get('L')||'1/8');
 const key=keyInfo(header.get('K')||'C'),divisions=960;
 const voiceIds=[...voices.keys()],groups=parseScoreGroups(score,voiceIds);
 const title=header.get('T')||'Komposition';
 const partList=[],parts=[];
 groups.forEach((group,pi)=>{
  const partId='P'+(pi+1),isGrand=group.length===2;
  const props=voices.get(group[0])||'',name=isGrand?'Klavier':voiceName(group[0],props);
  const program=isGrand?1:voiceProgram(group[0],props);
  partList.push('<score-part id="'+partId+'"><part-name>'+xml(name)+'</part-name><score-instrument id="'+partId+'-I1"><instrument-name>'+xml(name)+'</instrument-name></score-instrument><midi-instrument id="'+partId+'-I1"><midi-channel>'+(pi+1)+'</midi-channel><midi-program>'+program+'</midi-program></midi-instrument></score-part>');
  const voiceMeasures=group.map(id=>splitMeasures(bodies.get(id)));
  const count=Math.max(...voiceMeasures.map(x=>x.length));
  if(!count)throw Error('MusicXML: keine Takte gefunden.');
  if(voiceMeasures.some(x=>x.length!==count))throw Error('MusicXML: Stimmen haben unterschiedliche Taktzahlen.');
  const measures=[];
  for(let mi=0;mi<count;mi++){
   const attrs=mi===0?('<attributes><divisions>'+divisions+'</divisions><key><fifths>'+key.fifths+'</fifths></key><time><beats>'+meter.beats+'</beats><beat-type>'+meter.beatType+'</beat-type></time>'+(isGrand?'<staves>2</staves>':'')+(isGrand?'<clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>':'<clef><sign>'+(/clef=bass/.test(props)?'F':'G')+'</sign><line>'+(/clef=bass/.test(props)?'4':'2')+'</line></clef>')+'</attributes>'):'';
   const parsed=group.map((id,si)=>parseMeasure(voiceMeasures[si][mi],{unitWhole,keyAlter:key.altered,divisions,staff:isGrand?si+1:null}));
   let body=attrs+parsed[0].xml;
   if(isGrand){
    const backup=Math.round(meter.beats*4/meter.beatType*divisions);
    body+='<backup><duration>'+backup+'</duration></backup>'+parsed[1].xml;
   }
   measures.push('<measure number="'+(mi+1)+'">'+body+'</measure>');
  }
  parts.push('<part id="'+partId+'">'+measures.join('')+'</part>');
 });
 return '<?xml version="1.0" encoding="UTF-8"?>\n<score-partwise version="4.0"><work><work-title>'+xml(title)+'</work-title></work><movement-title>'+xml(title)+'</movement-title><part-list>'+partList.join('')+'</part-list>'+parts.join('')+'</score-partwise>';
}
