import {runSoundFirst,draftPrompt,notationPrompt} from '../../src/sound-first-experiment.js?v=0.1';
import {recognizeNotation} from '../../src/notation-recognition.js?v=0.7.9';
import {renderMusic} from '../../src/music-view.js?v=0.7.9';
const $=id=>document.getElementById(id);
let last=null,lastAbc='';
function download(text,name,type='application/json'){
 const blob=new Blob([text],{type});const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
function showPrompts(task,draft=''){
 $('prompts').textContent='STUFE 1:\n'+draftPrompt(task)+(draft?'\n\nSTUFE 2:\n'+notationPrompt(task,draft):'\n\nSTUFE 2 erscheint nach dem musikalischen Entwurf.');
}
$('provider').addEventListener('change',()=>{
 $('model').value={openai:'gpt-5.6-sol',google:'gemini-3.1-pro-preview',anthropic:'claude-sonnet-5'}[$('provider').value];
});
$('experiment').addEventListener('submit',async event=>{
 event.preventDefault();
 const task=$('task').value.trim(),provider=$('provider').value,model=$('model').value.trim(),apiKey=$('key').value.trim();
 if(!task||!model||!apiKey){$('status').textContent='Bitte Auftrag, Modell und API-Schlüssel ausfüllen.';return;}
 $('start').disabled=true;$('save-abc').disabled=true;$('save-diagnosis').disabled=true;
 $('draft').textContent='Warte auf die musikalische Idee …';$('realization').textContent='';
 $('paper').replaceChildren();$('audio').replaceChildren();$('warning').textContent='';$('cost').textContent='';
 last=null;lastAbc='';showPrompts(task);
 try {
  last=await runSoundFirst({task,provider,model,apiKey,onStage:e=>{
   if(e.status==='started')$('status').textContent=e.stage==='musical_draft'?'Stufe 1: musikalische Vorstellung entsteht …':'Stufe 2: eigenständige ABC-Ausarbeitung entsteht …';
   else if(e.stage==='musical_draft'){
    $('draft').textContent=e.call.response;showPrompts(task,e.call.response);
   }
  }});
  $('realization').textContent=last.notation;
  const n=recognizeNotation(last.notation);lastAbc=n.abc;
  if(lastAbc){
   try{renderMusic({abc:lastAbc,ABCJS:window.ABCJS,paper:$('paper'),audio:$('audio')});$('save-abc').disabled=false;}
   catch(err){$('warning').textContent='Notenanzeige/Wiedergabe: '+err.message+' – die Original-Antwort bleibt gespeichert.';}
  }else $('warning').textContent='Keine darstellbare ABC-Partitur gefunden. Die Original-Antwort und alle Anfragen bleiben verfügbar.';
  $('status').textContent='Beide KI-Aufrufe abgeschlossen. Musikalische Qualität bitte durch Hören beurteilen.';
 }catch(error){
  if(error.experiment){last=error.experiment;$('draft').textContent=last.calls.find(x=>x.stage==='musical_draft')?.response||$('draft').textContent;
    if(last.draft)showPrompts(task,last.draft);
  }
  $('status').textContent='Versuch abgebrochen: '+error.message+'. Keine automatische Wiederholung und keine zusätzlichen KI-Aufrufe.';
 }finally{
  $('start').disabled=false;
  if(last){
   $('save-diagnosis').disabled=false;
   if(last.calls?.length){const c=last.calls,priced=c.filter(x=>Number.isFinite(x.estimatedCost));$('cost').textContent=c.length+' KI-Aufruf(e), '+(priced.length===c.length?'geschätzte Kosten: '+priced.reduce((sum,x)=>sum+x.estimatedCost,0).toFixed(4)+' USD':'geschätzte Kosten teilweise nicht verfügbar');}
  }
 }
});
$('save-abc').addEventListener('click',()=>lastAbc&&download(lastAbc+'\n','composeme-klangexperiment.abc','text/vnd.abc;charset=utf-8'));
$('save-diagnosis').addEventListener('click',()=>last&&download(JSON.stringify({app:'ComposeMe Klangexperiment',version:'0.1',createdAt:new Date().toISOString(),...last},null,2)+'\n','ComposeMe-Klangexperiment-Diagnose.json'));
