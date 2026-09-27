import test from 'node:test';
import assert from 'node:assert/strict';
import { createCommunicationRecord } from '../src/communication-protocol.js';

test('keeps all four communication layers verbatim', () => {
  const record = createCommunicationRecord({
    userInput: '  Mein Auftrag\nmit Zeile 2  ',
    appAdditions: 'Zusatz der App',
    actualRequest: 'SYSTEM\nMein Auftrag\nZusatz der App',
    aiResponse: 'Antwort\nvollständig',
    provider: 'google', model: 'gemini-test'
  });
  assert.equal(record.userInput, '  Mein Auftrag\nmit Zeile 2  ');
  assert.equal(record.appAdditions, 'Zusatz der App');
  assert.equal(record.actualRequest, 'SYSTEM\nMein Auftrag\nZusatz der App');
  assert.equal(record.aiResponse, 'Antwort\nvollständig');
  assert.equal(record.provider, 'google');
  assert.equal(record.model, 'gemini-test');
});

test('does not truncate long AI responses', () => {
  const long = 'x'.repeat(20000);
  const record = createCommunicationRecord({ userInput:'A', actualRequest:'B', aiResponse:long });
  assert.equal(record.aiResponse.length, 20000);
});

test('requires textual communication fields', () => {
  assert.throws(() => createCommunicationRecord({ userInput:'A', actualRequest:'B', aiResponse:null }), /aiResponse muss Text sein/);
});
