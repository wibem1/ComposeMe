export function createCommunicationRecord({ userInput, appAdditions = '', actualRequest, aiResponse, provider = '', model = '' }) {
  for (const [name, value] of Object.entries({ userInput, appAdditions, actualRequest, aiResponse })) {
    if (typeof value !== 'string') throw new TypeError(`${name} muss Text sein.`);
  }
  return Object.freeze({
    userInput,
    appAdditions,
    actualRequest,
    aiResponse,
    provider: String(provider),
    model: String(model)
  });
}
