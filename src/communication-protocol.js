export function createCommunicationRecord({ userInput, appAdditions = '', actualRequest, aiResponse, provider = '', model = '', usage = null, estimatedCost = null }) {
  for (const [name,value] of Object.entries({userInput,appAdditions,actualRequest,aiResponse})) if(typeof value!=='string') throw new TypeError(`${name} muss Text sein.`);
  return Object.freeze({userInput,appAdditions,actualRequest,aiResponse,provider:String(provider),model:String(model),usage:usage??null,estimatedCost:Number.isFinite(estimatedCost)?estimatedCost:null});
}
export function formatCommunicationRecord(r){
  const u=r.usage??{};
  const usageLine=Number(u.total||0)?`\nTOKENS: ${u.total} (Eingabe ${u.input||0}, Ausgabe ${u.output||0})`:'';
  const costLine=Number.isFinite(r.estimatedCost)?`\nGESCHÄTZTE KOSTEN: ${r.estimatedCost.toFixed(4)} $`:'';
  return `NUTZER:\n${r.userInput}\n\nAPP-ZUSATZ:\n${r.appAdditions}\n\nTATSÄCHLICH AN DIE KI GESENDET:\n${r.actualRequest}\n\nKI-ANTWORT:\n${r.aiResponse}\n\nPROVIDER: ${r.provider}\nMODELL: ${r.model}${usageLine}${costLine}`;
}
