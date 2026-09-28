const LEGACY_ABC_DEFAULT='AUSGABEFORMAT:\nErzeuge die Komposition als vollständige, gültige ABC-Notation (ABC 2.1)';
export function historyAdditionalForEditor(value){
  const text=String(value??'').trim();
  if(!text)return '';
  if(text.startsWith(LEGACY_ABC_DEFAULT))return '';
  return text;
}
