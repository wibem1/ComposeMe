import test from 'node:test';
import assert from 'node:assert/strict';
import {buildCompositionRequest} from '../src/composition-request.js';

test('additional instructions stay visible and precede task',()=>{
 assert.equal(buildCompositionRequest({task:' A ',additionalInstructions:'Z'}),'Z\n\nKOMPOSITIONSAUFTRAG:\nA');
});
test('empty task is rejected',()=>assert.throws(()=>buildCompositionRequest({task:' '})));
test('no hidden ABC instructions are appended',()=>{
 const request=buildCompositionRequest({task:'Komponiere einen Walzer.',additionalInstructions:'ABC bitte'});
 assert.equal(request,'ABC bitte\n\nKOMPOSITIONSAUFTRAG:\nKomponiere einen Walzer.');
});
