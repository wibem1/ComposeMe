import test from 'node:test';
import assert from 'node:assert/strict';
import {buildVariantRequest} from '../src/variant-request.js';

test('variant request is based on the concrete current composition',()=>{
  const request=buildVariantRequest({userInput:'Komponiere 16 Takte',aiResponse:'\\version "2.24.3"\n\\score { c4 }'});
  assert.match(request,/VARIANTENAUFTRAG/);
  assert.match(request,/URSPRÜNGLICHER KOMPOSITIONSAUFTRAG:\nKomponiere 16 Takte/);
  assert.match(request,/VORLAGE:\n\\version "2.24.3"/);
  assert.match(request,/eigenständige musikalische Lösung/);
});
test('variant request needs an existing composition',()=>{
  assert.throws(()=>buildVariantRequest({userInput:'x',aiResponse:''}),/vorhandene KI-Komposition/);
});
