export const COST_RATES=Object.freeze({
  'gpt-6-sol':[2,10],
  'gpt-6-luna':[0.10,0.50],
  'gpt-5.6-sol':[4,20],
  'gpt-5.6-terra':[2,12],
  'gpt-5.6-luna':[0.20,1.20],
  'claude-sonnet-5':[2,10],
  'claude-opus-5':[5,25],
  'claude-fable-5':[10,50],
  'claude-sonnet-4-6':[3,15],
  'gemini-3.1-pro-preview':[2,12],
  'gemini-3.8-flash':[0.75,3.75],
  'gemini-3.7-flash':[0.75,3.75],
  'gemini-3.6-flash':[0.75,3.75],
  'gemini-3.5-flash-lite':[0.30,2.50]
});

export function extractUsage(provider,data){
  const u=provider==='google'?(data?.usageMetadata??{}):(data?.usage??{});
  const input=Number(u.input_tokens??u.inputTokens??u.prompt_tokens??u.promptTokens??u.promptTokenCount??u.inputTokenCount??0)||0;
  const output=Number(u.output_tokens??u.outputTokens??u.completion_tokens??u.completionTokens??u.candidatesTokenCount??u.outputTokenCount??0)||0;
  const cached=Number(u.cache_read_input_tokens??u.cached_input_tokens??u.cached_tokens??u.cachedContentTokenCount??u.input_tokens_details?.cached_tokens??u.prompt_tokens_details?.cached_tokens??0)||0;
  const total=Number(u.total_tokens??u.totalTokens??u.totalTokenCount??u.total_token_count??0)||input+output;
  return {input,output,cached,total};
}

export function estimateCost(model,usage){
  const rates=COST_RATES[String(model??'').toLowerCase()];
  if(!rates||!(usage?.input||usage?.output))return null;
  return (Number(usage.input||0)*rates[0]+Number(usage.output||0)*rates[1])/1_000_000;
}

function localDay(value){
  const d=value instanceof Date?value:new Date(value);
  if(Number.isNaN(d.getTime()))return '';
  return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
}
export function todayTotals(items,now=new Date()){
  const day=localDay(now);
  let cost=0,input=0,output=0,total=0,priced=0,count=0;
  for(const item of items??[]){
    if(localDay(item.savedAt)!==day)continue;
    count++;
    const u=item.usage??{};
    input+=Number(u.input||0);output+=Number(u.output||0);total+=Number(u.total||0);
    if(Number.isFinite(item.estimatedCost)){cost+=item.estimatedCost;priced++;}
  }
  return {cost,input,output,total,priced,count};
}

export function formatCostLine(record){
  const u=record?.usage??{};
  const tokens=Number(u.total||0);
  const cost=Number.isFinite(record?.estimatedCost)?record.estimatedCost:null;
  const tokenPart=tokens?tokens.toLocaleString('de-DE')+' Tokens (Eingabe '+Number(u.input||0).toLocaleString('de-DE')+', Ausgabe '+Number(u.output||0).toLocaleString('de-DE')+')':'Tokenzahl nicht verfügbar';
  const costPart=cost==null?'Kosten für dieses Modell nicht berechenbar':'geschätzte Kosten ca. '+cost.toFixed(4)+' $';
  return tokenPart+' · '+costPart;
}
