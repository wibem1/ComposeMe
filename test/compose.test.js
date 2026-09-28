import test from 'node:test';
import assert from 'node:assert/strict';
import {compose} from '../src/compose.js';
test('whole composition pipeline preserves response plus usage metadata',async()=>{
  const r=await compose({task:'Walzer',additionalInstructions:'Keine Vorentwürfe.',provider:'openai',model:'gpt-6-luna',apiKey:'k',transport:async()=>({ok:true,status:200,json:async()=>({output_text:'ABC',usage:{input_tokens:100,output_tokens:50}})})});
  assert.equal(r.aiResponse,'ABC');assert.match(r.actualRequest,/Keine Vorentwürfe/);assert.equal(r.userInput,'Walzer');assert.equal(r.usage.total,150);assert.ok(r.estimatedCost>0);
});
