export function buildVariantRequest(record){
  const source=String(record?.aiResponse??'').trim();
  if(!source)throw new Error('Für eine Variante ist eine vorhandene KI-Komposition nötig.');
  const originalTask=String(record?.userInput??'').trim();
  return [
    'VARIANTENAUFTRAG:',
    'Erzeuge eine musikalische Variante der folgenden konkreten Komposition.',
    'Die neue Fassung soll klar von der Vorlage ausgehen und zugleich eine eigenständige musikalische Lösung sein.',
    'Triff die musikalischen und stilistischen Entscheidungen selbst.',
    'Verwende dasselbe Notationsformat wie die Vorlage und gib die vollständige Variante aus.',
    originalTask?('\nURSPRÜNGLICHER KOMPOSITIONSAUFTRAG:\n'+originalTask):'',
    '\nVORLAGE:\n'+source
  ].filter(Boolean).join('\n');
}
