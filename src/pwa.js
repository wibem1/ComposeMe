export function setupPwa({installButton,onStatus=()=>{}}={}){
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{}));
  }
  let promptEvent=null;
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    promptEvent=event;
    if(installButton)installButton.hidden=false;
  });
  installButton?.addEventListener('click',async()=>{
    if(!promptEvent){onStatus('Installation über das Browser-Menü „App installieren“ bzw. „Zum Startbildschirm“ starten.');return;}
    promptEvent.prompt();
    const choice=await promptEvent.userChoice;
    if(choice.outcome==='accepted')onStatus('App installiert.');
    promptEvent=null;
    installButton.hidden=true;
  });
  window.addEventListener('appinstalled',()=>{if(installButton)installButton.hidden=true;onStatus('App installiert.');});
}
