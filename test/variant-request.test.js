import test from 'node:test';
import assert from 'node:assert/strict';
import {buildVariantRequest} from '../src/variant-request.js';

test('variant request uses the concrete composition plus current UI instructions',()=>{
  const request=buildVariantRequest(
    {aiResponse:'\\version "2.24.3"\n\\score { c4 }'},
    {task:'Diesmal ruhiger und kontrapunktischer.',additionalInstructions:'Violine und Klavier stärker im Dialog.'}
  );
  assert.match(request,/VARIANTENAUFTRAG/);
  assert.match(request,/ANWEISUNG FÜR DIE VARIANTE:\nDiesmal ruhiger und kontrapunktischer\./);
  assert.match(request,/ZUSÄTZLICHE ANGABEN FÜR DIE VARIANTE:\nVioline und Klavier stärker im Dialog\./);
  assert.match(request,/VORLAGE:\n\\version "2.24.3"/);
  assert.match(request,/eigenständige musikalische Lösung/);
});

test('variant request works without optional instructions',()=>{
  const request=buildVariantRequest({aiResponse:'ABC'});
  assert.match(request,/VORLAGE:\nABC/);
  assert.doesNotMatch(request,/ANWEISUNG FÜR DIE VARIANTE:/);
});

test('variant request needs an existing composition',()=>{
  assert.throws(()=>buildVariantRequest({aiResponse:''}),/vorhandene KI-Komposition/);
});
