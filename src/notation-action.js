import {recognizeNotation} from './notation-recognition.js?v=0.6.3';

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
  task.value='Setze die folgende bereits entstandene Komposition vollständig in eine direkt darstellbare Musiknotation um. Verwende ABC oder LilyPond. Bewahre alle konkret angegebenen musikalischen Entscheidungen; ergänze nur, was für eine vollständige Notation unvermeidbar ist. Antworte ausschließlich mit der vollständigen Notation, ohne Kommentar oder Erläuterung.\n\nAUSGANGSKOMPOSITION:\n'+source;
  additional.value='';
  button.hidden=true;
  form.requestSubmit();
});

document.getElementById('history')?.addEventListener('change',()=>setTimeout(refresh,0));
form?.addEventListener('submit',()=>{button.hidden=true;});
document.getElementById('variant')?.addEventListener('click',()=>{button.hidden=true;});
setInterval(refresh,800);
refresh();
