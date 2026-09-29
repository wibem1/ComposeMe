import {extractUsage,estimateCost} from './cost-control.js';

export const ABC_NOTATION_INSTRUCTION=`Übertrage die folgende bereits fertig komponierte JSON-Partitur ausschließlich in saubere, gut lesbare ABC-Notation.

WICHTIG:
- Keine musikalischen Änderungen.
- Keine Töne hinzufügen, entfernen, transponieren oder zeitlich verschieben.
- Tempo, Taktart, Instrumente, Tonhöhen, Einsatzzeiten und Dauern müssen der JSON-Partitur entsprechen.
- Du darfst ausschließlich notatorische Entscheidungen treffen: sinnvolle Stimmenaufteilung, Pausen, Bindungen über Taktstriche, Balkung, enharmonische Schreibweise und bei Klavier die lesbare Verteilung auf Violin- und Basssystem.
- Bewahre vorhandene optionale Notennamen/Schreibweisen aus dem JSON, soweit sie eindeutig sind.
- Für Klavier verwende zwei gekoppelte Systeme, wenn die Musik das sinnvoll erfordert.
- Erzeuge ABC, das von abcjs dargestellt werden kann.
- Antworte ausschließlich mit dem vollständigen ABC-Text, beginnend mit X:1. Keine Erklärung, kein Markdown-Codeblock.

JSON-PARTITUR:
`;

export function buildAbcNotationPrompt(scoreJson,instruction=ABC_NOTATION_INSTRUCTION){
 const json=String(scoreJson||'').trim();
 if(!json)throw new Error('JSON-Partitur für die Notation fehlt.');
 const head=String(instruction||'').trim();
 if(!head)throw new Error('Notationsanweisung ist leer.');
 return head+'\n\n'+json;
}

export function extractAbcOnly(text){
 let s=String(text||'').trim();
 s=s.replace(/^\s*\`\`\`(?:abc)?\s*/i,'').replace(/\s*\`\`\`\s*$/,'').trim();
 const i=s.search(/^X\s*:/m);
 if(i<0)throw new Error('Die KI-Antwort enthält kein ABC ab X:1.');
 s=s.slice(i).trim();
 if(!/^X\s*:\s*1\b/m.test(s))throw new Error('ABC beginnt nicht mit X:1.');
 if(!/^K\s*:/m.test(s))throw new Error('ABC enthält keine Tonartzeile K:.');
 return s+'\n';
}

export async function requestAbcNotation({
 scoreJson,apiKey,model='gpt-5.6-sol',instruction=ABC_NOTATION_INSTRUCTION,
 fetchImpl=fetch,onProgress=()=>{}
}){
 const prompt=buildAbcNotationPrompt(scoreJson,instruction);
 if(!apiKey)throw new Error('OpenAI-API-Key fehlt.');
 const body={model,input:[{role:'user',content:[{type:'input_text',text:prompt}]}],store:false};
 const call={stage:'notation_abc',prompt,response:'',usage:null,status:'started',recovery:null};
 onProgress('Noten werden als ABC gesetzt …');
 const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),180000),started=Date.now();
 let data,raw;
 try{
  const res=await fetchImpl('https://api.openai.com/v1/responses',{
   method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+apiKey},
   body:JSON.stringify(body),signal:abort.signal
  });
  if(!res.ok)throw new Error('API '+res.status+': '+(await res.text()).slice(0,450));
  data=await res.json();
  const parts=[];
  if(typeof data.output_text==='string')parts.push(data.output_text);
  else for(const item of data.output||[])for(const c of item.content||[])if(typeof c.text==='string')parts.push(c.text);
  raw=parts.join('\n');
  if(!raw.trim())throw new Error('Die KI hat keinen ABC-Text zurückgegeben.');
 }finally{clearTimeout(timeout);}
 call.response=raw;call.status='completed';call.elapsedMs=Date.now()-started;
 call.usage=extractUsage('openai',data);
 const abc=extractAbcOnly(raw);
 return {abc,call,estimatedCost:estimateCost(model,call.usage)};
}
