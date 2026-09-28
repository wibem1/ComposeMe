import test from 'node:test';import assert from 'node:assert/strict';import {recognizeNotation} from '../src/notation-recognition.js';
test('ABC unchanged',()=>{const r=recognizeNotation('X:1\nK:C\nC4|]');assert.equal(r.format,'ABC');assert.equal(r.abc,'X:1\nK:C\nC4|]');});
test('unsupported LilyPond is detected and reports error',()=>{const r=recognizeNotation('```lilypond\n\\version "2.24.3"\n\\score { }\n```');assert.equal(r.format,'LilyPond');assert.ok(r.error);assert.equal(r.abc,'');});
test('prose ignored',()=>assert.equal(recognizeNotation('Beschreibung').format,null));
test('fenced ABC is extracted from mixed prose',()=>{const r=recognizeNotation('Hier ist die Komposition:\n\n\`\`\`abc\nX:1\nT:Test\nK:C\nC4|]\n\`\`\`\n\nKommentar danach.');assert.equal(r.format,'ABC');assert.equal(r.abc,'X:1\nT:Test\nK:C\nC4|]');});
test('ordinary answer remains text only',()=>{const r=recognizeNotation('Die Basslage ist zu tief.');assert.equal(r.format,null);assert.equal(r.abc,'');});
