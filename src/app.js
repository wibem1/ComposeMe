import {runPureMidiComposition,formatPureMidiProtocol,PURE_MIDI_TECHNICAL_CONTRACT} from './pure-midi-compose.js?v=0.8.48';
import {runClassicComposition,formatClassicProtocol} from './classic-compose.js?v=0.8.36';
import {buildDisplayMidi} from './display-midi.js?v=0.8.48';
import {formatHistoricalProtocol} from './historical-compose.js?v=0.8.36';
import {initHistoricalControls,renderHistoricalScore} from './historical-ui.js?v=0.8.36';
import {formatCostLine,todayTotals} from './cost-control.js?v=0.8.36';import {setupPwa} from './pwa.js?v=0.8.36';import {createBackup,restoreBackup,createKeyBackup,restoreKeyBackup,createDiagnostic,downloadJson} from './technical-tools.js?v=0.8.36';import {compose} from './compose.js?v=0.8.36';import {recognizeNotation} from './notation-recognition.js?v=0.8.36';import {formatCommunicationRecord} from './communication-protocol.js?v=0.8.36';import {createKeyStore} from './key-store.js';import {modelsFor} from './model-catalog.js';import {createPreferenceStore} from './preference-store.js';import {createExperimentStore} from './experiment-store.js';import {comparisonPair} from './comparison.js';import {formatHistoryDiagnostic} from './history-diagnostic.js';import {comparisonCandidates,chooseComparison} from './comparison-selection.js';import {responseFile,hacklilyUrl} from './response-file.js?v=0.8.36';import {historyLabel} from './history-label.js?v=0.8.36';
const $=id=>document.getElementById(id);const form=$('compose-form'),status=$('status'),result=$('result'),protocol=$('protocol'),provider=$('provider'),model=$('model'),customModel=$('custom-model'),history=$('history'),deleteHistory=$('delete-history'),paper=$('paper'),audio=$('audio'),copyToInput=$('copy-to-input'),comparison=$('comparison'),comparisonChoice=$('comparison-choice'),singleResult=$('single-result'),resultViewTitle=$('result-view-title'),diagnostic=$('history-diagnostic'),linkOriginal=$('link-original'),linkVariant=$('link-variant'),linkButton=$('link-button'),copyResponse=$('copy-response'),saveResponse=$('save-response'),openScoreApp=$('open-score-app'),backupSave=$('backup-save'),backupLoad=$('backup-load'),backupFile=$('backup-file'),keyBackupSave=$('key-backup-save'),keyBackupLoad=$('key-backup-load'),keyBackupFile=$('key-backup-file'),diagnosticSave=$('diagnostic-save'),costSummary=$('cost-summary'),installApp=$('install-app'),keyOpenAI=$('api-key-openai'),keyAnthropic=$('api-key-anthropic'),keyGoogle=$('api-key-google');const keys=createKeyStore(localStorage),prefs=createPreferenceStore(localStorage),experiments=createExperimentStore(localStorage);let currentId=null,renderedMidiKey=null;const VIEW_KEY='minimal-composer-next:last-view';function saveView(otherId=null){if(currentId)try{localStorage.setItem(VIEW_KEY,JSON.stringify({id:currentId,otherId}));}catch{}}
function fillModels(){const saved=prefs.get(`model:${provider.value}`);model.replaceChildren(...modelsFor(provider.value).map(([value,label])=>new Option(label,value)),new Option('Anderes Modell …','__custom__'));const known=[...model.options].some(o=>o.value===saved);model.value=known&&saved?saved:(model.options[0]?.value??'__custom__');customModel.hidden=model.value!=='__custom__';if(!known&&saved){model.value='__custom__';customModel.value=saved;customModel.hidden=false;}}
const historicalControls=initHistoricalControls();const DEFAULT_ADDITIONAL=$('additional').value.trim();const PROCESS_ADDITIONAL_KEY='composeme:additional-by-process';let lastProcess=$('composition-process').value;let loadingHistoryAdditional=false;function loadAdditionalMap(){try{return JSON.parse(localStorage.getItem(PROCESS_ADDITIONAL_KEY)||'{}')||{};}catch{return {};}}
function withVisiblePureMidiContract(text){
 const current=String(text??'').trim();
 const marker='TECHNISCHE AUSGABEANFORDERUNG – MIDI-EREIGNISSE:';
 if(!current.includes(marker))return current?current+'\n\n'+PURE_MIDI_TECHNICAL_CONTRACT:PURE_MIDI_TECHNICAL_CONTRACT;
 if(current.includes('feines musikalisches Raster von 1/16-Noten'))return current;
 const prefix=current.slice(0,current.indexOf(marker)).trim();
 return prefix?prefix+'\n\n'+PURE_MIDI_TECHNICAL_CONTRACT:PURE_MIDI_TECHNICAL_CONTRACT;
}
function initializePureMidiTemplate(){
 const key='composeme:pure-midi-visible-template-v3';
 if(localStorage.getItem(key)==='1')return;
 const map=loadAdditionalMap();
 map['pure-midi']=withVisiblePureMidiContract(map['pure-midi']);
 localStorage.setItem(PROCESS_ADDITIONAL_KEY,JSON.stringify(map));
 localStorage.setItem(key,'1');
}
function saveAdditionalForProcess(mode,text){const map=loadAdditionalMap();map[mode]=String(text??'');localStorage.setItem(PROCESS_ADDITIONAL_KEY,JSON.stringify(map));}
function defaultAdditionalForProcess(mode){return mode==='pure-midi'?PURE_MIDI_TECHNICAL_CONTRACT:DEFAULT_ADDITIONAL;}
function historicalAdditionalText(x,mode){
 const saved=typeof x?.appAdditions==='string'?x.appAdditions:'';
 return saved||defaultAdditionalForProcess(mode);
}
function loadAdditionalForProcess(mode){const map=loadAdditionalMap();$('additional').value=Object.prototype.hasOwnProperty.call(map,mode)?map[mode]:defaultAdditionalForProcess(mode);}
const keyInputs={openai:keyOpenAI,anthropic:keyAnthropic,google:keyGoogle};function loadAllKeys(){for(const [name,input] of Object.entries(keyInputs)){const saved=keys.get(name);if(saved)input.value=saved;}}function currentKey(){return keyInputs[provider.value]?.value.trim()??'';}function loadProvider(){fillModels();}function providerLabel(){return provider.value==='openai'?'OpenAI':provider.value==='anthropic'?'Anthropic':provider.value==='google'?'Google':provider.value;}function selectedModel(){return model.value==='__custom__'?customModel.value.trim():model.value;}function renderCostSummary(record=null){
  const t=todayTotals(experiments.list());
  const current=record?formatCostLine(record):'noch keine Verbrauchsdaten';
  const today=t.count
    ?(t.priced===t.count
      ?'heute insgesamt ca. '+t.cost.toFixed(4)+' USD'
      :'heute: '+t.count+' Anfragen, davon '+t.priced+' preislich berechenbar'+(t.priced?' · mindestens '+t.cost.toFixed(4)+' USD':''))
    :'heute noch keine Anfrage';
  costSummary.textContent='Diese Anfrage: '+current+' · '+today+'. Richtwerte, keine Abrechnung.';
}function renderHistory(){const items=experiments.list();const options=()=>items.map(x=>new Option(historyLabel(x),x.id));history.replaceChildren(new Option('Verlauf …',''),...items.map(x=>new Option(historyLabel(x),x.id)));linkOriginal.replaceChildren(new Option('Original wählen …',''),...options());linkVariant.replaceChildren(new Option('Variante wählen …',''),...options());deleteHistory.disabled=!history.value;}

