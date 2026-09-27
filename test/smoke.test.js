import assert from 'node:assert/strict';
import { appStatus } from '../src/core.js';
import { buildCompositionRequest } from '../src/composition-request.js';
import { createCommunicationRecord } from '../src/communication-protocol.js';
assert.equal(appStatus(),'ready');
const request=buildCompositionRequest({task:'Teststück'});
const record=createCommunicationRecord({userInput:'Teststück',actualRequest:request,aiResponse:'ABC'});
assert.equal(record.aiResponse,'ABC');
console.log('Smoke test: OK');
