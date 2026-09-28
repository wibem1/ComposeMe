import {recognizeNotation} from './notation-recognition.js?v=0.6.14';
import {normalizeAbcForAbcjs} from './music-view.js?v=0.6.14';
import {abcToMusicXml} from './abc-to-musicxml.js';
import {safeExportName,normalizeMidiBinary,assertMidiFile,svgFileText} from './export-core.js';

function download(data,file,type){
 const blob=data instanceof Blob?data:new Blob([data],{type});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download=file;document.body.append(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function printable(svg,abc){
 if(!svg)throw Error('Für PDF/Druck muss ein Notenbild sichtbar sein.');
 const w=window.open('','_blank');
 if(!w)throw Error('Druckfenster blockiert. Bitte Pop-ups für diese Seite erlauben.');
 const title=abc.match(/^T:\s*(.*)$/m)?.[1]?.trim()||'Noten';
 const safe=title.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 w.document.open();
 w.document.write('<!doctype html><html lang="de"><head><meta charset="utf-8"><title>'+safe+'</title><style>@page{size:A4 landscape;margin:10mm}html,body{margin:0;padding:0}body{font-family:system-ui;padding:10mm}button{padding:10px 14px;font:inherit;margin-bottom:12px}svg{display:block;width:100%;height:auto}@media print{button,p{display:none}body{padding:0}}</style></head><body><button onclick="window.print()">Drucken / Als PDF sichern</button><p>Im Druckdialog „Als PDF sichern“ wählen.</p>'+svg.outerHTML+'</body></html>');
 w.document.close();w.focus();
}
export function createExportBar(host,{record,ABCJS,paper,onStatus=()=>{}}){
 const notation=recognizeNotation(record?.aiResponse??'');
 if(!notation.abc)return;
 const abc=normalizeAbcForAbcjs(notation.abc);
 const wrap=document.createElement('div');wrap.className='export-bar';
 const label=document.createElement('label');label.textContent='Export';
 const select=document.createElement('select');select.setAttribute('aria-label','Exportformat');
 for(const [value,name] of [
  ['abc','ABC'],
  ['midi','MIDI'],
  ['musicxml','MusicXML'],
  ['svg','SVG'],
  ['pdf','PDF / Drucken']
 ])select.add(new Option(name,value));
 const btn=document.createElement('button');btn.type='button';btn.textContent='Exportieren';
 const message=document.createElement('small');message.className='export-status';message.setAttribute('role','status');
 const report=text=>{message.textContent=text;onStatus(text);};
 btn.addEventListener('click',()=>{
  try{
   const base=safeExportName(abc),format=select.value;
   if(format==='abc'){
    download(abc+'\n',base+'.abc','text/vnd.abc;charset=utf-8');
    report('ABC gespeichert: '+base+'.abc');
   }else if(format==='midi'){
    if(!ABCJS?.synth?.getMidiFile)throw Error('MIDI-Modul nicht geladen.');
    const raw=ABCJS.synth.getMidiFile(abc,{midiOutputType:'binary'});
    const bytes=assertMidiFile(normalizeMidiBinary(raw));
    download(bytes,base+'.mid','audio/midi');
    report('MIDI gespeichert: '+base+'.mid');
   }else if(format==='musicxml'){
    const xml=abcToMusicXml(abc);
    if(!xml.includes('<score-partwise'))throw Error('MusicXML konnte nicht erzeugt werden.');
    download(xml,base+'.musicxml','application/vnd.recordare.musicxml+xml;charset=utf-8');
    report('MusicXML gespeichert: '+base+'.musicxml');
   }else if(format==='svg'){
    const svg=paper?.querySelector('svg');
    download(svgFileText(svg,base),base+'.svg','image/svg+xml;charset=utf-8');
    report('SVG gespeichert: '+base+'.svg');
   }else if(format==='pdf'){
    printable(paper?.querySelector('svg'),abc);
    report('Druckansicht geöffnet.');
   }
  }catch(err){report('Exportfehler: '+err.message);}
 });
 label.append(select);wrap.append(label,btn,message);host.append(wrap);
 return wrap;
}