function openScoreTarget(target){
 if(!target){status.textContent='Kein unterstütztes Notationsformat erkannt.';return;}
 try{
  if(target.app==='hacklily'){
   window.open(hacklilyUrl(target.content),'_blank','noopener');
   status.textContent='LilyPond-Ausgabe an Hacklily übergeben.';
   return;
  }
  const handoff=target.format==='midi'
   ?{format:'midi',data:encodeBytesForHandoff(target.bytes),title:target.title||''}
   :{format:target.format,content:target.content};
  localStorage.setItem('wibem1_abctools_handoff_v1',JSON.stringify(handoff));
  window.open('https://wibem1.github.io/abctools/?handoff=composeme','abc-tools');
  status.textContent=(target.format==='midi'?(target.displayQuantized?'darstellungsquantisierte MIDI':'MIDI'):target.format==='musicxml'?'MusicXML':'ABC')+' an ABC Tools übergeben.';
 }catch(err){status.textContent='Noten-App konnte nicht geöffnet werden: '+err.message;}
}

function comparisonCard(title,x){
 const card=document.createElement('article');card.className='compare-card';
 const h=document.createElement('h3');h.textContent=`${title} — ${x.provider} / ${x.model}`;
 const meta=document.createElement('div');meta.className='compare-meta';
 meta.textContent=new Date(x.savedAt).toLocaleString();
 const taskLabel=document.createElement('strong');taskLabel.textContent='Auftrag';
 const taskText=document.createElement('div');taskText.className='compare-task';taskText.textContent=x.userInput??'';
 const responseLabel=document.createElement('strong');responseLabel.textContent='Ausgabe';
 const response=document.createElement('textarea');response.className='compare-response';response.readOnly=true;response.rows=10;response.value=x.aiResponse??'';
 card.append(h,meta,taskLabel,taskText,responseLabel,response);
 const target=scoreAppTarget(x,x.aiResponse??'');
 if(target){
  const open=document.createElement('button');open.type='button';open.textContent='In Noten-App öffnen';
  open.addEventListener('click',()=>openScoreTarget(target));card.append(open);
 }
 comparison.append(card);
}

