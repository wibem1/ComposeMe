import test from 'node:test';
import assert from 'node:assert/strict';
import {recognizeNotation} from '../src/notation-recognition.js';

test('ABC unchanged',()=>{
 const r=recognizeNotation('X:1\nK:C\nC4|]');
 assert.equal(r.format,'ABC');
 assert.equal(r.abc,'X:1\nK:C\nC4|]');
});
test('prose ignored',()=>assert.equal(recognizeNotation('Beschreibung').format,null));
test('fenced ABC is extracted from mixed prose',()=>{
 const r=recognizeNotation('Hier ist die Komposition:\n\n```abc\nX:1\nT:Test\nK:C\nC4|]\n```\n\nKommentar danach.');
 assert.equal(r.format,'ABC');
 assert.equal(r.abc,'X:1\nT:Test\nK:C\nC4|]');
});
