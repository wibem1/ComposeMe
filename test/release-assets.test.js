import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('browser entry module is cache-busted with app version',()=>{assert.ok(html.includes('src/app.js?v='+pkg.version));});test('model control is a select populated by JavaScript',()=>{assert.ok(html.includes('<select id="model" required></select>'));});

test('all internal cache-busted module imports match app version',()=>{
 const srcDir=new URL('../src/',import.meta.url);
 const files=fs.readdirSync(srcDir).filter(name=>name.endsWith('.js'));
 let checked=0;
 for(const name of files){
  const file='src/'+name;
  const text=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  const versions=[...text.matchAll(/\.\/[^'"]+\?v=([0-9.]+)/g)].map(m=>m[1]);
  if(!versions.length)continue;
  checked++;
  for(const version of versions)assert.equal(version,pkg.version,file+' contains stale cache key '+version);
 }
 assert.ok(checked>0,'no versioned internal module imports found');
});


test('production keeps ABC rendering and adds LilyPond pass-through only',()=>{
 const production=['index.html',...fs.readdirSync(new URL('../src/',import.meta.url)).filter(name=>name.endsWith('.js')).map(name=>'src/'+name)];
 for(const file of production){
  const text=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assert.doesNotMatch(text,/lilyToAbc/i,file+' must not convert LilyPond musically');
 }
 assert.match(html,/vollständige, gültige ABC-Notation/);
 assert.match(html,/abcjs 6\.5\.2/);
 assert.match(html,/Ausgabe als Datei speichern/);
 assert.match(html,/In Hacklily öffnen/);
 assert.doesNotMatch(html,/notate-response|notation-action\.js/);
});
