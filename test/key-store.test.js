import test from 'node:test';import assert from 'node:assert/strict';import {createKeyStore} from '../src/key-store.js';
function memory(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
test('stores provider keys separately',()=>{const s=createKeyStore(memory());s.set('openai','oa');s.set('anthropic','an');s.set('google','go');assert.equal(s.get('openai'),'oa');assert.equal(s.get('anthropic'),'an');assert.equal(s.get('google'),'go');});
test('empty key removes saved value',()=>{const s=createKeyStore(memory());s.set('openai','x');s.set('openai','');assert.equal(s.get('openai'),'');});
