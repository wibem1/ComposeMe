// Align simple contiguous [V:] voice blocks by measure for abcjs display.
// Advanced ABC constructs are passed through unchanged rather than rewritten.
export function alignParallelVoiceLines(lines,groupSize=4){
  const first=lines.findIndex(line=>/^\[V:[^\]]+\]/.test(line.trim()));
  if(first<0)return lines;
  const header=lines.slice(0,first),tail=lines.slice(first);
  const groups=[];
  for(const line of tail){
    const match=/^\s*\[V:([^\]]+)\]\s*(.*)$/.exec(line);
    if(match){
      if(groups.some(g=>g.id===match[1]))return lines; // already interleaved
      groups.push({id:match[1],body:[match[2]]});
    }else if(groups.length && line.trim() && !/^(?:[A-Za-z]:|%%|%)/.test(line.trim())){
      groups[groups.length-1].body.push(line.trim());
    }else return lines;
  }
  if(groups.length<2)return lines;
  const barred=groups.map(group=>{
    const body=group.body.join(' ').trim();
    // Avoid altering repeats, overlays, inline voice switches or complex syntax.
    if(!body||/(?:\|:|:\||&|\[V:|\[M:|\[K:)/.test(body))return null;
    const bars=body.match(/[^|]*\|(?:\]|\|)?/g);
    if(!bars||bars.join('').trim()!==body)return null;
    return bars.map(bar=>bar.trim());
  });
  if(barred.some(b=>!b)||barred.some(b=>b.length!==barred[0].length))return lines;
  const result=[...header];
  for(let start=0;start<barred[0].length;start+=groupSize){
    for(let i=0;i<groups.length;i++){
      result.push('[V:'+groups[i].id+'] '+barred[i].slice(start,start+groupSize).join(' '));
    }
  }
  return result;
}
