import test from 'node:test';import assert from 'node:assert/strict';import {historyAdditionalForEditor} from '../src/additional-history.js';

test('old built-in ABC instructions are not restored into the editable additional field',()=>{
  const old='AUSGABEFORMAT:\nErzeuge die Komposition als vollständige, gültige ABC-Notation (ABC 2.1), direkt darstellbar und abspielbar mit abcjs 6.5.2.\nGib ausschließlich ABC aus.';
  assert.equal(historyAdditionalForEditor(old),'');
});

test('genuine historical custom additions are preserved',()=>{
  assert.equal(historyAdditionalForEditor('Violine etwas dunkler'),'Violine etwas dunkler');
});
