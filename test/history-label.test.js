import test from 'node:test';import assert from 'node:assert/strict';import {compositionTitle,historyLabel} from '../src/history-label.js';
test('extracts LilyPond title',()=>assert.equal(compositionTitle('\\header { title = "Hinter der Tür" }'),'Hinter der Tür'));
test('extracts ABC title',()=>assert.equal(compositionTitle('X:1\nT:Abendlicht\nK:C\nC|'),'Abendlicht'));
test('history label contains title model and date',()=>{const s=historyLabel({aiResponse:'T:Abendlicht',model:'gpt-6-sol',savedAt:'2026-09-28T20:00:00Z'});assert.match(s,/Abendlicht/);assert.match(s,/gpt-6-sol/);assert.match(s,/2026/);});
