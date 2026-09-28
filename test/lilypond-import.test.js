import test from 'node:test';import assert from 'node:assert/strict';import {lilyToAbc} from '../src/lilypond-import.js';
const source="\\version \"2.24.3\"\n\\header { title = \"Abendlicht\" composer = \"Originalkomposition\" }\n\\score { \\new PianoStaff <<\n\\new Staff { \\clef treble \\key c \\major \\time 4/4 \\tempo 4 = 80 \\fixed c' { e'4 g'8 a'8 g'4 e'4 | f'4 a'8 g'8 f'4 d'4 | g'4 b'8 a'8 g'4 d'4 | a'4 g'8 f'8 e'2 | f'4 a'8 c''8 b'4 a'4 | g'4 e'8 d'8 c'4 e'4 | d'4 f'8 a'8 g'4 b'4 | c''1 \\bar \"|.\" } }\n\\new Staff { \\clef bass \\key c \\major \\time 4/4 \\fixed c' { <c g>2 <e g>2 | <d a>2 <f a>2 | <g, d>2 <b, f>2 | <f, c>2 <a, c>2 | <f, c>2 <a, c>2 | <c g>2 <e g>2 | <g, d>2 <b, f>2 | <c g c'>1 \\bar \"|.\" } }\n>> }";
test('Abendlicht pitch and duration',()=>{const abc=lilyToAbc(source);assert.match(abc,/T:Abendlicht/);assert.match(abc,/Q:1\/4=80/);assert.match(abc,/\[V:RH\] E2 GA G2 E2/);assert.match(abc,/\[V:LH\] \[C,G,\]4 \[E,G,\]4/);assert.match(abc,/c8 \|\]/);assert.match(abc,/\[C,G,C\]8 \|\]/);});
test('unsupported meter rejected',()=>assert.throws(()=>lilyToAbc(source.replaceAll('\\time 4/4','\\time 5/4')),/4\/4 und 6\/8/));

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
test('16-bar named relative voices in A minor are imported',()=>{const abc=lilyToAbc(sixteenBarNamedVoices);assert.match(abc,/T:Im Abendlicht/);assert.match(abc,/K:Am/);assert.match(abc,/Q:1\/4=76/);assert.match(abc,/%%barsperstaff 4/);assert.match(abc,/\^G/);assert.match(abc,/z2/);assert.match(abc,/\[A,,E,A,C\]4/);const rh=abc.match(/^\[V:RH\](.*)$/m)?.[1];const lh=abc.match(/^\[V:LH\](.*)$/m)?.[1];assert.equal((rh.match(/ \| /g)||[]).length,15);assert.equal((lh.match(/ \| /g)||[]).length,15);});

