// Conservative ABC duration audit: never rewrite or guess unknown notation.
const close=(a,b)=>Math.abs(a-b)<1e-7;
function duration(s){
 if(!s)return 1;
 if(/^\d+$/.test(s))return Number(s);
 if(/^\d+\/\d+$/.test(s)){const [n,d]=s.split('/').map(Number);return d?n/d:NaN;}
 if(/^\d+\/$/.test(s))return Number(s.slice(0,-1))/2;
 if(/^\/+\d*$/.test(s)){const m=s.match(/^(\/+)(\d*)$/);return 1/(2**m[1].length*(m[2]?Number(m[2]):1));}
 return NaN;
}
function sumMeasure(raw){
 let s=raw.replace(/"(?:[^"\\]|\\.)*"/g,'').replace(/![^!]*!|\+[^+]*\+/g,'').replace(/%.*$/,'').replace(/\s+/g,'');
 if(!s)return null;
 let sum=0;
 while(s){
  const m=/^(?:((?:\[[^\]]+\]|(?:\^{1,2}|_{1,2}|=)?[A-Ga-g][,']*|[zZxX]))(\d+\/\d+|\d+\/|\/+\d*|\d*)|([()~.\-]))/.exec(s);
  if(!m)return NaN;
  if(m[1]){
   if(m[1][0]==='['&&!/^(?:\[(?:(?:\^{1,2}|_{1,2}|=)?[A-Ga-g][,']*)+\])$/.test(m[1]))return NaN;
   const d=duration(m[2]);if(!Number.isFinite(d))return NaN;
   sum+=d;
  }else if(m[3]==='('&&/^\d/.test(s.slice(m[0].length)))return NaN;
  s=s.slice(m[0].length);
 }
 return sum;
}
export function auditAbcMeasures(abc){
 if(typeof abc!=='string')return [];
 const lines=abc.replace(/\r\n?/g,'\n').split('\n');
 let meter=null,unit=null,voice=null,body=false;const parts=new Map();
 for(const line of lines){
  let s=line.trim();if(!s||s.startsWith('%'))continue;
  let m=s.match(/^M:\s*(\d+)\s*\/\s*(\d+)/);if(m){meter=Number(m[1])/Number(m[2]);continue;}
  m=s.match(/^L:\s*(\d+)\s*\/\s*(\d+)/);if(m){unit=Number(m[1])/Number(m[2]);continue;}
  if(/^K:/.test(s)){body=true;continue;}
  if(!body||/^[A-Za-z]:/.test(s))continue;
  m=s.match(/^\[V:([^\]]+)\]\s*/);if(m){voice=m[1];s=s.slice(m[0].length);}
  if(!voice)voice='1';
  if(!parts.has(voice))parts.set(voice,[]);
  const entries=s.split('|');
  for(let i=0;i<entries.length-1;i++){
   const value=entries[i].trim().replace(/^\[V:[^\]]+\]/,'');
   if(value)parts.get(voice).push(value);
  }
 }
 if(!meter||!unit||meter<=0||unit<=0)return [];
 const expected=meter/unit,warnings=[];
 for(const [id,bars] of parts)bars.forEach((bar,i)=>{
   const actual=sumMeasure(bar);
   if(Number.isFinite(actual)&&!close(actual,expected))warnings.push({voice:id,bar:i+1,actual,expected,message:`ABC-Taktlänge prüfen: Stimme ${id}, Takt ${i+1}: ${actual} statt ${expected} Grundeinheiten.`});
 });
 return warnings;
}
