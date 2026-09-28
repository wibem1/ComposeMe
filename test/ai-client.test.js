import test from 'node:test';
import assert from 'node:assert/strict';
import {sendToAI} from '../src/ai-client.js';
const response=data=>({ok:true,status:200,json:async()=>data});

test('openai returns text usage and cost metadata',async()=>{
  const r=await sendToAI({provider:'openai',model:'gpt-6-luna',prompt:'p',apiKey:'k',transport:async()=>response({output_text:'A',usage:{input_tokens:1000,output_tokens:200}})});
  assert.equal(r.text,'A');assert.deepEqual(r.usage,{input:1000,output:200,cached:0,total:1200});assert.ok(r.estimatedCost>0);
});
test('anthropic returns usage',async()=>{
  const r=await sendToAI({provider:'anthropic',model:'claude-sonnet-5',prompt:'p',apiKey:'k',transport:async()=>response({content:[{type:'text',text:'B'}],usage:{input_tokens:100,output_tokens:50}})});
  assert.equal(r.text,'B');assert.equal(r.usage.total,150);
});
test('google returns usage metadata',async()=>{
  const r=await sendToAI({provider:'google',model:'gemini-3.8-flash',prompt:'p',apiKey:'k',transport:async()=>response({candidates:[{content:{parts:[{text:'G'}]}}],usageMetadata:{promptTokenCount:80,candidatesTokenCount:20,totalTokenCount:100}})});
  assert.equal(r.text,'G');assert.equal(r.usage.total,100);
});
