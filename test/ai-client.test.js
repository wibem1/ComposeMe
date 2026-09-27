import test from 'node:test';import assert from 'node:assert/strict';import {sendToAI} from '../src/ai-client.js';
const response=data=>({ok:true,status:200,json:async()=>data});
test('OpenAI adapter and extraction',async()=>{let seen;const text=await sendToAI({provider:'openai',model:'gpt-test',prompt:'Hallo',apiKey:'secret',transport:async(u,o)=>(seen={u,o},response({output_text:'Antwort'}))});assert.equal(text,'Antwort');assert.equal(JSON.parse(seen.o.body).input,'Hallo');assert.match(seen.o.headers.Authorization,/secret/)});
test('Anthropic extraction',async()=>assert.equal(await sendToAI({provider:'anthropic',model:'claude-test',prompt:'P',apiKey:'k',transport:async()=>response({content:[{type:'text',text:'A'}]})}),'A'));
test('Google extraction',async()=>assert.equal(await sendToAI({provider:'google',model:'gemini-test',prompt:'P',apiKey:'k',transport:async()=>response({candidates:[{content:{parts:[{text:'G'}]}}]})}),'G'));
test('HTTP errors are surfaced',async()=>await assert.rejects(()=>sendToAI({provider:'openai',model:'m',prompt:'p',apiKey:'k',transport:async()=>({ok:false,status:429})}),/HTTP 429/));
