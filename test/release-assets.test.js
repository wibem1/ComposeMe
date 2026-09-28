import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('browser entry module is cache-busted with app version',()=>{assert.ok(html.includes('src/app.js?v='+pkg.version));});test('model control is a select populated by JavaScript',()=>{assert.ok(html.includes('<select id="model" required></select>'));});

test('all internal cache-busted module imports match app version',()=>{
 const files=['src/app.js','src/notation-recognition.js'];
 for(const file of files){
  const text=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  const versions=[...text.matchAll(/\.\/[^'"]+\?v=([0-9.]+)/g)].map(m=>m[1]);
  assert.ok(versions.length>0,file+' has no versioned module imports');
  for(const version of versions)assert.equal(version,pkg.version,file+' contains stale cache key '+version);
 }
});
