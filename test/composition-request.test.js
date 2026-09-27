import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCompositionRequest } from '../src/composition-request.js';

test('sends task unchanged apart from surrounding whitespace', () => {
  assert.equal(buildCompositionRequest({ task: '  Schreibe einen Walzer.  ' }), 'Schreibe einen Walzer.');
});

test('places editable additional instructions before the task', () => {
  assert.equal(
    buildCompositionRequest({ task: 'Schreibe einen Walzer.', additionalInstructions: 'Keine Vorentwürfe.' }),
    'Keine Vorentwürfe.\n\nKOMPOSITIONSAUFTRAG:\nSchreibe einen Walzer.'
  );
});

test('rejects an empty composition task', () => {
  assert.throws(() => buildCompositionRequest({ task: '   ' }), /Kompositionsauftrag fehlt/);
});
