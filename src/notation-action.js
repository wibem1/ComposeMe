import {recognizeNotation} from './notation-recognition.js?v=0.6.5';

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
  task.value=source+'\n\nErstelle daraus eine Komposition.';
  additional.value='';
  button.hidden=true;
  form.requestSubmit();
});

document.getElementById('history')?.addEventListener('change',()=>setTimeout(refresh,0));
form?.addEventListener('submit',()=>{button.hidden=true;});
document.getElementById('variant')?.addEventListener('click',()=>{button.hidden=true;});
setInterval(refresh,800);
refresh();
