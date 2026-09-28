import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {abcToMusicXml} from '../src/abc-to-musicxml.js';
import {normalizeAbcForAbcjs} from '../src/music-view.js';
import {safeExportName,normalizeMidiBinary,assertMidiFile,svgFileText} from '../src/export-core.js';

const abendlicht=['X:1','T:Abendlicht','M:4/4','L:1/8','Q:1/4=88','K:C','%%score {RH LH}',
'V:RH clef=treble name="Klavier"','V:LH clef=bass name="Klavier"',
'[V:RH] E2 GA G2 E2 | D2 EF E4 | C2 EG A2 G2 | F4 E2 D2 | E2 Gc B2 G2 | A2 FE D4 | G2 FE D2 B2 | c8 |]',
'[V:LH] C,2 G,2 E2 G,2 | G,2 D2 F2 D2 | A,2 E2 c2 E2 | F,2 C2 A2 C2 | E,2 B,2 G2 B,2 | A,2 E2 D2 A,2 | G,2 D2 F2 D2 | C,2 G,2 [CEG]4 |]'].join('\n');

test('MusicXML exports ordinary two-staff piano score',()=>{
 const xml=abcToMusicXml(abendlicht);
 assert.ok(xml.startsWith('<?xml version="1.0"'));
 assert.ok(xml.includes('<work-title>Abendlicht</work-title>'));
 assert.equal((xml.match(/<score-part id=/g)||[]).length,1);
 assert.ok(xml.includes('<staves>2</staves>'));
 assert.equal((xml.match(/<measure number="/g)||[]).length,8);
 assert.ok(xml.includes('<chord/>'));
});

test('MusicXML exports exact Valse fixture as violin plus two-staff piano',async()=>{
 const raw=await readFile(new URL('./fixtures/valse-melancolique.abc',import.meta.url),'utf8');
 const abc=normalizeAbcForAbcjs(raw);
 const xml=abcToMusicXml(abc);
 assert.ok(xml.includes('<work-title>Valse mélancolique</work-title>'));
 assert.equal((xml.match(/<score-part id=/g)||[]).length,2);
 assert.ok(xml.includes('<part-name>Violine</part-name>'));
 assert.ok(xml.includes('<midi-program>41</midi-program>'));
 assert.ok(xml.includes('<part-name>Klavier</part-name>'));
 assert.ok(xml.includes('<staves>2</staves>'));
 assert.equal((xml.match(/<measure number="/g)||[]).length,64);
});

test('MIDI binary helper unwraps abcjs single-tune array and validates header',()=>{
 const bytes=new Uint8Array([77,84,104,100,0,0,0,6,0,1,0,1,1,224]);
 const out=assertMidiFile(normalizeMidiBinary([bytes]));
 assert.equal(out,bytes);
 assert.equal(String.fromCharCode(...out.slice(0,4)),'MThd');
});
test('invalid MIDI is rejected',()=>{
 assert.throws(()=>assertMidiFile(new Uint8Array([1,2,3])),/leer oder unvollständig/);
});
test('export filename is safe and stable',()=>{
 assert.equal(safeExportName('X:1\nT:Valse mélancolique\nK:Am'),'Valse_melancolique');
});
test('SVG export creates standalone XML',()=>{
 const clone={attrs:{},getAttribute(k){return this.attrs[k]??null;},setAttribute(k,v){this.attrs[k]=v;},get outerHTML(){return '<svg xmlns="'+this.attrs.xmlns+'"><g/></svg>';}};
 const svg={cloneNode(){return clone;}};
 const out=svgFileText(svg,'Test');
 assert.match(out,/^<\?xml/);
 assert.match(out,/xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
});
