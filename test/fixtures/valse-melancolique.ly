\version "2.22.0"

\header {
  title = "Valse mélancolique"
  subtitle = "Erinnerung an den Herbst"
  composer = "Entwurf"
  tagline = ""
}

global = {
  \key a \minor
  \time 3/4
  \tempo "Andante con tenerezza, rubato" 4 = 126
}

violin = \relative c' {
  \global
  % Teil A
  r2 e4\p( |
  a2.) |
  g4( f e) |
  d2 e4 |
  c2. |
  d'2\espressivo c8( b) |
  b2 a4 |
  a2. |
  
  % Teil B
  c'2.\< |
  d4( e g\!) |
  a2.\f |
  g2 f4 |
  d4( f a) |
  b2.\ff |
  a8\> gis f e r4\! |
  d2\fermata\p b4 |
  
  % Teil A'
  a'2.\f |
  g4( f e) |
  f2 e4 |
  e2.\> |
  d4(\! c b) |
  b4( c d) |
  c2\p b4 |
  a2. |
  
  % Coda
  c4\pp( b a) |
  f2 e4 |
  e2. |
  a2. |
  e'''2.^\markup { \italic "flageolet" } ~ |
  e2. |
  a''2.^\markup { \italic "flageolet" } |
  R2.\fermata \bar "|."
}

pianoRH = \relative c' {
  \global
  % Teil A
  r4 <a c e> <a c e> |
  r4 <a c e> <a c e> |
  r4 <d f a> <d f a> |
  r4 <d gis b> <d gis b> |
  r4 <c e a> <c e a> |
  r4 <f a d> <f a d> |
  r4 <a d e> <gis d' e> |
  r4 \tuplet 3/2 { e'8( a c } e4) |
  
  % Teil B
  r4 <e, g c> <e g c> |
  r4 <d g b> <d g b> |
  r4 <c f a> <c f a> |
  r4 <g' c e> <g c e> |
  r4 <f c' d> <f c' d> |
  r4 <e d' e>2 |
  <d' e gis>2 <d e>4 |
  \arpeggio <e, b' d gis e'>2.\fermata |
  
  % Teil A'
  r4 <c' e a> <c e a> |
  r4 <f, b d> <f b d> |
  r4 <f bes d> <f bes d> |
  r4 <e gis d'> <e gis d'> |
  r4 <f a c> <f a c> |
  r4 <f a d> <f a d> |
  r4 <e gis d'> <e gis b> |
  r4 <e a c>2 |
  
  % Coda
  r4 <c' e a>2\pp |
  r4 <c e f>2 |
  r4 <b d e>2 |
  r4 <c e a>2 |
  a'4 g f |
  <c e>2. |
  \arpeggio <e, gis b d e>2. |
  <c e a c>2.\fermata \bar "|."
}

pianoLH = \relative c {
  \global
  \clef bass
  % Teil A
  a2. |
  a2. |
  f2. |
  e2. |
  a2. |
  d,2. |
  e2. |
  a2. |
  
  % Teil B
  c2. |
  g2. |
  f4 c' f |
  e2. |
  d2. |
  gis,2. |
  e2. |
  e2.\fermata |
  
  % Teil A'
  a4 e' a |
  d,2. |
  bes2. |
  e,2. |
  f2. |
  b,2. |
  e2. |
  a,2. |
  
  % Coda
  a2. |
  d,2. |
  e2. |
  a2. |
  a2. |
  d4 a2 |
  e2. |
  << { a,2.\fermata } \\ { a,2. } >> \bar "|."
}

\score {
  <<
    \new Staff \with {
      instrumentName = "Violine"
    } \violin
    
    \new PianoStaff \with {
      instrumentName = "Klavier"
    } <<
      \new Staff = "rh" \pianoRH
      \new Staff = "lh" \pianoLH
    >>
  >>
  \layout { }
  \midi { }
}