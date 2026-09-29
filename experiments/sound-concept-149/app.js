/* Isolated historical A/B baseline. Historical engine file is copied byte-for-byte from Minimal-Composer commit 37fa33d636. */
const $=id=>document.getElementById(id);
const engine=window.CompositionEngine;
const STORAGE='composeme-historical-149:results';
let current=null;
let playback=null;
function showStatus(msg,error=false){$('status').textContent=msg;$('status').classList.toggle('error',error);}
function safeRecord(run){return {app:'ComposeMe isolated historical experiment',source:'Minimal Composer 0.5.99',engine:'1.4.0-experiment',method:'historical-unchanged',recordedAt:new Date().toISOString(),...run};}
function download(data,name,mime){const blob=new Blob([data],{type:mime});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000);}
function cleanHeaders(h){const o={...h};for(const k of Object.keys(o))if(/authorization|x-api-key/i.test(k))o[k]='[REDACTED]';return o;}
function showRecord(record){
 current=record;
 $('concept').value=record?.run?.soundConcept||'';
 $('json').value=record?.rawScore||'';
 $('protocol').textContent=JSON.stringify(record?.protocol||[],null,2);
 $('summary').textContent=record?.run?.score?(`${record.run.score.title||'Ohne Titel'} · ${record.run.score.bpm} BPM · ${record.run.profile?.barCount||'?'} Takte · ${record.run.score.tracks?.length||0} Spuren`):'Kein vollständiger Notensatz';
 for(const id of ['midi','diagnosis','play'])$(id).disabled=!record?.run?.score;
}
function loadHistory(){
 let items=[];try{items=JSON.parse(localStorage.getItem(STORAGE)||'[]');}catch{}
 $('history').replaceChildren(new Option('Gespeicherte Versuche',''),...items.map((r,i)=>new Option(`${r.recordedAt} · ${r.run?.score?.title||'Unvollständig'}`,String(i))));
 return items;
}
function store(record){const old=loadHistory();old.unshift(record);try{localStorage.setItem(STORAGE,JSON.stringify(old.slice(0,12)));}catch(e){showStatus('Ergebnis liegt vor, aber lokaler Speicher voll. Diagnose sofort speichern.',true);}loadHistory();}
function stop(){
 if(playback){for(const o of playback.oscillators){try{o.stop()}catch{}}playback.ctx.close().catch(()=>{});playback=null;}
 $('stop').disabled=true;
}
function play(score){
 stop();
 const ctx=new(window.AudioContext||window.webkitAudioContext)(),t0=ctx.currentTime+.05,spb=60/(Number(score.bpm)||120),oscillators=[];
 for(const[ti,tr]of(score.tracks||[]).entries())for(const n of(tr.notes||[])){
  if(!Array.isArray(n)||n.length<4)continue;
  const start=t0+Number(n[0])*spb,dur=Math.max(.03,Number(n[1])*spb),freq=440*Math.pow(2,(Number(n[2])-69)/12),vel=Math.max(.02,Math.min(1,Number(n[3])/127));
  const o=ctx.createOscillator(),g=ctx.createGain();o.type=ti%3===1?'triangle':'sine';o.frequency.value=freq;
  g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(.13*vel,start+.015);g.gain.setValueAtTime(.13*vel,Math.max(start+.02,start+dur-.05));g.gain.exponentialRampToValueAtTime(.0001,start+dur);
  o.connect(g).connect(ctx.destination);o.start(start);o.stop(start+dur+.02);oscillators.push(o);
 }
 playback={ctx,oscillators};$('stop').disabled=false;
}
async function performRequest({snapshot,key,promptText,stage,run,event},protocol){
 const template=engine.makeRequest(snapshot.provider,snapshot.model,promptText,stage);
 const req=engine.actualRequest(template,key);
 const body=JSON.stringify(req.body),sha=await engine.sha256Text(body);
 const rec={stage,at:new Date().toISOString(),request:{url:template.url,method:'POST',headers:cleanHeaders(template.headers),body:req.body,sha256:sha}};
 protocol.push(rec);event('ai_request_frozen',{stage,bodySha256:sha});
 showStatus(stage==='sound_concept'?'1/2: Klingende Vorstellung entsteht …':'2/2: Partitur entsteht …');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),180000),started=performance.now();
 try{
  const response=await fetch(req.url,{method:'POST',headers:req.headers,body,signal:controller.signal});
  const raw=await response.text();
  rec.response={status:response.status,elapsedMs:Math.round(performance.now()-started),rawBody:raw};
  if(!response.ok)throw new Error(`API ${response.status}: ${raw.slice(0,350)}`);
  const parsed=JSON.parse(raw),text=engine.extractText(snapshot.provider,parsed);
  rec.response.extractedModelText=text;
  if(!text.trim())throw new Error('Leere KI-Antwort in '+stage);
  event('ai_model_text_extracted',{stage,characters:text.length});
  return text;
 }finally{clearTimeout(timer);}
}
$('form').addEventListener('submit',async ev=>{
 ev.preventDefault();
 const key=$('key').value.trim(),task=$('task').value.trim();
 if(!key||!task){showStatus('OpenAI-Key und Auftrag erforderlich.',true);return;}
 const snapshot={visibleTask:task,provider:'openai',model:'gpt-5.6-sol'};
 $('go').disabled=true;stop();const protocol=[];
 try{
  // Invoke original 0.5.99 engine unchanged, including its compact score parser and original MIDI builder.
  const result=await engine.compose({snapshot,key,runId:'historical-'+Date.now(),now:()=>new Date().toISOString(),requestModel:args=>performRequest(args,protocol),usedTitles:[]});
  const record=safeRecord({run:result.run,rawScore:protocol.find(c=>c.stage==='score_realization')?.response?.extractedModelText||'',protocol,midiBytes:Array.from(result.midiBytes)});
  store(record);showRecord(record);
  showStatus('Fertig. Historische zwei Aufrufe unverändert; MIDI lokal erzeugt. Bitte musikalisch beurteilen.');
 }catch(e){const record=safeRecord({status:'failed',error:String(e.message||e),task,protocol});
  current=record;$('protocol').textContent=JSON.stringify(protocol,null,2);
  showStatus('Versuch fehlgeschlagen: '+(e.message||String(e))+' · Das bisherige Protokoll kann gespeichert werden.',true);
  $('diagnosis').disabled=false;
 }finally{$('go').disabled=false;}
});
$('midi').addEventListener('click',()=>{if(current?.midiBytes?.length)download(new Uint8Array(current.midiBytes),'composeme-historical-149.mid','audio/midi');});
$('diagnosis').addEventListener('click',()=>{if(current){const {midiBytes,...r}=current;download(JSON.stringify(r,null,2)+'\n','composeme-historical-149-diagnose.json','application/json');}});
$('play').addEventListener('click',()=>{if(current?.run?.score)play(current.run.score);});
$('stop').addEventListener('click',stop);
$('history').addEventListener('change',()=>{const idx=$('history').value;if(idx==='')return;const records=loadHistory();showRecord(records[Number(idx)]);});
loadHistory();showStatus('Historische Engine geladen. Zwei KI-Aufrufe, keine zusätzlichen Kompositionsregeln.');
