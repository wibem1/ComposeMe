import {recognizeNotation} from './notation-recognition.js?v=0.5.2';
import {abcToMusicXml} from './abc-to-musicxml.js';
function lilySource(text){
 const fenced=typeof text==='string'&&text.match(/`{3}(?:lilypond|ly)\s*\n([\s\S]*?)\n`{3}/i);
 return fenced?.[1]??(typeof text==='string'&&text.includes('\\version')?text.slice(text.indexOf('\\version')).trim():null);
}
function nameFor(abc,extension){
 const name=abc.match(/^T:\s*(.*)$/m)?.[1]?.trim()||'Komposition';
 return name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 _-]+/g,'').trim().replace(/\s+/g,'_').slice(0,60)||'Komposition';
}
function download(data,file,type){
 const blob=data instanceof Blob?data:new Blob([data],{type});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=file;document.body.append(link);link.click();link.remove();
 // Wait before revoking: Safari/iOS needs time to start the download.
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function printable(svg,abc){
 if(!svg)throw Error('Für PDF muss ein Notenbild sichtbar sein.');
 const w=window.open('','_blank');
 if(!w)throw Error('Druckfenster blockiert. Bitte Pop-ups für diese Seite erlauben.');
 const title=abc.match(/^T:\s*(.*)$/m)?.[1]?.trim()||'Noten';
 // SVG is produced by abcjs from already-rendered notation, not from arbitrary AI HTML.
 w.document.open();w.document.write('<!doctype html><html lang="de"><head><meta charset="utf-8"><title>'+title.replaceAll('&','&amp;').replaceAll('<','&lt;')+'</title><style>@page{size:A4 landscape;margin:12mm}body{font-family:system-ui;margin:16px}button{padding:12px;font:inherit;margin-bottom:16px}svg{max-width:100%;height:auto}@media print{button,p{display:none}body{margin:0}}</style></head><body><button onclick="window.print()">Drucken / Als PDF sichern</button><p>Im Druckdialog „Als PDF sichern“ wählen.</p>'+svg.outerHTML+'</body></html>');w.document.close();w.focus();
}
export function createExportBar(host,{record,ABCJS,paper,onStatus=()=>{}}){
 const notation=recognizeNotation(record?.aiResponse??'');
 if(!notation.abc){return;}
 const wrap=document.createElement('div');wrap.className='export-bar';
 const label=document.createElement('label');label.textContent='Export';
 const select=document.createElement('select');select.setAttribute('aria-label','Exportformat');
 for(const [value,name] of [['abc','ABC'],['lilypond','LilyPond (Original)'],['midi','MIDI'],['musicxml','MusicXML'],['pdf','PDF / Drucken']]){
  if(value==='lilypond'&&!lilySource(record.aiResponse))continue;
  select.add(new Option(name,value));
 }
 const btn=document.createElement('button');btn.type='button';btn.textContent='Exportieren';
 const message=document.createElement('small');message.className='export-status';message.setAttribute('role','status');
 const report=text=>{message.textContent=text;onStatus(text);};
 btn.addEventListener('click',()=>{
  try{
   const abc=notation.abc,base=nameFor(abc),format=select.value;
   if(format==='abc')download(abc+'\n',base+'.abc','text/plain;charset=utf-8');
   else if(format==='lilypond')download(lilySource(record.aiResponse)+'\n',base+'.ly','text/plain;charset=utf-8');
   else if(format==='musicxml')download(abcToMusicXml(abc),base+'.musicxml','application/vnd.recordare.musicxml+xml');
   else if(format==='midi'){
    const data=ABCJS?.synth?.getMidiFile?.(abc,{midiOutputType:'binary'});
    if(!data||(data instanceof Blob&&data.size<14))throw Error('MIDI konnte nicht erzeugt werden.');
    if(typeof data==='string')throw Error('MIDI-Binärformat nicht verfügbar.');
    download(data,base+'.mid','audio/midi');
   }else if(format==='pdf')printable(paper.querySelector('svg'),abc);
   report(format==='pdf'?'Druckfenster geöffnet – dort als PDF sichern.':'Export vorbereitet: '+base+'.'+({abc:'abc',lilypond:'ly',musicxml:'musicxml',midi:'mid'}[format]));
  }catch(err){report('Exportfehler: '+err.message);}
 });
 label.append(select);wrap.append(label,btn,message);host.append(wrap);
 return wrap;
}
