import test from 'node:test';import assert from 'node:assert/strict';import {lilyToAbc} from '../src/lilypond-import.js';
const source="\\version \"2.24.3\"\n\\header { title = \"Abendlicht\" composer = \"Originalkomposition\" }\n\\score { \\new PianoStaff <<\n\\new Staff { \\clef treble \\key c \\major \\time 4/4 \\tempo 4 = 80 \\fixed c' { e'4 g'8 a'8 g'4 e'4 | f'4 a'8 g'8 f'4 d'4 | g'4 b'8 a'8 g'4 d'4 | a'4 g'8 f'8 e'2 | f'4 a'8 c''8 b'4 a'4 | g'4 e'8 d'8 c'4 e'4 | d'4 f'8 a'8 g'4 b'4 | c''1 \\bar \"|.\" } }\n\\new Staff { \\clef bass \\key c \\major \\time 4/4 \\fixed c' { <c g>2 <e g>2 | <d a>2 <f a>2 | <g, d>2 <b, f>2 | <f, c>2 <a, c>2 | <f, c>2 <a, c>2 | <c g>2 <e g>2 | <g, d>2 <b, f>2 | <c g c'>1 \\bar \"|.\" } }\n>> }";
test('Abendlicht pitch and duration',()=>{const abc=lilyToAbc(source);assert.match(abc,/T:Abendlicht/);assert.match(abc,/Q:1\/4=80/);assert.match(abc,/\[V:RH\] E2 GA G2 E2/);assert.match(abc,/\[V:LH\] \[C,G,\]4 \[E,G,\]4/);assert.match(abc,/c8 \|\]/);assert.match(abc,/\[C,G,C\]8 \|\]/);});
test('unsupported meter rejected',()=>assert.throws(()=>lilyToAbc(source.replaceAll('\\time 4/4','\\time 6/8')),/4\/4/));

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

