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
