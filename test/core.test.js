import test from 'node:test';
import assert from 'node:assert/strict';
import { add } from '../src/core.js';

test('core calculation', () => {
  assert.equal(add(2, 3), 5);
});
