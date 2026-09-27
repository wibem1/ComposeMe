export function openAIRequest({model,prompt,apiKey}) {
  return {url:'https://api.openai.com/v1/responses',options:{method:'POST',headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},body:JSON.stringify({model,input:prompt})},extract:data=>data.output_text ?? data.output?.flatMap(x=>x.content??[]).map(x=>x.text??'').join('') ?? ''};
}
