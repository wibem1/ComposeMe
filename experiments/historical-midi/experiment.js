import {runHistoricalMidi,buildMidi} from '../../src/historical-midi-experiment.js?v=0.1';
const $=id=>document.getElementById(id);
let state=null,midiData=null,audioCtx=null,scheduled=[];
function saveFile(bytes,name,type){const blob=new Blob([bytes],{type});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),30000);}
function stop(){for(const x of scheduled){try{x.stop()}catch{}}scheduled=[];$('stop').disabled=true;}
function play(score){stop();const Context=window.AudioContext||window.webkitAudioContext;if(!Context){$('status').textContent='Browser unterstützt keinen Kontrollklang.';return;}if(!audioCtx)audioCtx=new Context();audioCtx.resume();const t0=audioCtx.currentTime+.1,seconds=60/Number(score.bpm||120);for(const [i,tr] of score.tracks.entries())for(const n of tr.notes){if(!Array.isArray(n)||n.length<4)continue;const start=t0+Number(n[0])*seconds,duration=Math.max(.04,Number(n[1])*seconds),velocity=Math.max(.02,Math.min(1,Number(n[3])/127)),osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type=i%2?'triangle':'sine';osc.frequency.value=440*Math.pow(2,(Number(n[2])-69)/12);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.13*velocity,start+.018);gain.gain.setValueAtTime(.13*velocity,Math.max(start+.02,start+duration-.05));gain.gain.exponentialRampToValueAtTime(.0001,start+duration);osc.connect(gain).connect(audioCtx.destination);osc.start(start);osc.stop(start+duration+.02);scheduled.push(osc);}$('stop').disabled=false;}
$('provider').addEventListener('change',()=>{$('model').value={openai:'gpt-5.6-sol',google:'gemini-3.1-pro-preview',anthropic:'claude-sonnet-5'}[$('provider').value];});
$('test').addEventListener('submit',async e=>{
 e.preventDefault();stop();$('go').disabled=true;$('midi').disabled=true;$('play').disabled=true;$('diagnosis').disabled=true;
 state=null;midiData=null;$('draft').textContent='Warte …';$('protocol').textContent='Noch keine vollständige Antwort.';$('usage').textContent='';$('title').textContent='';
 const args={mode:$('mode').value,task:$('task').value.trim(),provider:$('provider').value,model:$('model').value.trim(),apiKey:$('key').value.trim()};
 try{
  state=await runHistoricalMidi({...args,onStage:x=>{
    $('status').textContent=x.status==='started'?(x.stage==='musical_draft'?'Stufe 1: musikalischer Entwurf …':'Komponiere technische Partitur …'):'Stufe '+x.stage+' abgeschlossen.';
    if(x.stage==='musical_draft'&&x.status==='done')$('draft').textContent=x.entry.response;
  }});
  if(args.mode==='direct')$('draft').textContent='Direktmodus: kein separater musikalischer Entwurf.';
  midiData=buildMidi(state.score);$('title').textContent='Titel: '+(state.score.title||'ohne Titel')+' · Tempo: '+state.score.bpm+' BPM';
  $('play').disabled=false;$('midi').disabled=false;$('status').textContent='KI-Antwort vollständig empfangen und MIDI-Daten lokal erzeugt. Die Musik wurde nicht automatisch korrigiert.';
 }catch(err){
  state=err.partialResult??null;
  if(state?.draft)$('draft').textContent=state.draft;
  $('status').textContent='Versuch nicht abgeschlossen: '+err.message+' (keine automatische Wiederholung).';
 }finally{
  $('go').disabled=false;
  if(state){
   $('diagnosis').disabled=false;
   $('protocol').textContent=state.calls.map(c=>'STUFE: '+c.stage+'\\nPROMPT:\\n'+c.prompt+'\\n\\nROHANTWORT:\\n'+c.response).join('\\n\\n──────────\\n\\n');
   const costs=state.calls.map(c=>c.estimatedCost);$('usage').textContent=state.calls.length+' KI-Aufrufe; '+(costs.every(Number.isFinite)?'geschätzte Kosten '+costs.reduce((a,b)=>a+b,0).toFixed(4)+' USD':'Kosten nicht vollständig berechenbar');
  }
 }
});
$('play').addEventListener('click',()=>state?.score&&play(state.score));
$('stop').addEventListener('click',stop);
$('midi').addEventListener('click',()=>midiData&&saveFile(midiData,'composeme-'+(state.method==='historical'?'historisch':'direkt')+'.mid','audio/midi'));
$('diagnosis').addEventListener('click',()=>state&&saveFile(JSON.stringify({app:'ComposeMe',experiment:'exact-historical-midi-v0.1',createdAt:new Date().toISOString(),...state},null,2),'ComposeMe-'+state.method+'-Diagnose.json','application/json'));
