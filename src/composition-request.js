export function buildCompositionRequest({ task, additionalInstructions = '' }) {
  if (typeof task !== 'string' || task.trim() === '') {
    throw new TypeError('Kompositionsauftrag fehlt.');
  }
  if (typeof additionalInstructions !== 'string') {
    throw new TypeError('Zusätzliche Angaben müssen Text sein.');
  }

  const cleanTask = task.trim();
  const cleanAdditional = additionalInstructions.trim();

  const asksForAbc=/\bABC(?:-Notation)?\b|\babc\s*(?:format|Format)\b/i.test(cleanTask);
  const abcGuard=asksForAbc
    ? '\n\nABC-HINWEIS: Verwende die ABC-Oktavkonvention exakt. In ABC ist C das mittlere c, c liegt eine Oktave höher; Apostrophe erhöhen jeweils um eine weitere Oktave, Kommas erniedrigen. Übertrage Tonhöhen aus deutscher/Helmholtz-Notation daher nicht mechanisch mit denselben Apostrophen. Prüfe die resultierende Lage jedes Instruments vor der Ausgabe.'
    : '';

  const request=cleanAdditional
    ? `${cleanAdditional}\n\nKOMPOSITIONSAUFTRAG:\n${cleanTask}`
    : cleanTask;
  return request+abcGuard;
}