const directNamedStaves=String.raw`\version "2.24.3"
\header { title = "Abendlicht" composer = " " }
\score {
  \new PianoStaff <<
    \new Staff = "rechts" {
      \clef treble \key c \major \time 4/4
      \tempo "Andante, cantabile" 4 = 76
      e''4\p g''8 a''8 g''4 e''4 |
      c''4 e''8 f''8 e''4 c''4 |
      a'4 c''8 d''8 c''4 a'4 |
      b'4 d''8 f''8 d''4 b'4 |
      g'4 b'8 c''8 b'4 g'4 |
      a'4 c''8 e''8 a''4 g''4 |
      f''4 e''8 d''8 c''4 a'4 |
      b'2 d''4 r4 |
      e''4\mf g''8 c'''8 b''4 g''4 |
      d''4 g''8 b''8 a''4 g''4 |
      e''4 a''8 c'''8 b''4 a''4 |
      g''4 e''8 d''8 b'4 g'4 |
      a'4\> c''8 f''8 e''4 c''4 |
      d''4 f''8 a''8 g''4 f''4 |
      f''4 d''8 b'8 g'4 b'4 |
      <e' g' c''>1\pp\! \bar "|."
    }
    \new Staff = "links" {
      \clef bass \key c \major \time 4/4
      c8 g c' e' g e' c' g |
      a,8 e a c' e c' a e |
      f,8 c f a c' a f c |
      g,8 d g b d' b g d |
      e,8 b, e g b g e b, |
      a,8 e a c' e' c' a e |
      d,8 a, d f a f d a, |
      g,8 d g b d' b g d |
      c8 g c' e' g e' c' g |
      b,8 g b d' g' d' b g |
      a,8 e a c' e' c' a e |
      g,8 e g b e' b g e |
      f,8 c f a c' a f c |
      d,8 a, d f a f d a, |
      g,8 d g b f' b g d |
      c,8 g, c e <c e g c'>2
    }
  >>
  \layout { }
  \midi { }
}`;
test('16-bar direct named Staff blocks with absolute pitches and dynamics are imported',()=>{const abc=lilyToAbc(directNamedStaves);assert.match(abc,/T:Abendlicht/);assert.match(abc,/Q:1\/4=76/);assert.match(abc,/K:C/);assert.match(abc,/%%barsperstaff 4/);assert.match(abc,/\[V:RH\] e2 ga g2 e2/);assert.match(abc,/z2/);assert.match(abc,/\[EGc\]8/);const rh=abc.match(/^\[V:RH\](.*)$/m)?.[1];const lh=abc.match(/^\[V:LH\](.*)$/m)?.[1];assert.equal((rh.match(/ \| /g)||[]).length,15);assert.equal((lh.match(/ \| /g)||[]).length,15);});


const contextVoiceRegression=String.raw`\version "2.24.3"
PartPOneVoiceOne = \relative d'' { \clef treble \time 4/4 \key d \minor d4 f8 e d4 a4 | d1 }
PartPTwoVoiceOne = \relative f' { \clef treble \time 4/4 \key d \minor <f a>4 a8 d <f, a>4 e8 f | <f a d>1 }
PartPTwoVoiceTwo = \relative d { \clef bass \time 4/4 \key d \minor d2 a2 | <d d'>1 }
\score { <<
\new Staff << \set Staff.instrumentName = "Violine" \context Staff << \context Voice = "PartPOneVoiceOne" { \PartPOneVoiceOne } >> >>
\new PianoStaff << \set PianoStaff.instrumentName = "Klavier"
\context Staff = "1" << \context Voice = "PartPTwoVoiceOne" { \PartPTwoVoiceOne } >>
\context Staff = "2" << \context Voice = "PartPTwoVoiceTwo" { \PartPTwoVoiceTwo } >>
 >> >> }`;
test('context Voice ensemble keeps instrument names and relative chord reference',()=>{const abc=lilyToAbc(contextVoiceRegression);assert.match(abc,/V:V1 clef=treble name="Violine"/);assert.match(abc,/V:V2 clef=treble name="Klavier rechts"/);assert.match(abc,/V:V3 clef=bass name="Klavier links"/);const bass=abc.match(/^\[V:V3\](.*)$/m)?.[1];assert.ok(bass.includes('D,4 A,,4'));assert.ok(!bass.includes('D,,,,'));});


const changingMeter=String.raw`\version "2.24.0"
\header { title = "Taktwechsel" }
global = { \key c \minor \time 6/8 }
upper = \relative c'' {
 \global
 \tempo "Andante" 4.=72
 c4. d4. | e8 f g aes bes c |
 \time 4/4
 c4 d e f | g2 aes2 |
 \time 6/8
 g4. f4. | e8 d c bes aes g |
}
lower = \relative c {
 \global \clef bass
 c4. g4. | aes4. ees4. |
 \time 4/4
 c4 g' ees c | f2 g2 |
 \time 6/8
 c,4. g'4. | c,8 d ees f g aes |
}
\score { \new PianoStaff << \new Staff = "upper" \upper \new Staff = "lower" \lower >> }`;

