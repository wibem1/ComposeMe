import {extractAbc} from './music-view.js?v=0.8.6';

export function recognizeNotation(text){
 if(typeof text!=='string'||!text.trim())return {format:null,abc:'',error:null};
 const abcFence=text.match(/```(?:abc)?\s*\n([\s\S]*?^X\s*:[\s\S]*?)\n```/im);
 const abc=abcFence?.[1]?.slice(abcFence[1].search(/^X\s*:/m)).trim()??extractAbc(text);
 return abc?{format:'ABC',abc,error:null}:{format:null,abc:'',error:null};
}