function showComparison(x,otherId=null){
 const others=comparisonCandidates(x,experiments).filter(item=>item.id!==x?.id);
 comparisonChoice.replaceChildren(...others.map(item=>new Option(`${item.provider} / ${item.model} · ${new Date(item.savedAt).toLocaleString()}`,item.id)));
 if(!others.length){comparison.hidden=true;comparison.replaceChildren();return;}
 if(otherId&&others.some(item=>item.id===otherId))comparisonChoice.value=otherId;
 const pair=chooseComparison(x,experiments,comparisonChoice.value);
 comparison.replaceChildren();
 if(!pair){comparison.hidden=true;return;}
 comparison.hidden=false;
 comparisonCard(pair.first.parentId?'Ausgewählte Variante':'Original',pair.first);
 comparisonCard(pair.second.parentId?'Vergleichsvariante':'Original',pair.second);
 saveView(pair.second.id);
}

function showExperiment(x){
 if(!x)return;
 currentId=x.id;copyToInput.disabled=false;
 provider.value=x.provider;prefs.set('provider',x.provider);loadProvider();
 const known=[...model.options].some(o=>o.value===x.model);
 if(known)model.value=x.model;else{model.value='__custom__';customModel.value=x.model;customModel.hidden=false;}
 $('task').value=x.userInput??'';loadingHistoryAdditional=true;{const mode=x.workflow==='pure-midi'?'pure-midi':$('composition-process').value;$('additional').value=historicalAdditionalText(x,mode);}loadingHistoryAdditional=false;
 result.value=x.aiResponse??'';updateScoreAppButton(x);
 const midiKey=x.mode==='historical'&&x.historicalScore&&Array.isArray(x.historicalMidi)?x.id+'|'+x.historicalMidi.length+'|'+(x.runStatus||''):null;
 if(midiKey!==renderedMidiKey||!audio.querySelector('.midi-player')){paper.replaceChildren();audio.replaceChildren();singleResult.hidden=true;renderedMidiKey=null;}
 if(x.mode==='historical'){
  resultViewTitle.textContent='Wiedergabe';
  if(x.workflow==='pure-midi'){$('composition-process').value='pure-midi';lastProcess='pure-midi';historicalControls.refresh();}else historicalControls.showRecord(x);
  protocol.textContent=x.workflow==='classic-0.4.24'?formatClassicProtocol(x):x.workflow==='pure-midi'?formatPureMidiProtocol(x):formatHistoricalProtocol(x);
  renderCostSummary(x);
  singleResult.hidden=false;
  if(renderedMidiKey!==midiKey){renderHistoricalScore({record:x,paper,audio});renderedMidiKey=midiKey;}
 }else{
  paper.replaceChildren();audio.replaceChildren();singleResult.hidden=true;renderedMidiKey=null;
  $('composition-process').value='direct';lastProcess='direct';historicalControls.refresh();
  protocol.textContent=formatCommunicationRecord(x);
  renderCostSummary(x);
 }
 showComparison(x);
 status.textContent=x.parentId?'Variante mit Original geladen.':'Aus Verlauf geladen.';
 saveView(comparison.hidden?null:comparisonChoice.value);
}
async function run(){const secret=currentKey(),modelName=selectedModel();saveAdditionalForProcess($('composition-process').value,$('additional').value);if(secret)keys.set(provider.value,secret);prefs.set('provider',provider.value);prefs.set(`model:${provider.value}`,modelName);status.textContent=providerLabel()+' antwortet …';status.classList.add('working');$('compose').disabled=true;copyToInput.disabled=true;let provisionalId=historicalControls.resumeId?.()||null;try{if(!secret)throw new Error('API-Key für '+providerLabel()+' fehlt.');const mode=$('composition-process').value;const record=mode==='pure-midi'
 ?await runPureMidiComposition({engine:window.CompositionEngine,apiKey:secret,task:$('task').value,additionalInstructions:$('additional').value,provider:provider.value,model:modelName,onProgress:message=>{status.textContent=message;}})
 :mode==='classic'
 ?await runClassicComposition({engine:window.CompositionEngine,apiKey:secret,task:$('task').value,additionalInstructions:$('additional').value,provider:provider.value,model:modelName,
  onStage1:stage1Record=>{try{const saved=experiments.save(stage1Record);provisionalId=saved.id;currentId=saved.id;renderHistory();history.value=saved.id;protocol.textContent=formatClassicProtocol(saved);renderCostSummary(saved);}catch(error){status.textContent='Entwurf konnte nicht gespeichert werden: '+error.message;}},
  onStage2:stage2Record=>{if(provisionalId)try{experiments.update(provisionalId,stage2Record);}catch(error){status.textContent='Zwischenstand konnte nicht gespeichert werden: '+error.message;}},
  onProgress:message=>{status.textContent=message;}})
 :historicalControls.isHistorical()
 ?await historicalControls.run({apiKey:secret,taskText:$('task').value,additionalInstructions:$('additional').value,providerName:provider.value,modelName,
   onStage1:stage1Record=>{
    try{
     const saved=experiments.save(stage1Record);
     provisionalId=saved.id;currentId=saved.id;history.value=saved.id;
     renderHistory();history.value=saved.id;diagnostic.textContent=formatHistoryDiagnostic(experiments.list());
     protocol.textContent=formatHistoricalProtocol(saved);
     renderCostSummary(saved);
    }catch(storageError){status.textContent='Zwischenstand nach KI-Aufruf 1 konnte nicht gespeichert werden: '+storageError.message;}
   },
   onProgress:message=>{status.textContent=message;}})
 :await compose({provider:provider.value,model:modelName,apiKey:secret,task:$('task').value,additionalInstructions:$('additional').value});
 const saved=provisionalId?experiments.update(provisionalId,record):experiments.save(record);renderHistory();diagnostic.textContent=formatHistoryDiagnostic(experiments.list());history.value=saved.id;showExperiment(saved);status.classList.remove('working');status.textContent='Antwort gespeichert.';}catch(err){
 if(err.partialRecord){
  try{
   const saved=provisionalId?experiments.update(provisionalId,err.partialRecord):experiments.save(err.partialRecord);
   provisionalId=saved.id;renderHistory();diagnostic.textContent=formatHistoryDiagnostic(experiments.list());
   history.value=saved.id;showExperiment(saved);
  }catch(storageError){status.textContent='Zwischenergebnis konnte nicht gespeichert werden: '+storageError.message;}
 }
 status.classList.remove('working');status.textContent='Fehler: '+err.message+
 ((err.partialRecord||provisionalId)?' · Bisherige KI-Anfragen und Antworten wurden im Verlauf gesichert.':'');
}finally{$('compose').disabled=false;copyToInput.disabled=!currentId;}}
provider.value=prefs.get('provider','openai');loadAllKeys();loadProvider();initializePureMidiTemplate();loadAdditionalForProcess(lastProcess);renderHistory();renderCostSummary();diagnostic.textContent=formatHistoryDiagnostic(experiments.list());try{const last=JSON.parse(localStorage.getItem(VIEW_KEY)??'null');const item=last?.id&&experiments.get(last.id);if(item){showExperiment(item);history.value=item.id;if(last.otherId)showComparison(item,last.otherId);}}catch{}$('composition-process').addEventListener('change',()=>{
 saveAdditionalForProcess(lastProcess,$('additional').value);
 lastProcess=$('composition-process').value;
 loadAdditionalForProcess(lastProcess);
 historicalControls.refresh();
});
$('additional').addEventListener('input',()=>{if(!loadingHistoryAdditional)saveAdditionalForProcess($('composition-process').value,$('additional').value);});
provider.addEventListener('change',()=>{prefs.set('provider',provider.value);loadProvider();});for(const [name,input] of Object.entries(keyInputs)){const save=()=>{const value=input.value.trim();if(!value)return;try{keys.set(name,value);}catch(error){status.textContent='API-Key konnte nicht gespeichert werden: '+error.message;}};input.addEventListener('input',save);input.addEventListener('change',save);}model.addEventListener('change',()=>{customModel.hidden=model.value!=='__custom__';if(model.value!=='__custom__')prefs.set(`model:${provider.value}`,model.value);});customModel.addEventListener('change',()=>prefs.set(`model:${provider.value}`,customModel.value.trim()));history.addEventListener('change',()=>{deleteHistory.disabled=!history.value;showExperiment(experiments.get(history.value));});comparisonChoice.addEventListener('change',()=>showComparison(experiments.get(currentId),comparisonChoice.value));deleteHistory.addEventListener('click',()=>{const id=history.value;if(!id)return;const item=experiments.get(id);if(!item)return;const name=historyLabel(item);if(!confirm('Eintrag löschen?\n\n'+name))return;experiments.remove(id);if(currentId===id){currentId=null;result.value='';protocol.textContent='';paper.replaceChildren();audio.replaceChildren();singleResult.hidden=true;comparison.hidden=true;copyToInput.disabled=true;openScoreApp.disabled=true;}renderHistory();history.value='';deleteHistory.disabled=true;diagnostic.textContent=formatHistoryDiagnostic(experiments.list());status.textContent='Verlaufseintrag gelöscht.';});form.addEventListener('submit',async e=>{e.preventDefault();if(!historicalControls.resumeId?.())currentId=null;comparison.hidden=true;comparison.replaceChildren();result.value='';protocol.textContent='';openScoreApp.disabled=true;await run();});copyToInput.addEventListener('click',()=>{const text=result.value??'';if(!text)return;const task=$('task');task.value=text;task.focus();task.setSelectionRange(0,0);status.textContent='Ausgabe in den Auftrag kopiert. Anweisung ergänzen und Senden drücken.';});

