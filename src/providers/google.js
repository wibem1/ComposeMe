export function googleRequest({model,prompt,apiKey}) {
  return {url:`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,options:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:prompt}]}]})},extract:data=>(data.candidates?.[0]?.content?.parts??[]).map(x=>x.text??'').join('')};
}
