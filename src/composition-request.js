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
    ? "\n\nABC-TONHÖHENREGEL: Bestimme zuerst die Tonhöhenkonvention des Ausgangstextes und übersetze sie ausdrücklich in ABC. Referenz: wissenschaftlich C4 = mittleres C = ABC C; C5 = ABC c. Wenn der Ausgangstext deutsche/Helmholtz-Schreibweise verwendet, gilt: c' = ABC C, e' = ABC E, a' = ABC A, c'' = ABC c, d'' = ABC d, e''' = ABC e'. Übernimm Apostrophe niemals mechanisch aus dem Ausgangstext. Prüfe vor der Ausgabe jede Instrumentstimme auf plausible reale Lage. Bei gemischten oder mehrdeutigen Angaben löse die Tonhöhe konsistent anhand von Instrument, musikalischem Kontext und den genannten Referenzen auf; erfinde keine zusätzliche Oktavverschiebung."
    : '';

  const request=cleanAdditional
    ? `${cleanAdditional}\n\nKOMPOSITIONSAUFTRAG:\n${cleanTask}`
    : cleanTask;
  return request+abcGuard;
}
