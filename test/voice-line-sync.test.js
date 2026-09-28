import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {alignScoreVoiceLines} from '../src/voice-line-sync.js';
import {normalizeAbcForAbcjs} from '../src/music-view.js';

const abendlicht=fs.readFileSync(new URL('./fixtures/abendlicht-original.abc',import.meta.url),'utf8');
function voiceBody(source,id,nextId=null){
 const start=source.indexOf('[V:'+id+']');
 const end=nextId?source.indexOf('[V:'+nextId+']',start):source.length;
 return source.slice(start,end).replace(/^\[V:[^\]]+\]/,'').replace(/\s+/g,'');
}
test('Abendlicht: align sixteen piano bars into four paired staff lines',()=>{
 const actual=normalizeAbcForAbcjs(abendlicht);
 const right=actual.slice(actual.indexOf('[V:RH]'),actual.indexOf('[V:LH]')).trim().split('\n');
 const left=actual.slice(actual.indexOf('[V:LH]')).trim().split('\n');
 assert.equal(right.length,4);
 assert.equal(left.length,4);
 assert.equal((right[0].match(/\|/g)||[]).length,4);
 assert.equal((left[0].match(/\|/g)||[]).length,4);
 assert.equal((left[3].match(/\|/g)||[]).length,4);
 assert.equal(voiceBody(actual,'RH','LH'),voiceBody(abendlicht,'RH','LH'));
 assert.equal(voiceBody(actual,'LH'),voiceBody(abendlicht,'LH'));
});
test('safe fallback: leave mismatched bar counts untouched',()=>{
 const s='X:1\n%%score { RH LH }\nK:C\n[V:RH] C4 | D4 |\n[V:LH] C,4 |';
 assert.equal(alignScoreVoiceLines(s),s);
});
