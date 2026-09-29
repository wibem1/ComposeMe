import {buildCompositionRequest} from './composition-request.js';
import {sendToAI} from './ai-client.js?v=0.8.12';
import {createCommunicationRecord} from './communication-protocol.js?v=0.8.12';
export async function compose({task,additionalInstructions='',provider,model,apiKey,transport}){
  const actualRequest=buildCompositionRequest({task,additionalInstructions});
  const reply=await sendToAI({provider,model,prompt:actualRequest,apiKey,transport});
  return createCommunicationRecord({userInput:task,appAdditions:additionalInstructions,actualRequest,aiResponse:reply.text,provider,model,usage:reply.usage,estimatedCost:reply.estimatedCost});
}
