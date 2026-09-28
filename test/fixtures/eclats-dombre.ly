\version "2.22.0"
\header {
  title = "Éclats d’Ombre"
  subtitle = "Étude-Nocturne für Klavier (16 Takte)"
  composer = "A. I."
}

global = {
  \key cis \minor
  \time 6/8
}

upper = \relative c'' {
  \global
  \tempo "Agitato e molto rubato" 4.=76
  r4. \p gis8( a gis | fisis gis e' dis4.~ | dis8) cis( bis cis fis a | gis4.~ gis8) r r |
  \time 4/4 \tempo "Più mosso, feroce" 4=116
  <cis, e gis cis>4\f \tuplet 3/2 { cis'8( bis cis) } <a, dis fis c'>4 q |
  <b d fisis b>4 \tuplet 3/2 { b'8( ais b) } <gis, bis dis a'>4 q |
  \tuplet 6/4 { dis''16\p[( e dis cis b a] } \tuplet 6/4 { gis[ fis e dis cis b]) } <bis dis fis a>2\sfz |
  <cis e gis>4 <d f a> <dis fis a c> <eis gis b d>\crescendo |
  \tempo "Maestoso" 4=92
  <e gis cis e>4\fff <fis a dis fis> <e gis cis e> <dis a' bis dis> |
  <cis fis a cis>4 <bis fis' gis bis> <cis e ais cis>2 |
  \tempo "Leggiero" \tuplet 4/3 { d'16\p c bes aes } \tuplet 4/3 { ges e d c } <bis dis fis>2\sfz |
  \tuplet 7/4 { a''16[\ff gis g fis f e dis] } \tuplet 7/4 { d[ cis c b ais a gis] } fis4 r |
  \time 4/4
  \tuplet 16/8 { cis'32[\p bis cis dis e fis gis a bis cis dis e fis gis a bis] } cis4\fermata r |
  \tempo "Ritardando" <dis,, fis gis bis>1\pp\fermata |
  \time 6/8 \tempo "Tempo I, Adagio" 4.=50
  r4. gis8(\ppp a gis |
  <eis, gis cis eis>2.)\fermata \bar "|."
}

lower = \relative c {
  \global
  \clef bass
  cis16( gis' e' b' cis8) r4. |
  a,,16( e' cis' g' a8) r4. |
  fis,,16( cis' a' d fis8) r4. |
  gis,,16( dis' bis' fis' gis8) gis,4 r8 |
  cis,,4 <e'' gis> a,, <dis' fis> |
  d,,4 <d'' fisis> gis,, <dis'' fis> |
  a,4 <a' e' g> gis, <gis' dis' fis> |
  cis,4 b a gis |
  cis,4 <cis'' e gis> c, <c' e fis a> |
  ais,4 <ais' cis fisis> a, <a' cis fis> |
  gis,1 <gis' bis dis> |
  <fis, fis'>4 <e e'> <dis dis'> r |
  \clef treble \tuplet 16/8 { a'''32[ gis fis e dis cis b a \clef bass gis fis e dis cis b a gis] } cis,4\fermata r |
  <gis, gis'>1\fermata |
  cis,16( gis' e' b' cis8) r4. |
  <cis,, gis' eis'>2.\fermata \bar "|."
}

\score {
  \new PianoStaff <<
    \new Staff = "upper" \upper
    \new Staff = "lower" \lower
  >>
  \layout { }
  \midi { }
}
