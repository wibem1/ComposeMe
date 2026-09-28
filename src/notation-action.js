import {recognizeNotation} from './notation-recognition.js?v=0.6.14';

const button=document.getElementById('notate-response');
const result=document.getElementById('result');
const task=document.getElementById('task');
const additional=document.getElementById('additional');
const form=document.getElementById('compose-form');

function refresh(){
  const text=result?.value??'';
  const notation=recognizeNotation(text);
  button.hidden=!text||Boolean(notation.abc||notation.error);
}

button?.addEventListener('click',()=>{
  const source=(result?.value??'').trim();
  if(!source)return;
  task.value=source+'\n\nNOTATIONSAUFTRAG: Erzeuge aus diesem musikalischen Entwurf eine vollständige, direkt darstellbare ABC-Notation für die vorhandene Besetzung. Gib ausschließlich einen vollständigen \`abc\`-Codeblock aus, ohne erklärenden Text. Die Notation muss mit abcjs 6.5.2 darstellbar und abspielbar sein. Übernimm Tonhöhen, Oktavlagen, Rhythmus, Taktart, Tempo, Stimmen und Form musikalisch korrekt aus dem Entwurf; interpretiere Apostrophe oder Oktavbezeichnungen des Ausgangstextes nicht mechanisch als ABC-Oktavzeichen. Prüfe jede Instrumentstimme auf realistische Lage und erhalte ausdrücklich genannte Register, Flageoletts und Oktavlagen. Verwende vollständige V:-Stimmen für alle Instrumente, korrekte Taktlängen und eine passende %%score-Anordnung. Verwende keine von abcjs nicht unterstützten Formatdirektiven. Prüfe den erzeugten ABC-Code vor der Ausgabe auf syntaktische Konsistenz und vollständige Taktzahl.';
  additional.value='';
  button.hidden=true;
  form.requestSubmit();
});

document.getElementById('history')?.addEventListener('change',()=>setTimeout(refresh,0));
form?.addEventListener('submit',()=>{button.hidden=true;});
document.getElementById('variant')?.addEventListener('click',()=>{button.hidden=true;});
setInterval(refresh,800);
refresh();
