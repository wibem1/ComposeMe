import test from 'node:test';import assert from 'node:assert/strict';import {extractAbc,normalizeAbcForAbcjs,analyzeInstrumentRanges} from '../src/music-view.js';test('extracts plain ABC',()=>assert.equal(extractAbc('X:1\nK:C\nC6|]'),'X:1\nK:C\nC6|]'));test('extracts fenced ABC without fence',()=>assert.equal(extractAbc('```abc\nX:1\nK:C\nC6|]\n```'),'X:1\nK:C\nC6|]'));test('returns empty for non ABC answer',()=>assert.equal(extractAbc('Keine Notation'),'') );


test('moves ABC voice declarations before K for abcjs score rendering',()=>{
 const abc=`X:1
T:Valse mélancolique
M:3/4
L:1/4
%%score (Vln) (Pno1 Pno2)
K:Am
V:Vln clef=treble name="Violine"
V:Pno1 clef=treble name="Klavier"
V:Pno2 clef=bass
[V:Vln] z2 e | a3 |
[V:Pno1] z [A c e] [A c e] | z [A c e] [A c e] |
[V:Pno2] A,,3 | A,,3 |`;
 const normalized=normalizeAbcForAbcjs(abc);
 const k=normalized.indexOf('K:Am');
 assert.ok(normalized.indexOf('V:Vln')<k);
 assert.ok(normalized.indexOf('V:Pno1')<k);
 assert.ok(normalized.indexOf('V:Pno2')<k);
 assert.ok(normalized.indexOf('[V:Vln]')>k);
});


test('flags suspiciously high violin register without changing notes',()=>{
 const abc=`X:1
M:3/4
L:1/4
V:Vln clef=treble name="Violine"
K:Am
[V:Vln] a'3 | b'3 | c''3 | e''3 | a'3 |`;
 const warnings=analyzeInstrumentRanges(abc);
 assert.equal(warnings.length,1);
 assert.equal(warnings[0].type,'suspicious-high-register');
 const normalized=normalizeAbcForAbcjs(abc);
 assert.match(normalized,/a'3 \| b'3 \| c''3 \| e''3/);
});
test('does not flag ordinary violin register',()=>{
 const abc=`X:1
M:3/4
L:1/4
V:Vln clef=treble name="Violine"
K:Am
[V:Vln] e3 | a3 | g f e | d2 e |`;
 assert.equal(analyzeInstrumentRanges(abc).length,0);
});
