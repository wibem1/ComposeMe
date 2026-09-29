export function compositionTitle(text){
  const s=String(text??'').trim();
  if(!s)return 'Ohne Titel';
  const lily=s.match(/\btitle\s*=\s*"([^"]+)"/i)?.[1]?.trim();
  if(lily)return lily;
  const abc=s.match(/^T:\s*(.+)$/mi)?.[1]?.trim();
  if(abc)return abc;
  const heading=s.match(/^#{1,6}\s+(.+)$/m)?.[1]?.replace(/[*_]/g,'').trim();
  if(heading)return heading;
  return 'Ohne Titel';
}
export function historyLabel(item,locale='de-DE'){
  const title=item?.mode==='historical'?(item.title||item.historicalScore?.title||'Klangvorstellung (unvollständig)'):compositionTitle(item?.aiResponse);
  const model=String(item?.model??item?.provider??'KI').trim()||'KI';
  const date=item?.savedAt?new Date(item.savedAt).toLocaleDateString(locale):'';
  return [title,model,date].filter(Boolean).join(' · ');
}
