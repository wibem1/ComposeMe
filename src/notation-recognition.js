function extractAbc(text){
 if(typeof text!=='string')return '';
 const cleaned=text.replace(/^\s*```(?:abc)?\s*/i,'').replace(/\s*```\s*$/,'').trim();
 const start=cleaned.search(/^X\s*:/m);
 return start<0?'':cleaned.slice(start).trim();
}
export function recognizeNotation(text){
 if(typeof text!=='string'||!text.trim())return {format:null,abc:'',error:null};
 const abcFence=text.match(/```(?:abc)?\s*\n([\s\S]*?^X\s*:[\s\S]*?)\n```/im);
 const abc=abcFence?.[1]?.slice(abcFence[1].search(/^X\s*:/m)).trim()??extractAbc(text);
 return abc?{format:'ABC',abc,error:null}:{format:null,abc:'',error:null};
}
