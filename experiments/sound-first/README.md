# ComposeMe Klangexperiment 0.1 (29.09.2026)

Eigenständige Testseite unter `/experiments/sound-first/`; bestehende ComposeMe-Oberfläche und Kompositionsfunktion unverändert.

## Ziel

Untersuchen, ob die **historische Prompt-Architektur** von Minimal Composer 0.4.24 einem Sprachmodell mehr musikalischen Gestaltungsspielraum gibt als der direkte Ein-Schritt-Aufruf des regulären ComposeMe. Referenz: historisches Diagnoseprotokoll zu *Nachtlicht*, 19.09.2026, 12:49 UTC (Claude Sonnet 5). Nicht die Musik nachahmen, sondern ein neues, musikalisch vergleichbares Klavierstück versuchen.

## Exakte und abweichende Bestandteile

1. Stufe 1 übernimmt die **historische erste Prompt-Formulierung wörtlich**; die tatsächliche Aufgabenstellung wird ergänzt.
2. Stufe 2 übernimmt die **Funktionsidee** der historischen Technikstufe: aus einem freien musikalischen Entwurf wird eine konkrete Komposition. **Bewusste Abweichung:** historisch war die Ausgabe MIDI-Event-JSON, in diesem ComposeMe-Versuch wird ABC erzeugt, damit die vorhandene Notenanzeige und Wiedergabe genutzt werden können. Dieser Unterschied ist ein möglicher Einfluss auf die Qualität und darf beim Auswerten nicht verschwiegen werden.
3. Keine Vorschrift zu bestimmten Melodien, Harmonien, rhythmischen Mustern oder einer bestimmten Form aus *Nachtlicht*. Keine automatische Kritik-/Verbesserungsschleife und keine zusätzliche kostenpflichtige KI-Anfrage.
4. Prompt, Rohantwort, Tokens, geschätzte Kosten und Laufzeiten jeder Stufe lassen sich als vollständige Diagnose lokal herunterladen. Der API-Schlüssel wird **weder protokolliert noch gespeichert**. Die Seite hat keinen eigenen Verlauf.

## Kontrollierter Vergleich

- In regulärem ComposeMe und im Klangexperiment denselben **sichtbaren Auftrag**, denselben **Provider** und dasselbe **Modell** wählen.
- Je mindestens eine unabhängige Komposition erzeugen; bei stark streuenden Ergebnissen Wiederholungen mit getrennten Diagnosen. Eine einzelne erfolgreiche oder misslungene Probe beweist keine zuverlässige Qualitätsverbesserung.
- Musik anhören, nicht die Selbstbeschreibung der KI bewerten. Besonders auf melodische Eigenständigkeit, Verlauf, rhythmische Vielfalt, Verhältnis der Stimmen, Ausdruck und unnötiges Füllmaterial achten.
- Technisch prüfen: ABC-Notation darstellbar und abspielbar, Stimmensynchronität, grobe Entwurfsabweichungen und tatsächliche Länge. Technische Mängel getrennt von musikalischer Qualität notieren.
- Rückmeldung vor einer Integration in die reguläre App auswerten.

## Qualitätsbehauptung

**Keine.** Tests prüfen die Funktionsfähigkeit der Versuchsanordnung, nicht die musikalische Güte. Der historische *Nachtlicht*-Entwurf nennt 50 Takte, die damalige MIDI-Realisierung läuft bis Viertelschlag 52 und ist wesentlich kürzer als angekündigt. Diese frühere Schwäche darf nicht als ideale Werktreue ausgegeben werden.
