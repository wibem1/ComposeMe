import {extractAbc} from './music-view.js?v=0.5.4';
import {lilyToAbc} from './lilypond-import.js?v=0.5.6';
export function recognizeNotation(text){
if(typeof text!=='string'||!text.trim())return {format:null,abc:'',error:null};
const fence=text.match(/```(?:lilypond|ly)\s*\n([\s\S]*?)\n```/i);
const lily=fence?.[1]??(text.includes('\\version')&&text.includes('\\score')?text.slice(text.indexOf('\\version')):null);
if(lily!==null){try{return {format:'LilyPond',abc:lilyToAbc(lily),error:null};}catch(err){return {format:'LilyPond',abc:'',error:err.message};}}
const abcFence=text.match(/```(?:abc)?\s*\n([\s\S]*?^X\s*:[\s\S]*?)\n```/im);
const abc=abcFence?.[1]?.slice(abcFence[1].search(/^X\s*:/m)).trim()??extractAbc(text);
return abc?{format:'ABC',abc,error:null}:{format:null,abc:'',error:null};
}