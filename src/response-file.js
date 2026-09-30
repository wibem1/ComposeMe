function fencedBlocks(text){const out=[];const re=/```([^\n\r]*)\r?\n([\s\S]*?)```/g;let m;while((m=re.exec(String(text||''))))out.push({language:m[1].trim().toLowerCase(),content:m[2].trim()});return out;}
export function extractResponseCode(text){
 const blocks=fencedBlocks(text);
 const lily=blocks.find(x=>/^(lilypond|ly)$/.test(x.language));if(lily)return{format:'lilypond',content:lily.content};
 const abc=blocks.find(x=>x.language==='abc');if(abc)return{format:'abc',content:abc.content};
 const xml=blocks.find(x=>/^(musicxml|xml)$/.test(x.language)&&/<score-(?:partwise|timewise)\b/i.test(x.content));if(xml)return{format:'musicxml',content:xml.content};
 const raw=String(text||'').trim();
 if(/\\version\s*"[^"]+"/.test(raw)&&/\\score\s*\{/.test(raw))return{format:'lilypond',content:raw};
 if(/(^|\n)X:\s*\d+/m.test(raw)&&/(^|\n)K:/m.test(raw))return{format:'abc',content:raw};
 if(/<score-(?:partwise|timewise)\b/i.test(raw)&&/<part-list\b/i.test(raw))return{format:'musicxml',content:raw};
 return{format:'text',content:raw};
}
function safeName(s){return String(s||'ComposeMe-Ausgabe').normalize('NFKD').replace(/[<>:"/\\|?*\u0000-\u001f]/g,'-').replace(/\s+/g,' ').trim().slice(0,80)||'ComposeMe-Ausgabe';}
function titleFor(format,content){
 if(format==='lilypond'){const m=content.match(/\btitle\s*=\s*"([^"]+)"/);if(m)return m[1];}
 if(format==='abc'){const m=content.match(/(?:^|\n)T:\s*([^\n\r]+)/);if(m)return m[1].trim();}
 if(format==='musicxml'){const m=content.match(/<work-title>([^<]+)<\/work-title>/i)||content.match(/<movement-title>([^<]+)<\/movement-title>/i);if(m)return m[1].trim();}
 return'ComposeMe-Ausgabe';
}
export function responseFile(text){
 const parsed=extractResponseCode(text);
 const extension=parsed.format==='lilypond'?'.ly':parsed.format==='abc'?'.abc':parsed.format==='musicxml'?'.musicxml':'.txt';
 const mime=parsed.format==='musicxml'?'application/vnd.recordare.musicxml+xml;charset=utf-8':'text/plain;charset=utf-8';
 return{...parsed,extension,mime,filename:safeName(titleFor(parsed.format,parsed.content))+extension};
}
export function hacklilyUrl(text){const parsed=extractResponseCode(text);if(parsed.format!=='lilypond')throw new Error('Die aktuelle Ausgabe enthält keinen LilyPond-Code.');return'https://www.hacklily.org/#src='+encodeURIComponent(parsed.content);}
