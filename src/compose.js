import {buildCompositionRequest} from './composition-request.js';
import {sendToAI} from './ai-client.js?v=0.6.4';
import {createCommunicationRecord} from './communication-protocol.js?v=0.6.4';
export async function compose({task,additionalInstructions='',provider,model,apiKey,transport}){
  const actualRequest=buildCompositionRequest({task,additionalInstructions});
  const reply=await sendToAI({provider,model,prompt:actualRequest,apiKey,transport});
  return createCommunicationRecord({userInput:task,appAdditions:additionalInstructions,actualRequest,aiResponse:reply.text,provider,model,usage:reply.usage,estimatedCost:reply.estimatedCost});
}


export function buildNotationRequest(sourceText){
  const text=String(sourceText??'').trim();
  if(!text)throw new TypeError('Keine Komposition zum Umsetzen vorhanden.');
  return `Setze die folgende bereits entstandene Komposition vollständig in eine direkt darstellbare Musiknotation um. Verwende ausschließlich ABC-Notation. Bewahre alle konkret angegebenen musikalischen Entscheidungen; ergänze nur, was für eine vollständige Notation unvermeidbar ist. Antworte ausschließlich mit der vollständigen ABC-Notation, ohne Kommentar oder Erläuterung.

AUSGANGSKOMPOSITION:
${text}`;
}

export async function notate({sourceText,sourceTask='',provider,model,apiKey,transport}){
  const actualRequest=buildNotationRequest(sourceText);
  const reply=await sendToAI({provider,model,prompt:actualRequest,apiKey,transport});
  return createCommunicationRecord({
    userInput:sourceTask||'In Notation umsetzen',
    appAdditions:'Technische Umsetzung der vorhandenen KI-Antwort in Notation.',
    actualRequest,
    aiResponse:reply.text,
    provider,
    model,
    usage:reply.usage,
    estimatedCost:reply.estimatedCost
  });
}
