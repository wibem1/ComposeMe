/* Diagnostic-only transport record. Never store authorization headers, URL keys,
 * generated response text or raw provider response objects. No additional requests. */
const clone=value=>JSON.parse(JSON.stringify(value));
export function diagnosticRequest(template,request){
 const headers=Object.keys(request.headers||{}).filter(h=>!/(authorization|api.key|cookie|token|secret)/i.test(h)).sort();
 const url=new URL(request.url,'https://diagnostic.invalid');
 const body=clone(request.body??{});
 return {method:'POST',endpoint:url.origin+url.pathname,headerNames:headers,
  body,bodyNote:'Originaler JSON-Anfragekörper, ohne Zugangsdaten.',
  omittedGenerationOptions:!Object.keys(body).some(x=>/^(temperature|top_p|max_output_tokens|reasoning|seed)$/i.test(x))};
}
export function diagnosticResponse(provider,data,response){
 const usage=data?.usage??data?.usageMetadata??null;
 return {httpStatus:response.status??null,requestId:response.headers?.get?.('x-request-id')??response.headers?.get?.('request-id')??null,
  responseId:typeof data?.id==='string'?data.id:null,
  model:typeof data?.model==='string'?data.model:typeof data?.modelVersion==='string'?data.modelVersion:null,
  createdAt:data?.created_at??null,status:typeof data?.status==='string'?data.status:null,
  finishReason:data?.candidates?.[0]?.finishReason??data?.stop_reason??null,
  usage:usage&&typeof usage==='object'?clone(usage):null,
  provider,
  outputStructure:Array.isArray(data?.output)?data.output.map(o=>({
    type:o.type??null,status:o.status??null,role:o.role??null,
    contentTypes:Array.isArray(o.content)?o.content.map(c=>c.type??null):[],
    summaryTypes:Array.isArray(o.summary)?o.summary.map(c=>c.type??null):[]
  })):null};
}
