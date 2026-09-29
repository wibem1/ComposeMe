import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {beamSimpleEighths} from '../src/metric-beaming.js';
import {normalizeAbcForAbcjs} from '../src/music-view.js';

const abendlicht=fs.readFileSync(new URL('./fixtures/abendlicht-original.abc', import.meta.url),'utf8');
test('Abendlicht: LH eighths join in four paired beats without altering pitches or timing',()=>{
 const visual=normalizeAbcForAbcjs(abendlicht);
 const originalLeft=abendlicht.slice(abendlicht.indexOf('[V:LH]'));
 const left=visual.slice(visual.indexOf('[V:LH]'));
 assert.match(left,/\[V:LH\] A,,E, A,C EC A,E,\s*\|/);
 assert.equal(left.replace(/\s+/g,''),originalLeft.replace(/\s+/g,''));
 const right=visual.slice(visual.indexOf('[V:RH]'),visual.indexOf('[V:LH]'));
 assert.match(right,/"Am"E2 A2 c2 B2/);
 assert.equal(right.replace(/\s+/g,''),abendlicht.slice(abendlicht.indexOf('[V:RH]'),abendlicht.indexOf('[V:LH]')).replace(/\s+/g,''));
});
test('6/8 uses groups of three eighths',()=>{
 const score='X:1\nM:6/8\nL:1/8\nK:C\nC D E F G A |';
 assert.equal(beamSimpleEighths(score),'X:1\nM:6/8\nL:1/8\nK:C\nCDE FGA |');
});
test('rests and quarter notes break beam runs',()=>{
 const score='X:1\nM:4/4\nL:1/8\nK:C\nC D z E F2 G A |';
 assert.equal(beamSimpleEighths(score),'X:1\nM:4/4\nL:1/8\nK:C\nCD z E F2 GA |');
});
test('explicit beaming, tuplets, complex punctuation and non-eighth defaults are unchanged',()=>{
 for(const source of ['CDEF G A B c |','(3CDE F G A B c d |','C-D E F G A B c |']){
  const abc='X:1\nM:4/4\nL:1/8\nK:C\n'+source;
  assert.equal(beamSimpleEighths(abc),abc);
 }
 const other='X:1\nM:4/4\nL:1/4\nK:C\nC D E F |';
 assert.equal(beamSimpleEighths(other),other);
});
