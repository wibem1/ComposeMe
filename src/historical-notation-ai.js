import {extractUsage,estimateCost} from './cost-control.js';

export const MUSICXML_NOTATION_INSTRUCTION=`Übertrage die folgende bereits fertig komponierte JSON-Partitur ausschließlich in vollständiges, gut lesbares MusicXML 4.0.

WICHTIG:
- Keine musikalischen Änderungen.
- Keine Töne hinzufügen, entfernen, transponieren oder zeitlich verschieben.
- Tempo, Taktart, Instrumente, Tonhöhen, Einsatzzeiten und Dauern müssen der JSON-Partitur entsprechen.
- Du darfst ausschließlich notatorische Entscheidungen treffen: sinnvolle Stimmenaufteilung, Pausen, Haltebögen über Taktstriche, Balkung, enharmonische Schreibweise, Schlüssel und bei Klavier die lesbare Verteilung auf zwei Systeme.
- Bewahre vorhandene optionale Notennamen/Schreibweisen aus dem JSON, soweit sie eindeutig sind.
- Verwende für Klavier EINEN Part mit zwei Staves (staff 1 Violin-, staff 2 Bassschlüssel), nicht zwei getrennte Klavier-Instrumente.
- Verwende für jedes Instrument genau einen MusicXML-Part.
- Setze divisions, duration, voice, type, staff, backup/forward und tie/tied konsistent, sodass alle Takte rhythmisch vollständig sind.
- Instrumentnamen und Part-Gruppierung sollen einer normalen Partitur entsprechen.
- Antworte ausschließlich mit dem vollständigen XML-Dokument. Keine Erklärung, kein Markdown-Codeblock.

JSON-PARTITUR:
`;


export function normalizeMusicXmlInstruction(instruction){
 const text=String(instruction||'').trim();
 if(!text)return MUSICXML_NOTATION_INSTRUCTION;
 const legacyAbc=/Erzeuge ABC, das von abcjs dargestellt werden kann\.|beginnend mit X:1|saubere, gut lesbare ABC-Notation/i.test(text);
 return legacyAbc?MUSICXML_NOTATION_INSTRUCTION:text;
}

export function buildMusicXmlNotationPrompt(scoreJson,instruction=MUSICXML_NOTATION_INSTRUCTION){
 const json=String(scoreJson||'').trim();
 if(!json)throw new Error('JSON-Partitur für die Notation fehlt.');
 const head=normalizeMusicXmlInstruction(instruction);
 if(!head)throw new Error('Notationsanweisung ist leer.');
 return head+'\n\n'+json;
}

export function extractMusicXmlOnly(text){
 let s=String(text||'').trim();
 s=s.replace(/^\s*\`\`\`(?:xml|musicxml)?\s*/i,'').replace(/\s*\`\`\`\s*$/,'').trim();
 const starts=[s.indexOf('<?xml'),s.indexOf('<score-partwise'),s.indexOf('<score-timewise')].filter(i=>i>=0);
 if(!starts.length)throw new Error('Die KI-Antwort enthält kein MusicXML-Dokument.');
 s=s.slice(Math.min(...starts)).trim();
 if(!/<score-(?:partwise|timewise)\b/i.test(s))throw new Error('MusicXML enthält kein score-partwise/score-timewise.');
 if(!/<part-list\b/i.test(s))throw new Error('MusicXML enthält keine part-list.');
 if(!/<part\s+id=/i.test(s))throw new Error('MusicXML enthält keine Parts.');
 if(!/<measure\s+number=/i.test(s))throw new Error('MusicXML enthält keine Takte.');
 if(!/<\/score-(?:partwise|timewise)>\s*$/i.test(s))throw new Error('MusicXML ist nicht vollständig abgeschlossen.');
 return s+'\n';
}

export async function requestMusicXmlNotation({
 scoreJson,apiKey,model='gpt-5.6-sol',instruction=MUSICXML_NOTATION_INSTRUCTION,
 fetchImpl=fetch,onProgress=()=>{}
}){
 const prompt=buildMusicXmlNotationPrompt(scoreJson,instruction);
 if(!apiKey)throw new Error('OpenAI-API-Key fehlt.');
 const body={model,input:[{role:'user',content:[{type:'input_text',text:prompt}]}],store:false,max_output_tokens:64000,reasoning:{effort:'none'}};
 const call={stage:'notation_musicxml',prompt,response:'',usage:null,status:'started',recovery:null};
 onProgress('Noten werden als MusicXML gesetzt …');
 const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(),300000),started=Date.now();
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
  call.response=raw||'';
  call.elapsedMs=Date.now()-started;
  call.usage=extractUsage('openai',data);
  call.apiStatus=data?.status||'unknown';
  call.incompleteDetails=data?.incomplete_details||null;
  if(!raw.trim()){
   call.status='failed';
   const err=new Error('Die KI hat keinen MusicXML-Text zurückgegeben.');
   err.notationCall=call;throw err;
  }
  if(data?.status==='incomplete'){
   call.status='failed';
   const reason=data?.incomplete_details?.reason||'unbekannter Grund';
   const err=new Error('MusicXML-Antwort unvollständig ('+reason+').');
   err.notationCall=call;throw err;
  }
 }finally{clearTimeout(timeout);}
 try{
  const musicXml=extractMusicXmlOnly(raw);
  call.status='completed';
  return {musicXml,call,estimatedCost:estimateCost(model,call.usage)};
 }catch(err){
  call.status='failed';
  err.notationCall=call;
  throw err;
 }
}
