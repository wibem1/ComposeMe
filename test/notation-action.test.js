import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildNotationRequest} from '../src/compose.js';

test('notation conversion prompt asks only for complete notation',()=>{
  const p=buildNotationRequest('Ein Klavierstück in C-Dur.');
  assert.match(p,/ABC oder LilyPond/);
  assert.match(p,/AUSGANGSKOMPOSITION/);
  assert.match(p,/ohne Kommentar oder Erläuterung/);
});
test('notation conversion button and module are present',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const action=await readFile(new URL('../src/notation-action.js',import.meta.url),'utf8');
  assert.match(html,/id="notate-response"/);
  assert.match(html,/notation-action\.js\?v=0\.6\.3/);
  assert.match(action,/form\.requestSubmit\(\)/);
});
