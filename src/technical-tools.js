const PREFIX='minimal-composer-next:';
const KEY_PREFIX=PREFIX+'key:';

export function createBackup(storage){
  const data={};
  for(let i=0;i<storage.length;i++){
    const key=storage.key(i);
    if(key?.startsWith(PREFIX)&&!key.startsWith(KEY_PREFIX))data[key]=storage.getItem(key);
  }
  return {format:'minimal-composer-next-backup',version:1,exportedAt:new Date().toISOString(),data};
}

export function restoreBackup(storage,backup){
  if(!backup||backup.format!=='minimal-composer-next-backup'||backup.version!==1||!backup.data||typeof backup.data!=='object')throw new Error('Ungültige Backup-Datei.');
  const remove=[];
  for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith(PREFIX)&&!key.startsWith(KEY_PREFIX))remove.push(key);}
  remove.forEach(key=>storage.removeItem(key));
  for(const [key,value] of Object.entries(backup.data)){
    if(key.startsWith(PREFIX)&&!key.startsWith(KEY_PREFIX)&&typeof value==='string')storage.setItem(key,value);
  }
}

export function createDiagnostic({appVersion,provider,model,task,additional,response,currentId,history,notation}){
  return {
    app:'Minimal Composer Next',
    appVersion,
    createdAt:new Date().toISOString(),
    currentId:currentId??null,
    provider:provider??'',
    model:model??'',
    task:task??'',
    additionalInstructions:additional??'',
    response:response??'',
    notation:{format:notation?.format??null,error:notation?.error??null},
    history:history??[]
  };
}

export function downloadJson(value,filename){
  const blob=new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000);
}
