import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMidi} from '../src/historical-player.js';

function chunk(type,data){
 const enc=[...new TextEncoder().encode(type)],n=data.length;
 return [...enc,(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255,...data];
}
test('MIDI player parses generic CC and applies CC64 sustain to note duration',()=>{
 const track=[
  0x00,0xC0,0x00,
  0x00,0xB0,0x40,0x7F,
  0x00,0x90,0x3C,0x64,
  0x83,0x60,0x80,0x3C,0x00,
  0x83,0x60,0xB0,0x40,0x00,
  0x00,0xFF,0x2F,0x00
 ];
 const header=chunk('MThd',[0,0,0,0,0,1,1,0xE0]);
 const midi=Uint8Array.from([...header,...chunk('MTrk',track)]);
 const p=parseMidi(midi);
 assert.equal(p.cc.length,2);
 assert.deepEqual(p.cc.map(x=>[x.controller,x.value]),[[64,127],[64,0]]);
 assert.equal(p.notes.length,1);
 assert.ok(Math.abs(p.notes[0].end-1)<1e-9);
});