const sixteenBarNamedVoices=String.raw`\version "2.24.3"
\pointAndClickOff
\header { title = "Im Abendlicht" subtitle = "Für Klavier" composer = " " }
\layout { \context { \Score autoBeaming = ##f } }
PartPOneVoiceOne = \relative e' {
 \clef "treble" \numericTimeSignature\time 4/4 \key a \minor |
 \tempo 4=76 \stemDown e4 _\markup{ \italic {dolce} } _ \p \stemDown a8 [ \stemDown b8 ] \stemDown c4 \stemDown b8 [ \stemDown a8 ] |
 \stemDown g4 \stemDown e8 [ \stemDown g8 ] \stemDown a2 |
 \stemDown f4 \stemDown a8 [ \stemDown c8 ] \stemDown b4 \stemDown a8 [ \stemDown g8 ] |
 \stemUp e2 r4 \stemDown e8 [ \stemDown g8 ] \break |
 \stemDown a4 \stemDown c8 [ \stemDown d8 ] \stemDown e4 \stemDown d8 [ \stemDown c8 ] |
 \stemDown b4 \stemDown g8 [ \stemDown b8 ] \stemDown c2 |
 \stemDown d4 \stemDown c8 [ \stemDown b8 ] \stemDown a4 \stemDown gis8 [ \stemDown a8 ] |
 \stemDown b2 r4 \stemDown e,8 [ \stemDown gis8 ] \bar "||" \break |
 \stemDown a4 _\mf \stemDown b8 [ \stemDown c8 ] \stemDown e4 \stemDown d8 [ \stemDown c8 ] |
 \barNumberCheck #10 \stemDown b4 \stemDown c8 [ \stemDown d8 ] \stemDown e2 |
 \stemDown f4 \stemDown e8 [ \stemDown d8 ] \stemDown c4 \stemDown b8 [ \stemDown a8 ] |
 \stemDown gis2 r4 \stemDown e'8 [ \stemDown d8 ] \break |
 \stemDown c4 _\p \stemDown a8 [ \stemDown c8 ] \stemDown b4 \stemDown gis8 [ \stemDown b8 ] |
 \stemDown a4 \stemDown f8 [ \stemDown a8 ] \stemDown g4 \stemDown e8 [ \stemDown g8 ] |
 \stemDown f4 \stemDown e8 [ \stemDown d8 ] \stemDown e4 \stemDown gis8 [ \stemDown b8 ] |
 a1 ^\fermata \bar "|."
}
PartPOneVoiceTwo = \relative a, {
 \clef "bass" \numericTimeSignature\time 4/4 \key a \minor |
 \stemUp a8 [ \stemUp e'8 \stemUp a8 \stemUp c8 ] \stemUp a8 [ \stemUp e8 \stemUp a8 \stemUp e8 ] |
 \stemUp g,8 [ \stemUp d'8 \stemUp g8 \stemUp b8 ] \stemUp g8 [ \stemUp d8 \stemUp g8 \stemUp d8 ] |
 \stemUp f,8 [ \stemUp c'8 \stemUp f8 \stemUp a8 ] \stemUp f8 [ \stemUp c8 \stemUp f8 \stemUp c8 ] |
 \stemUp e,8 [ \stemUp b'8 \stemUp e8 \stemUp gis8 ] \stemUp e8 [ \stemUp b8 \stemUp e8 \stemUp b8 ] |
 \stemUp a8 [ \stemUp e'8 \stemUp a8 \stemUp c8 ] \stemUp a8 [ \stemUp e8 \stemUp a8 \stemUp e8 ] |
 \stemUp g,8 [ \stemUp d'8 \stemUp g8 \stemUp b8 ] \stemUp g8 [ \stemUp d8 \stemUp g8 \stemUp d8 ] |
 \stemUp f,8 [ \stemUp c'8 \stemUp f8 \stemUp a8 ] \stemUp f8 [ \stemUp c8 \stemUp f8 \stemUp c8 ] |
 \stemUp e,8 [ \stemUp b'8 \stemUp e8 \stemUp gis8 ] \stemUp e8 [ \stemUp b8 \stemUp e8 \stemUp b8 ] |
 \stemUp a8 [ \stemUp e'8 \stemUp a8 \stemUp c8 ] \stemUp a8 [ \stemUp e8 \stemUp a8 \stemUp e8 ] |
 \barNumberCheck #10 \stemUp g,8 [ \stemUp d'8 \stemUp g8 \stemUp b8 ] \stemUp g8 [ \stemUp d8 \stemUp g8 \stemUp d8 ] |
 \stemUp f,8 [ \stemUp c'8 \stemUp f8 \stemUp a8 ] \stemUp f8 [ \stemUp c8 \stemUp f8 \stemUp c8 ] |
 \stemUp e,8 [ \stemUp b'8 \stemUp e8 \stemUp gis8 ] \stemUp e8 [ \stemUp b8 \stemUp e8 \stemUp b8 ] |
 \stemUp a8 [ \stemUp e'8 \stemUp a8 \stemUp c8 ] \stemUp a8 [ \stemUp e8 \stemUp a8 \stemUp e8 ] |
 \stemUp d,8 [ \stemUp a'8 \stemUp d8 \stemUp f8 ] \stemUp d8 [ \stemUp a8 \stemUp d8 \stemUp a8 ] |
 \stemUp e8 [ \stemUp b'8 \stemUp e8 \stemUp gis8 ] \stemUp e8 [ \stemUp b8 \stemUp e8 \stemUp b8 ] |
 \stemUp a8 [ \stemUp e'8 \stemUp a8 \stemUp c8 ] \stemUp <a, e' a c>2 \bar "|."
}
\score { << \new PianoStaff <<
 \context Staff = "1" << \context Voice = "PartPOneVoiceOne" { \PartPOneVoiceOne } >>
 \context Staff = "2" << \context Voice = "PartPOneVoiceTwo" { \PartPOneVoiceTwo } >>
>> >> \layout {} }`;
test('16-bar named relative voices in A minor are imported',()=>{const abc=lilyToAbc(sixteenBarNamedVoices);assert.match(abc,/T:Im Abendlicht/);assert.match(abc,/K:Am/);assert.match(abc,/Q:1\/4=76/);assert.match(abc,/\^G/);assert.match(abc,/z2/);assert.match(abc,/\[A,,E,A,C\]4/);const rh=abc.match(/^\[V:RH\](.*)$/m)?.[1];const lh=abc.match(/^\[V:LH\](.*)$/m)?.[1];assert.equal((rh.match(/ \| /g)||[]).length,15);assert.equal((lh.match(/ \| /g)||[]).length,15);});
