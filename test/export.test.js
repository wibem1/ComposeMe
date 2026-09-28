import test from 'node:test';
import assert from 'node:assert/strict';
import {abcToMusicXml} from '../src/abc-to-musicxml.js';

const abc=['X:1','T:Abendlicht','M:4/4','L:1/8','Q:1/4=88','K:C','%%score {RH LH}',
'V:RH clef=treble','V:LH clef=bass',
'[V:RH] E2 GA G2 E2 | D2 EF E4 | C2 EG A2 G2 | F4 E2 D2 | E2 Gc B2 G2 | A2 FE D4 | G2 FE D2 B2 | c8 |]',
'[V:LH] C,2 G,2 E2 G,2 | G,2 D2 F2 D2 | A,2 E2 c2 E2 | F,2 C2 A2 C2 | E,2 B,2 G2 B,2 | A,2 E2 D2 A,2 | G,2 D2 F2 D2 | C,2 G,2 [CEG]4 |]'].join('\n');

test('MusicXML contains both hands, title, clefs, note durations, and 8 measures per hand',()=>{
 const xml=abcToMusicXml(abc);
 assert.ok(xml.startsWith('<?xml version="1.0"'));
 assert.ok(xml.includes('<work-title>Abendlicht</work-title>'));
 assert.ok(xml.includes('<sign>G</sign>'));
 assert.ok(xml.includes('<sign>F</sign>'));
 assert.ok(xml.includes('<duration>504</duration><type>eighth</type>'));
 assert.equal((xml.match(/<measure number="/g)||[]).length,16);
 assert.ok(xml.includes('<chord/>'));
});
test('MusicXML rejects unsupported ABC instead of exporting incorrect notes',()=>{
 assert.throws(()=>abcToMusicXml(abc.replace('E2 GA','E2 ^GA')),/nicht unterstützte ABC-Syntax/);
 assert.throws(()=>abcToMusicXml(abc.replace('M:4/4','M:6/8')),/unterstützt derzeit/);
});
