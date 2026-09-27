import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
test('browser entry module is cache-busted with app version',()=>{assert.ok(html.includes('src/app.js?v='+pkg.version));});test('model control is a select populated by JavaScript',()=>{assert.ok(html.includes('<select id="model" required></select>'));});
