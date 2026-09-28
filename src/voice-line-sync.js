// Align physical ABC line breaks across simple, separately written score voices.
// This only reflows text lines; it does not alter any measure's notes or barlines.
// Ambiguous syntax is deliberately left untouched.
export function alignScoreVoiceLines(abc){
  const lines=abc.split('\n');
  const score=lines.find(line=>/^%%score\s+/.test(line.trim()));
  if(!score)return abc;
  const ids=[...score.matchAll(/[A-Za-z][A-Za-z0-9_-]*/g)].map(m=>m[0]).filter(id=>id!=='score');
  if(ids.length<2||new Set(ids).size!==ids.length)return abc;
  const k=lines.findIndex(line=>/^K\s*:/.test(line.trim()));
  if(k<0)return abc;
  const first=lines.findIndex((line,i)=>i>k&&/^\[V:[^\]]+\]/.test(line.trim()));
  if(first<0)return abc;
  const prefix=lines.slice(0,first), body=lines.slice(first);
  const blocks=new Map(), order=[];let current=null;
  for(const raw of body){
    const line=raw.trim();
    const start=/^\[V:([^\]]+)\]\s*(.*)$/.exec(line);
    if(start){
      if(!ids.includes(start[1])||blocks.has(start[1]))return abc;
      current=start[1];order.push(current);blocks.set(current,[]);
      if(start[2])blocks.get(current).push(start[2]);
    }else{
      if(!current||!line||/^%|^V:|^\[/.test(line))return abc;
      blocks.get(current).push(line);
    }
  }
  if(order.length!==ids.length||order.some((id,i)=>id!==ids[i]))return abc;
  const parts=[],boundaries=[];
  for(const id of order){
    const voiceLines=blocks.get(id);
    const measures=[];const ends=[];let total=0;
    for(const line of voiceLines){
      // Leave repeat bars, embedded directives, chord annotations containing barlines etc. alone.
      if(/\|:|:\||\|\||\[\|/.test(line)||(line.match(/"[^"]*"/g)??[]).some(q=>q.includes("|")))return abc;
      const chunks=line.match(/[^|]*\|\]?/g);
      if(!chunks||chunks.join('')!==line.replace(/\s+/g,'')){
        // Whitespace in notes is harmless, but must remain unchanged.
        const compact=line.replace(/\s+/g,'');
        if(!chunks||chunks.map(s=>s.replace(/\s+/g,'')).join('')!==compact)return abc;
      }
      for(const chunk of chunks)measures.push(chunk.trim());
      total+=chunks.length;ends.push(total);
    }
    parts.push(measures);boundaries.push(ends);
  }
  const count=parts[0].length;
  if(!count||parts.some(x=>x.length!==count))return abc;
  if(boundaries.every(x=>JSON.stringify(x)===JSON.stringify(boundaries[0])))return abc;
  // Preserve the first voice's line grouping, which is already readable.
  const breaks=boundaries[0];
  const result=[...prefix];
  for(let i=0;i<order.length;i++){
    let from=0;
    for(const end of breaks){
      result.push((from===0?'[V:'+order[i]+'] ':'       ')+parts[i].slice(from,end).join(' '));
      from=end;
    }
  }
  return result.join('\n');
}
