import test from 'node:test';import assert from 'node:assert/strict';import {lilyToAbc} from '../src/lilypond-import.js';
const source="\\version \"2.24.3\"\n\\header { title = \"Abendlicht\" composer = \"Originalkomposition\" }\n\\score { \\new PianoStaff <<\n\\new Staff { \\clef treble \\key c \\major \\time 4/4 \\tempo 4 = 80 \\fixed c' { e'4 g'8 a'8 g'4 e'4 | f'4 a'8 g'8 f'4 d'4 | g'4 b'8 a'8 g'4 d'4 | a'4 g'8 f'8 e'2 | f'4 a'8 c''8 b'4 a'4 | g'4 e'8 d'8 c'4 e'4 | d'4 f'8 a'8 g'4 b'4 | c''1 \\bar \"|.\" } }\n\\new Staff { \\clef bass \\key c \\major \\time 4/4 \\fixed c' { <c g>2 <e g>2 | <d a>2 <f a>2 | <g, d>2 <b, f>2 | <f, c>2 <a, c>2 | <f, c>2 <a, c>2 | <c g>2 <e g>2 | <g, d>2 <b, f>2 | <c g c'>1 \\bar \"|.\" } }\n>> }";
test('Abendlicht pitch and duration',()=>{const abc=lilyToAbc(source);assert.match(abc,/T:Abendlicht/);assert.match(abc,/Q:1\/4=80/);assert.match(abc,/\[V:RH\] E2 GA G2 E2/);assert.match(abc,/\[V:LH\] \[C,G,\]4 \[E,G,\]4/);assert.match(abc,/c8 \|\]/);assert.match(abc,/\[C,G,C\]8 \|\]/);});
test('unsupported key rejected',()=>assert.throws(()=>lilyToAbc(source.replaceAll('\\key c \\major','\\key g \\major')),/C-Dur/));

const variant=source.replace('\\tempo 4 = 80','\\tempo "Andante" 4 = 88').replace("\\fixed c' { e'4 g'8 a'8 g'4 e'4","\\relative c'' { e4 g8 a8 g4 e4").replace("\\fixed c' { <c g>2","\\fixed c { <c g>2");
test('relative melody, fixed c bass and named tempo',()=>{const abc=lilyToAbc(variant);assert.ok(abc.includes('Q:1/4=88'));assert.ok(abc.includes('[V:RH] e2 ga g2 e2'));assert.ok(abc.includes('[V:LH] [C,G,]4'));});

const exactVariant=String.raw`\version "2.24.3"
\header { title = "Abendlicht" composer = " " }
\score {
\new PianoStaff <<
\new Staff {
\clef treble \key c \major \time 4/4 \tempo "Andante" 4 = 88
\relative c'' {
 e4 g8 a8 g4 e4 |
 d4 e8 f8 e2 |
 c4 e8 g8 a4 g4 |
 f2 e4 d4 |
 e4 g8 c8 b4 g4 |
 a4 f8 e8 d2 |
 g4 f8 e8 d4 b4 |
 c1
}
}
\new Staff {
\clef bass \key c \major \time 4/4
\fixed c {
 c,4 g, e g, |
 g, d f d |
 a, e c' e |
 f, c a c |
 e, b, g b, |
 a, e d, a, |
 g, d f d |
 c, g, <c e g>2
}
}
>>
\layout { }
\midi { }
}`;
test('user LilyPond example with relative melody and omitted bass durations',()=>{const abc=lilyToAbc(exactVariant);assert.ok(abc.includes('Q:1/4=88'));assert.ok(abc.includes('[V:RH] e2 ga g2 e2'));assert.ok(abc.includes('[V:LH] C,,2 G,,2 E,2 G,,2'));assert.ok(abc.includes('[C,E,G,]4 |]'));assert.equal(abc.match(/ \| /g)?.length,14);});
