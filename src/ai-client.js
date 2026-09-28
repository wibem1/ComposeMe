import {openAIRequest} from './providers/openai.js';
import {anthropicRequest} from './providers/anthropic.js';
import {googleRequest} from './providers/google.js';
import {extractUsage,estimateCost} from './cost-control.js?v=0.7.6';
const adapters={openai:openAIRequest,anthropic:anthropicRequest,google:googleRequest};
export async function sendToAI({provider,model,prompt,apiKey,transport=fetch}) {
  if(!adapters[provider]) throw new Error(`Unbekannter Provider: ${provider}`);
  if(!model || !prompt || !apiKey) throw new Error('Provider, Modell, Anfrage und API-Key sind erforderlich.');
  const req=adapters[provider]({model,prompt,apiKey});
  const response=await transport(req.url,req.options);
  if(!response.ok) throw new Error(`KI-Anfrage fehlgeschlagen: HTTP ${response.status}`);
  const data=await response.json();
  const text=req.extract(data);
  if(typeof text!=='string' || text.length===0) throw new Error('KI-Antwort enthält keinen Text.');
  const usage=extractUsage(provider,data);
  const estimatedCost=estimateCost(model,usage);
  return {text,usage,estimatedCost};
}