test('6/8 with 4/4 meter changes and dotted quarters is imported',()=>{
 const abc=lilyToAbc(changingMeter);
 assert.match(abc,/M:6\/8/);
 assert.match(abc,/Q:3\/8=72/);
 assert.match(abc,/\[M:4\/4\]/);
 assert.match(abc,/\[M:6\/8\]/);
 assert.match(abc,/K:Cm/);
 const rh=abc.match(/^\[V:RH\](.*)$/m)?.[1]??'';
 const lh=abc.match(/^\[V:LH\](.*)$/m)?.[1]??'';
 assert.equal((rh.match(/ \| /g)||[]).length,5);
 assert.equal((lh.match(/ \| /g)||[]).length,5);
});


const tupletAndQ=String.raw`\version "2.24.0"
\header { title = "Tuplet" }
upper = \relative c'' { \clef treble \key c \minor \time 4/4
 <c ees g>4 \tuplet 3/2 { c8 d ees } <f aes c>4 q |
 g16 a bes c d e f g a bes c d e f g a |
}
lower = \relative c { \clef bass \key c \minor \time 4/4
 c2 g | c,4 g' ees c |
}
\score { \new PianoStaff << \new Staff = "upper" \upper \new Staff = "lower" \lower >> }`;

test('tuplets and q chord repeats are imported',()=>{
 const abc=lilyToAbc(tupletAndQ);
 assert.match(abc,/\(3:2/);
 assert.match(abc,/\[[^\]]+\]2 \[[^\]]+\]2/);
 assert.match(abc,/M:4\/4/);
});


const doubleAccidental=String.raw`\version "2.24.0"
\header { title = "Doppelte Vorzeichen" }
upper = \relative c'' { \clef treble \key cis \minor \time 4/4 fisis4 gis a b | cis1 }
lower = \relative c { \clef bass \key cis \minor \time 4/4 cis2 gis | cis1 }
\score { \new PianoStaff << \new Staff = "upper" \upper \new Staff = "lower" \lower >> }`;

test('double sharps such as fisis are imported',()=>{
 const abc=lilyToAbc(doubleAccidental);
 assert.match(abc,/\^\^f/);
 assert.match(abc,/K:C#m/);
});


test('exact Éclats d’Ombre fixture converts without importer error',async()=>{
 const source=await (await import('node:fs/promises')).readFile(new URL('./fixtures/eclats-dombre.ly',import.meta.url),'utf8');
 const abc=lilyToAbc(source);
 assert.match(abc,/T:Éclats d’Ombre/);
 assert.match(abc,/M:6\/8/);
 assert.match(abc,/Q:3\/8=76/);
 assert.match(abc,/K:C#m/);
 assert.match(abc,/\[M:4\/4\]/);
 assert.match(abc,/\[M:6\/8\]/);
});


const directViolinPiano=String.raw`\\version "2.24.3"
\header { title = "Valse mélancolique" }
\score {
 <<
  \new Staff \with { instrumentName = "Violine" } {
   \clef treble \key d \minor \time 4/4
   a'4 bes' c'' d'' | e''2 d''2 |
  }
  \new PianoStaff <<
   \new Staff {
    \clef treble \key d \minor \time 4/4
    f'4 a' d'' c'' | bes'2 a'2 |
   }
   \new Staff {
    \clef bass \key d \minor \time 4/4
    d2 a | bes2 a |
   }
  >>
 >>
}`;
test('direct violin plus piano three-staff score is imported',()=>{
 const abc=lilyToAbc(directViolinPiano);
 assert.match(abc,/T:Valse mélancolique/);
 assert.match(abc,/%%score V1 \{V2 V3\}/);
 assert.match(abc,/V:V1 clef=treble name="Violine"/);
 assert.match(abc,/V:V2 clef=treble name="Klavier rechts"/);
 assert.match(abc,/V:V3 clef=bass name="Klavier links"/);
});
