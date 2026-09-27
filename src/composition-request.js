export function buildCompositionRequest({ task, additionalInstructions = '' }) {
  if (typeof task !== 'string' || task.trim() === '') {
    throw new TypeError('Kompositionsauftrag fehlt.');
  }
  if (typeof additionalInstructions !== 'string') {
    throw new TypeError('Zusätzliche Angaben müssen Text sein.');
  }

  const cleanTask = task.trim();
  const cleanAdditional = additionalInstructions.trim();

  return cleanAdditional
    ? `${cleanAdditional}\n\nKOMPOSITIONSAUFTRAG:\n${cleanTask}`
    : cleanTask;
}
