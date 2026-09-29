import test from 'node:test';
import assert from 'node:assert/strict';
import {auditAbcMeasures} from '../src/abc-measure-check.js';
const source=`X:1
M:4/4
L:1/8
K:Cm
V:1 clef=treble
V:2 clef=bass
[V:1] G2 cd e2 d2 | c2 GA G4 | =Bdf a2 g2 f2 | c4 G2 z2 |
[V:2] C,G,C,G, E,G,C,G, | A,,E,A,E, C,E,A,E, | G,,D,G,D, F,G,=B,D, | [C,G,C]4 [G,,D,G,]4 |`;
test('detects extra eighth in the right hand',()=>{
 const issues=auditAbcMeasures(source);
 assert.deepEqual(issues.map(({voice,bar,actual,expected})=>({voice,bar,actual,expected})),[{voice:'1',bar:3,actual:9,expected:8}]);
});
test('same measures after note-duration correction',()=>assert.deepEqual(auditAbcMeasures(source.replace('=Bdf a2 g2 f2','=Bdfa g2 f2')),[]));
test('unsupported tuplets are not guessed',()=>assert.deepEqual(auditAbcMeasures('X:1\nM:4/4\nL:1/8\nK:C\n[V:1] (3CDE F2 G2 A2 |'),[]));
