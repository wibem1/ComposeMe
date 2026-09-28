export function buildVariantRequest(record,{task='',additionalInstructions=''}={}){
  const source=String(record?.aiResponse??'').trim();
  if(!source)throw new Error('Für eine Variante ist eine vorhandene KI-Komposition nötig.');
  const variantTask=String(task??'').trim();
  const extra=String(additionalInstructions??'').trim();
  return [
    'VARIANTENAUFTRAG:',
    'Erzeuge eine musikalische Variante der folgenden konkreten Komposition.',
    'Die neue Fassung soll klar von der Vorlage ausgehen und zugleich eine eigenständige musikalische Lösung sein.',
    'Triff die musikalischen und stilistischen Entscheidungen selbst.',
    'Verwende dasselbe Notationsformat wie die Vorlage und gib die vollständige Variante aus.',
    variantTask?('\nANWEISUNG FÜR DIE VARIANTE:\n'+variantTask):'',
    extra?('\nZUSÄTZLICHE ANGABEN FÜR DIE VARIANTE:\n'+extra):'',
    '\nVORLAGE:\n'+source
  ].filter(Boolean).join('\n');
}
