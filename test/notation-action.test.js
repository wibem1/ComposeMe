import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('notation action adds only the free composition instruction',async()=>{
  const action=await readFile(new URL('../src/notation-action.js',import.meta.url),'utf8');
  assert.match(action,/source\+'\\n\\nErstelle daraus eine Komposition\.'/);
  assert.doesNotMatch(action,/ABC-Notation|LilyPond|bewahre|vollständige Notation|ohne Kommentar/i);
});
test('notation conversion button and module are present',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const action=await readFile(new URL('../src/notation-action.js',import.meta.url),'utf8');
  assert.match(html,/id="notate-response"/);
  assert.match(html,/notation-action\.js\?v=0\.6\.6/);
  assert.match(action,/form\.requestSubmit\(\)/);
});
