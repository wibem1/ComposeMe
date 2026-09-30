import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverSingleClosingBracket} from '../experiments/sound-concept-149/technical-recovery.js';
import {normalizeScoreJson} from '../src/historical-compose.js';

test('recovers exactly one missing terminal bracket without changing notes',()=>{
 const broken='{"t":"Test","b":116,"m":[4,4],"v":[["RH",0,0,[[1,0,1,60,100],[32,3,1,72,101]]]}';
 const recovered=recoverSingleClosingBracket(broken);
 assert.equal(recovered.repaired,true);
 const score=JSON.parse(recovered.text);
 assert.deepEqual(score.v[0][3],[[1,0,1,60,100],[32,3,1,72,101]]);
 assert.equal(recovered.text.length,broken.length+1);
});
test('unchanged when valid',()=>{
 const valid='{"t":"OK","b":116,"m":[4,4],"v":[["RH",0,0,[[32,0,4,60,80]]]]}';
 assert.deepEqual(recoverSingleClosingBracket(valid),{text:valid,repaired:false,explanation:''});
});
test('does not guess when JSON has other problems',()=>{
 assert.throws(()=>recoverSingleClosingBracket('{"t":"bad","b":116,"m":[4,4],"v":[["RH",0,0,[[1,0,1,60,,80]]]}'));
 assert.throws(()=>recoverSingleClosingBracket('{"t":"truncated","b":116,"m":[4,4],"v":[["RH",0,0,[[1,0'));
});


test('accepts JSON wrapped in a Markdown code fence without changing the score',()=>{
 const original='```json\n{"t":"Fence","b":74,"m":[6,8],"v":[["Piano",0,0,[[1,0,1,66,60]]]]}\n```';
 const normalized=normalizeScoreJson(original);
 assert.equal(normalized.repaired,true);
 assert.match(normalized.explanation,/Markdown-Codeblock/);
 assert.deepEqual(JSON.parse(normalized.text),{t:'Fence',b:74,m:[6,8],v:[['Piano',0,0,[[1,0,1,66,60]]]]});
});
