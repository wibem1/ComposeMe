import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));

test('notation action requires a complete directly renderable ABC score',async()=>{
  const action=await readFile(new URL('../src/notation-action.js',import.meta.url),'utf8');
  assert.match(action,/NOTATIONSAUFTRAG/);
  assert.match(action,/vollständige, direkt darstellbare ABC-Notation/);
  assert.match(action,/abcjs 6\.5\.2/);
  assert.match(action,/Tonhöhen, Oktavlagen, Rhythmus, Taktart, Tempo, Stimmen und Form/);
  assert.match(action,/realistische Lage/);
  assert.match(action,/korrekte Taktlängen/);
  assert.match(action,/syntaktische Konsistenz und vollständige Taktzahl/);
  assert.doesNotMatch(action,/Erstelle daraus eine Komposition\.'/);
});
test('notation conversion button and module are present',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  const action=await readFile(new URL('../src/notation-action.js',import.meta.url),'utf8');
  assert.match(html,/id="notate-response"/);
  assert.ok(html.includes('notation-action.js?v='+pkg.version));
  assert.match(action,/form\.requestSubmit\(\)/);
});
