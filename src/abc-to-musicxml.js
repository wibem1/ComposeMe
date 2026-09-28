// Deliberately strict ABC -> MusicXML for the supported two-staff/one-staff scores.
// If an ABC feature cannot be represented safely, fail instead of silently changing music.
const xml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&apos;');
const pitchXml=(note)=>{
 const m=/^([A-Ga-g])([,']*)$/.exec(note);
 if(!m)throw Error('MusicXML: nicht unterstützte Tonhöhe: '+note);
 const step=m[1].toUpperCase(),base=m[1]===m[1].toLowerCase()?5:4;
 const octave=base+[...m[2]].reduce((n,c)=>n+(c==="'"?1:-1),0);
 return '<pitch><step>'+step+'</step><octave>'+octave+'</octave></pitch>';
};
function noteXml(token,length,chord=false){
 const duration=length*504;
 const kinds={1:'eighth',2:'quarter',4:'half',8:'whole'};
 const kind=kinds[length];
 if(!kind)throw Error('MusicXML: Notenlänge derzeit nicht unterstützt.');
 return '<note>'+(chord?'<chord/>':'')+pitchXml(token)+'<duration>'+duration+'</duration><type>'+kind+'</type></note>';
}
function voiceMeasures(line){
 const bars=line.replace(/\s*\|\]\s*$/,'').trim().split(/\s*\|\s*/);
 if(!bars.length||bars.some(x=>!x.trim()))throw Error('MusicXML: ungültige Takte.');
 return bars.map(body=>{
  const events=[];let pos=0,sum=0;
  const event=/(\[[A-Ga-g,']+\]|[A-Ga-g][,']*)(\d*)/gy;
  while(pos<body.length){
   if(/\s/.test(body[pos])){pos++;continue;}
   event.lastIndex=pos;
   const m=event.exec(body);
   if(!m)throw Error('MusicXML: nicht unterstützte ABC-Syntax bei '+body.slice(pos, pos+20));
   const length=m[2]?Number(m[2]):1;
   if(![1,2,4,8].includes(length))throw Error('MusicXML: nicht unterstützte Notenlänge.');
   const notes=m[1].startsWith('[')?m[1].slice(1,-1).match(/[A-Ga-g][,']*/g):[m[1]];
   if(!notes?.length||notes.join('')!==m[1].replace(/[\[\]]/g,''))throw Error('MusicXML: ungültiger Akkord.');
   events.push(notes.map((note,i)=>noteXml(note,length,i>0)).join(''));sum+=length;pos=event.lastIndex;
  }
  if(sum!==8)throw Error('MusicXML: Taktlänge weicht von 4/4 ab.');
  return events.join('');
 });
}
export function abcToMusicXml(abc){
 const lines=abc.split(/\r?\n/),header=new Map(),voices=[],body=new Map();
 for(const line of lines){
  let m=/^V:([A-Za-z0-9_-]+)\s*(.*)$/.exec(line.trim());
  if(m){voices.push({id:m[1],clef:/clef=bass/.test(m[2])?'bass':'treble'});continue;}
  m=/^([A-Z]):\s*(.*)$/.exec(line.trim());
  if(m){header.set(m[1],m[2]);continue;}
  m=/^\[V:([A-Za-z0-9_-]+)\]\s*(.*)$/.exec(line.trim());
  if(m){body.set(m[1],(body.get(m[1])||'')+' '+m[2]);continue;}
  if(line.trim()&&!/^(%%score|%)/.test(line.trim()))throw Error('MusicXML: nicht unterstützte ABC-Zeile.');
 }
 if(header.get('K')!=='C'||header.get('M')!=='4/4'||header.get('L')!=='1/8')throw Error('MusicXML unterstützt derzeit C-Dur, 4/4 und L:1/8.');
 if(!voices.length||voices.some(v=>!body.has(v.id)))throw Error('MusicXML: Stimmen fehlen.');
 const names=voices.map((v,i)=>'<score-part id="P'+(i+1)+'"><part-name>'+(voices.length===2?(i?'Klavier links':'Klavier rechts'):'Klavier')+'</part-name><part-abbreviation>Pno</part-abbreviation><score-instrument id="I'+(i+1)+'"><instrument-name>Piano</instrument-name></score-instrument><midi-instrument id="I'+(i+1)+'"><midi-channel>'+(i+1)+'</midi-channel><midi-program>1</midi-program></midi-instrument></score-part>').join('');
 const parts=voices.map((v,i)=>{
  const measures=voiceMeasures(body.get(v.id));
  const attributes='<attributes><divisions>1008</divisions><key><fifths>0</fifths></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>'+(v.clef==='bass'?'F':'G')+'</sign><line>'+(v.clef==='bass'?'4':'2')+'</line></clef></attributes>';
  return '<part id="P'+(i+1)+'">'+measures.map((notes,k)=>'<measure number="'+(k+1)+'">'+(k===0?attributes:'')+notes+'</measure>').join('')+'</part>';
 }).join('');
 return '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE score-partwise  PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">\n<score-partwise version="4.0"><work><work-title>'+xml(header.get('T')||'Komposition')+'</work-title></work><movement-title>'+xml(header.get('T')||'Komposition')+'</movement-title><defaults/><part-list>'+names+'</part-list>'+parts+'</score-partwise>';
}
