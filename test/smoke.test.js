import assert from 'node:assert/strict';
import { appStatus } from '../src/core.js';
import { buildCompositionRequest } from '../src/composition-request.js';

assert.equal(appStatus(), 'ready');
assert.match(buildCompositionRequest({ task: 'Teststück' }), /Teststück/);
console.log('Smoke test: OK');
