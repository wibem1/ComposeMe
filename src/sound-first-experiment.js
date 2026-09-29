import {sendToAI} from './ai-client.js';

export const HISTORICAL_DRAFT_INSTRUCTION='Komponiere das verlangte Stück musikalisch frei und eigenständig. Konzentriere dich ausschließlich auf musikalische Gestalt, Verlauf, Stimmen, Rhythmus, Harmonik, Artikulation und Charakter. Denke noch NICHT an MIDI-Codierung, QN-Werte, CS-Zeilen oder ein technisches Ausgabeformat. Schreibe einen vollständigen, konkret ausnotierbaren musikalischen Entwurf, aus dem anschließend eine andere technische Instanz die MIDI-Daten erzeugen kann. Gib in der ersten Zeile lediglich einen kurzen passenden Werktitel als „Titel: …“ an; dies soll die musikalische Gestaltung nicht einschränken. Mache keine Erläuterung über deine Arbeitsweise.';

export function draftPrompt(task){
  if(typeof task!=='string'||!task.trim())throw new TypeError('Kompositionsauftrag fehlt.');
  return HISTORICAL_DRAFT_INSTRUCTION+'\n\nAUFTRAG:\n'+task.trim();
}
export function notationPrompt(task,draft){
 if(typeof task!=='string'||!task.trim()||typeof draft!=='string'||!draft.trim())throw new TypeError('Auftrag und musikalischer Entwurf erforderlich.');
 return [
 'Du setzt jetzt einen bereits entstandenen musikalischen Entwurf in eine eigenständige, spielbare Klavierkomposition um.',
 'Die musikalische Qualität hat Vorrang vor schematischer Taktfüllung. Verwende die charakteristischen musikalischen Ideen des Entwurfs; wo er keine einzelnen Noten vorgibt, komponiere diese mit musikalischem Gestaltungsspielraum selbstständig. Kopiere keine existierende Komposition.',
 'Antworte mit genau EINER vollständigen ABC-Partitur, ohne Einleitung, Schlusskommentar oder zweiten Entwurf. Die ABC-Partitur muss direkt in ComposeMe darstellbar und abspielbar sein.',
 'Verwende einen gültigen ABC-Kopf mit X:, T:, M:, L:, Q:, K: und zwei getrennten Klavierstimmen V:RH clef=treble und V:LH clef=bass.',
 'Jede Stimme soll alle tatsächlich komponierten Takte korrekt ausfüllen; achte auf rhythmisch vollständige, miteinander synchronisierte Stimmen. Ersetze musikalische Besonderheiten nicht durch immer gleiche Standardfiguren.',
 'Verwende die vom Entwurf vorgesehene Taktart und Tonart soweit sinnvoll. Falls die Gesamtlänge des Entwurfs deine zuverlässige Ausnotierung überfordert, entscheide dich für eine kürzere, in sich schlüssige Komposition statt für Füllmaterial. Halte ausdrücklich vom Nutzer geforderte Taktzahlen jedoch ein.',
 'URSPRÜNGLICHER KOMPOSITIONSAUFTRAG:\n'+task.trim(),
 'MUSIKALISCHER ENTWURF:\n'+draft.trim()
 ].join('\n\n');
}
export async function runSoundFirst({task,provider,model,apiKey,request=sendToAI,onStage=()=>{}}){
 const calls=[];
 const perform=async(stage,prompt)=>{
   onStage({stage,status:'started'});
   const start=Date.now();
   const reply=await request({provider,model,prompt,apiKey});
   const call={stage,prompt,response:reply.text,usage:reply.usage??null,estimatedCost:reply.estimatedCost??null,durationMs:Date.now()-start};
   calls.push(call);onStage({stage,status:'completed',call});return reply.text;
 };
 try{
   const draft=await perform('musical_draft',draftPrompt(task));
   if(!draft.trim())throw new Error('Leerer musikalischer Entwurf.');
   const notation=await perform('abc_realization',notationPrompt(task,draft));
   return {status:'completed',method:'historical-prompt-adapted-to-abc-v1',task,provider,model,calls,draft,notation};
 }catch(error){
   error.experiment={status:'failed',method:'historical-prompt-adapted-to-abc-v1',task,provider,model,calls};
   throw error;
 }
}
