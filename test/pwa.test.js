import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('web app manifest requests standalone display and has install icons',async()=>{
  const manifest=JSON.parse(await readFile(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.start_url,'./');
  assert.ok(manifest.icons.some(x=>x.sizes==='192x192'));
  assert.ok(manifest.icons.some(x=>x.sizes==='512x512'));
});

test('index links manifest and all three API key inputs',async()=>{
  const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
  assert.match(html,/rel="manifest"/);
  assert.match(html,/id="api-key-openai"/);
  assert.match(html,/id="api-key-anthropic"/);
  assert.match(html,/id="api-key-google"/);
  assert.match(html,/id="install-app"/);
});

test('service worker is network-first and claims clients',async()=>{
  const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');
  assert.match(sw,/fetch\(event\.request\)/);
  assert.match(sw,/self\.clients\.claim\(\)/);
  assert.match(sw,/minimal-composer-next-0\.6\.0/);
});