linkButton.addEventListener('click',()=>{try{const originalId=linkOriginal.value,variantId=linkVariant.value;if(!originalId||!variantId)throw new Error('Bitte Original und Variante wählen.');experiments.linkVariant(originalId,variantId);renderHistory();diagnostic.textContent=formatHistoryDiagnostic(experiments.list());showExperiment(experiments.get(variantId));history.value=variantId;status.textContent='Original und Variante verbunden.';}catch(err){status.textContent=`Fehler: ${err.message}`;}});


copyResponse.addEventListener('click',async()=>{const text=result.value??'';if(!text)return;try{await navigator.clipboard.writeText(text);status.textContent='Antwort kopiert.';}catch{result.focus();result.select();const ok=document.execCommand?.('copy');result.setSelectionRange(0,0);status.textContent=ok?'Antwort kopiert.':'Kopieren nicht möglich.';}});

function downloadTextFile(file){const blob=new Blob([file.content],{type:file.mime});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=file.filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);}
saveResponse.addEventListener('click',()=>{const text=result.value??'';if(!text){status.textContent='Keine KI-Ausgabe zum Speichern.';return;}const file=responseFile(text);downloadTextFile(file);status.textContent='Ausgabe gespeichert: '+file.filename;});
function encodeBytesForHandoff(bytes){let bin='';for(const b of bytes)bin+=String.fromCharCode(b);return btoa(bin).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function scoreAppTarget(record=null,text=null){
 const parsed=responseFile(text??record?.aiResponse??result.value??'');
 if(parsed.format==='lilypond')return{app:'hacklily',format:'lilypond',content:parsed.content};
 if(parsed.format==='abc')return{app:'abctools',format:'abc',content:parsed.content};
 if(parsed.format==='musicxml')return{app:'abctools',format:'musicxml',content:parsed.content};
 const source=record??(currentId?experiments.get(currentId):null);
 if(source?.mode==='historical'&&source?.historicalScore){
  try{return{app:'abctools',format:'midi',bytes:buildDisplayMidi(source.historicalScore,window.CompositionEngine?.buildMidi),displayQuantized:true,title:source.title||source.historicalScore?.title||''};}catch{}
 }
 if(Array.isArray(source?.historicalMidi)&&source.historicalMidi.length)return{app:'abctools',format:'midi',bytes:Uint8Array.from(source.historicalMidi),title:source.title||source.historicalScore?.title||''};
 return null;
}
function updateScoreAppButton(record=null){
 const target=scoreAppTarget(record);
 openScoreApp.disabled=!target;
 openScoreApp.title=!target?'Keine übergebbare Notation erkannt':target.app==='hacklily'?'LilyPond in Hacklily öffnen':target.format==='midi'?(target.displayQuantized?'Darstellungsquantisierte MIDI in ABC Tools öffnen':'MIDI in ABC Tools als Noten öffnen'):target.format==='musicxml'?'MusicXML in ABC Tools öffnen':'ABC in ABC Tools öffnen';
}
openScoreApp.addEventListener('click',()=>openScoreTarget(scoreAppTarget()));

backupSave.addEventListener('click',()=>{const stamp=new Date().toISOString().slice(0,10);downloadJson(createBackup(localStorage),'ComposeMe-Backup-'+stamp+'.json');status.textContent='Backup gespeichert.';});
backupLoad.addEventListener('click',()=>{backupFile.value='';backupFile.click();});
backupFile.addEventListener('change',async()=>{const file=backupFile.files?.[0];if(!file)return;try{const backup=JSON.parse(await file.text());restoreBackup(localStorage,backup);status.textContent='Backup geladen. Seite wird neu geladen …';setTimeout(()=>location.reload(),300);}catch(err){status.textContent='Backup-Fehler: '+err.message;}});
keyBackupSave.addEventListener('click',()=>{const stamp=new Date().toISOString().slice(0,10);downloadJson(createKeyBackup(localStorage),'ComposeMe-Keys-'+stamp+'.json');status.textContent='Key-Backup gespeichert.';});
keyBackupLoad.addEventListener('click',()=>{keyBackupFile.value='';keyBackupFile.click();});
keyBackupFile.addEventListener('change',async()=>{const file=keyBackupFile.files?.[0];if(!file)return;try{const backup=JSON.parse(await file.text());restoreKeyBackup(localStorage,backup);loadAllKeys();status.textContent='Keys geladen.';}catch(err){status.textContent='Key-Backup-Fehler: '+err.message;}});
diagnosticSave.addEventListener('click',()=>{try{
 // Diagnosis is read-only; it must not mutate stored credentials.
 const notation=recognizeNotation(result.value??'');
 const diagnostic=createDiagnostic({appVersion:'0.8.48',provider:provider.value,model:selectedModel(),task:$('task').value,additional:$('additional').value,response:result.value,currentId,history:experiments.list(),notation});
 const stamp=new Date().toISOString().replace(/[:.]/g,'-');
 downloadJson(diagnostic,'ComposeMe-Diagnose-'+stamp+'.json');
 status.textContent='Diagnosedatei erstellt. Die API-Keys wurden nicht verändert.';
 }catch(err){status.textContent='Diagnose-Export fehlgeschlagen: '+err.message;}
});

setupPwa({installButton:installApp,onStatus:text=>{status.textContent=text;}});
