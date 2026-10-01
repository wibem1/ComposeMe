import test from 'node:test';
import assert from 'node:assert/strict';
import {diagnosticRequest,diagnosticResponse} from '../src/api-diagnostic.js';
test('request diagnostic preserves exact payload but excludes credentials and query keys',()=>{
 const template={headers:{Authorization:'Bearer SECRET'}};
 const req={url:'https://example.org/v1/models/x?key=SECRET',headers:{Authorization:'Bearer SECRET','Content-Type':'application/json'},
  body:{model:'m',input:[{role:'user',content:[{type:'input_text',text:'Walzer'}]}],store:false}};
 const d=diagnosticRequest(template,req);
 assert.equal(d.endpoint,'https://example.org/v1/models/x');assert.equal(d.body.store,false);
 assert.doesNotMatch(JSON.stringify(d),/SECRET/);assert.deepEqual(d.headerNames,['Content-Type']);
});
test('response diagnostic includes token breakdown and safe structural metadata, not generated content',()=>{
 const d=diagnosticResponse('openai',{id:'r1',model:'m',status:'completed',
  usage:{input_tokens:4,output_tokens:30,output_tokens_details:{reasoning_tokens:23}},
  output:[{type:'message',content:[{type:'output_text',text:'PRIVATE'}]}]},
  {status:200,headers:{get:n=>n==='x-request-id'?'trace-1':null}});
 assert.equal(d.usage.output_tokens_details.reasoning_tokens,23);
 assert.equal(d.requestId,'trace-1');assert.doesNotMatch(JSON.stringify(d),/PRIVATE/);
});
