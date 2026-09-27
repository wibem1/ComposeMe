import assert from 'node:assert/strict';
import { appStatus } from '../src/core.js';

assert.equal(appStatus(), 'ready');
console.log('Smoke test: OK');
