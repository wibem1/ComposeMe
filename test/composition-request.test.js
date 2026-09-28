import test from 'node:test';import assert from 'node:assert/strict';import {buildCompositionRequest} from '../src/composition-request.js';test('request',()=>assert.equal(buildCompositionRequest({task:' A ',additionalInstructions:'Z'}),'Z\n\nKOMPOSITIONSAUFTRAG:\nA'));test('empty',()=>assert.throws(()=>buildCompositionRequest({task:' '})));

test('ABC request gets octave-convention guard',()=>{
 const request=buildCompositionRequest({task:'Erstelle daraus eine Komposition in ABC Format.'});
 assert.match(request,/ABC-HINWEIS/);
 assert.match(request,/Apostrophe erhöhen/);
 assert.match(request,/nicht mechanisch/);
});
test('ordinary composition request gets no ABC guard',()=>{
 const request=buildCompositionRequest({task:'Komponiere einen Walzer.'});
 assert.doesNotMatch(request,/ABC-HINWEIS/);
});


test('ABC pitch guard defines Helmholtz-to-ABC octave mapping used by Valse fixture',()=>{
 const source="Violine: e' a' d'' e'''\nErstelle daraus eine Komposition in abc Format.";
 const request=buildCompositionRequest({task:source});
 assert.match(request,/c' = ABC C/);
 assert.match(request,/e' = ABC E/);
 assert.match(request,/a' = ABC A/);
 assert.match(request,/d'' = ABC d/);
 assert.match(request,/e''' = ABC e'/);
 assert.match(request,/Übernimm Apostrophe niemals mechanisch/);
});
