export function safeExportName(abc){
 const name=String(abc||'').match(/^T:\s*(.*)$/m)?.[1]?.trim()||'Komposition';
 return name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9 _-]+/g,'').trim().replace(/\s+/g,'_').slice(0,60)||'Komposition';
}
export function normalizeMidiBinary(data){
 const payload=Array.isArray(data)&&data.length===1?data[0]:data;
 if(payload instanceof Uint8Array)return payload;
 if(payload instanceof ArrayBuffer)return new Uint8Array(payload);
 if(ArrayBuffer.isView(payload))return new Uint8Array(payload.buffer,payload.byteOffset,payload.byteLength);
 if(Array.isArray(payload))return Uint8Array.from(payload);
 if(typeof payload==='string')return Uint8Array.from(payload,ch=>ch.charCodeAt(0)&255);
 throw Error('MIDI-Binärformat nicht verfügbar.');
}
export function assertMidiFile(bytes){
 if(!(bytes instanceof Uint8Array)||bytes.length<14)throw Error('MIDI-Datei ist leer oder unvollständig.');
 if(String.fromCharCode(...bytes.slice(0,4))!=='MThd')throw Error('MIDI-Datei hat keinen gültigen Header.');
 return bytes;
}
export function svgFileText(svg,title='Noten'){
 if(!svg)throw Error('Für SVG muss ein Notenbild sichtbar sein.');
 const clone=svg.cloneNode(true);
 if(!clone.getAttribute('xmlns'))clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
 return '<?xml version="1.0" encoding="UTF-8"?>\n<!-- '+String(title).replaceAll('--','—')+' -->\n'+clone.outerHTML;
}

export function printableHtml(svg,title='Noten'){
 if(!svg)throw Error('Für PDF/Druck muss ein Notenbild sichtbar sein.');
 const safe=String(title).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
 return '<!doctype html><html lang="de"><head><meta charset="utf-8"><title>'+safe+'</title><style>@page{size:A4 landscape;margin:10mm}html,body{margin:0;padding:0}body{font-family:system-ui;padding:10mm}button{padding:10px 14px;font:inherit;margin-bottom:12px}svg{display:block;width:100%;height:auto}@media print{button,p{display:none}body{padding:0}}</style></head><body><button onclick="window.print()">Drucken / Als PDF sichern</button><p>Im Druckdialog „Als PDF sichern“ wählen.</p>'+svg.outerHTML+'</body></html>';
}
