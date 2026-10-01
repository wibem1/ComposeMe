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


test('production keeps direct notation routing without hidden musical conversion',()=>{
 const production=['index.html',...fs.readdirSync(new URL('../src/',import.meta.url)).filter(name=>name.endsWith('.js')).map(name=>'src/'+name)];
 for(const file of production){
  const text=fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');
  assert.doesNotMatch(text,/lilyToAbc/i,file+' must not convert LilyPond musically');
 }
 assert.match(html,/<textarea id="additional" rows="9"><\/textarea>/);
 assert.doesNotMatch(html,/AUSGABEFORMAT:/);
 assert.match(html,/Ausgabe als Datei speichern/);
 assert.match(html,/In Noten-App öffnen/);
 assert.match(html,/Ausgabe in Eingabe kopieren/);
 assert.match(html,/id="delete-history"/);
 assert.doesNotMatch(html,/Variante erzeugen/);
 assert.doesNotMatch(html,/variant-request\.js|buildVariantRequest|actualRequestOverride/);
 assert.doesNotMatch(html,/notate-response|notation-action\.js/);
});


test('internal ABC renderer is not shipped in the production page',()=>{
 assert.doesNotMatch(html,/abcjs/i);
 assert.doesNotMatch(html,/Notenansicht/);
 assert.match(html,/In Noten-App öffnen/);
});

test('additional instructions remain editable in every mode',()=>{
 const ui=fs.readFileSync(new URL('../src/historical-ui.js',import.meta.url),'utf8');
 assert.match(ui,/additional\.disabled=false/);
 assert.match(ui,/additional\.readOnly=false/);
 assert.doesNotMatch(html,/<textarea id="additional"[^>]*(disabled|readonly)/i);
});

test('Pure MIDI comparison mode is exposed',()=>{
 assert.match(html,/value="pure-midi"/);
 const src=fs.readFileSync(new URL('../src/pure-midi-compose.js',import.meta.url),'utf8');
 assert.match(src,/Ein einziger KI-Aufruf/);
 assert.match(src,/CLASSIC_TECHNICAL_CONTRACT/);
 assert.match(src,/pureMidiPrompt/);
});

test('Pure MIDI exposes CC events and production MIDI builder/player handle them',()=>{
 const pure=fs.readFileSync(new URL('../src/pure-midi-compose.js',import.meta.url),'utf8');
 const engine=fs.readFileSync(new URL('../experiments/sound-concept-149/historical-engine.js',import.meta.url),'utf8');
 const player=fs.readFileSync(new URL('../src/historical-player.js',import.meta.url),'utf8');
 assert.match(pure,/\"cc\": \[\[StartBeat, CCNummer, Wert\]/);
 assert.match(engine,/176\|ch/);
 assert.match(player,/kind===0xB0/);
 assert.match(player,/controller===64/);
});
