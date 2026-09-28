import test from 'node:test';import assert from 'node:assert/strict';import {responseFile,hacklilyUrl} from '../src/response-file.js';

const lily='### Hinter der Tür\n\n```lilypond\n\\version "2.24.3"\n\\header { title = "Hinter der Tür" }\n\\score { c4 \\layout {} }\n```';

test('LilyPond response is saved as clean .ly file',()=>{
  const f=responseFile(lily);
  assert.equal(f.format,'lilypond');
  assert.match(f.filename,/^Hinter der T.*r\.ly$/);
  assert.match(f.content,/\\version/);
  assert.doesNotMatch(f.content,/```/);
});

test('ABC response is saved as .abc',()=>{
  const f=responseFile('```abc\nX:1\nT:Test\nM:4/4\nK:C\nC4|\n```');
  assert.equal(f.filename,'Test.abc');
  assert.equal(f.format,'abc');
});

test('Hacklily handoff uses src fragment and preserves LilyPond source',()=>{
  const url=hacklilyUrl(lily);
  assert.match(url,/^https:\/\/www\.hacklily\.org\/#src=/);
  assert.match(decodeURIComponent(url.split('#src=')[1]),/title = "Hinter der Tür"/);
});

test('Hacklily handoff rejects non-LilyPond output',()=>{
  assert.throws(()=>hacklilyUrl('plain text'),/keinen LilyPond-Code/);
});
