# Historisches Kompositionsexperiment – ComposeMe 0.1

Stand: 29. September 2026. Separater Test unter `experiments/historical-midi/`; die normale ComposeMe-Anwendung bleibt unverändert.

## Fragestellung

Kann der früher als musikalisch überzeugend beurteilte zweistufige MinimalComposer-Ansatz (v0.4.24) mit demselben heute verfügbaren Modell ein Klavierstück musikalisch interessanter erzeugen als ein direkter Aufruf?

Referenz: ursprünglicher MinimalComposer-Quellstand `wibem1/Minimal-Composer`, Commit `d45884f2162fbbaeb1d652458d2aa15b3bc76918`, plus gespeichertes Diagnoseprotokoll von „Nachtlicht“ am 19.09.2026. Der erste und der zweite historische Prompt sowie der ursprüngliche MIDI-Generator werden im Quelltext **wortgleich** übernommen. Provider/Modell sind heute wechselbar; das damalige Ergebnis stammte von Claude Sonnet 5. Der bei der Übersetzung für Claude verwendete Parameter `thinking:disabled` wird von ComposeMes Provider-Adapter nicht gesetzt; dies ist für einen identischen Claude-Versuch ein dokumentierter Unterschied.

## Zwei vergleichbare Betriebsarten

- **Historisch:** Der erste KI-Aufruf erzeugt einen freien musikalischen Entwurf. Der zweite KI-Aufruf bekommt genau den originalen historischen Übersetzer-Prompt mitsamt diesem Entwurf und demselben MIDI-JSON-Vertrag.
- **Direkt:** Ein einzelner KI-Aufruf komponiert unmittelbar im selben MIDI-JSON-Format. Der direkte Prompt ist ein neu definierter Kontrollprompt und war *nicht* Teil von Version 0.4.24.

Beide Varianten verwenden den originalen lokalen MIDI-Generator sowie denselben bewusst einfachen Browser-Kontrollklang. Zur musikalischen Bewertung die ausgegebenen MIDI-Dateien mit demselben hochwertigen Instrument und identischer Lautstärkeeinstellung abspielen. Es gibt keine automatische Qualitätsbewertung, keine Note-Korrektur und keine wiederholten kostenpflichtigen Anfragen.

### Wichtige Einschränkungen

Eine Qualitätsverbesserung ist noch **nicht** nachgewiesen. „Nachtlicht“: Entwurf umfasste laut Text 50 Takte, die MIDI-Ausgabe endet aber bereits bei Viertelschlag 52, also nach ungefähr 17 6/8-Takten. Die Differenz spricht gegen die Annahme, die werkgetreue Einhaltung des Entwurfs hätte die frühere Wirkung erzeugt. Zudem war „Nachtlicht“ mit Claude Sonnet 5 entstanden, während der neue Vergleich mangels Claude-Credits zunächst GPT-5.6 Sol nutzt.

Das Experiment reproduziert also die *historischen Anweisungen* und das *historische MIDI-Datenformat*, aber nicht das damalige Modell oder dessen nichtdeterministische musikalische Entscheidungen. Die dritte damalige KI-Stufe formulierte erst im Nachhinein eine Kompositionsbeschreibung und beeinflusste die MIDI-Komposition nicht; um Kosten zu sparen, ist sie in diesem Vergleich weggelassen.

## Auswertung

1. Bei beiden Modi denselben knappen Auftrag (z. B. „Komponiere ein eigenständiges Klavierstück.“), dieselbe KI und dasselbe Modell verwenden.
2. MIDI-Dateien speichern und mit identischem Klang in Reaper oder einem geeigneten Spieler anhören; Eindrücke vor Einsicht in die KI-Selbstbeschreibung festhalten.
3. Die vollständigen Diagnose-Dateien sichern. Erst anhand dieser feststellen, ob bereits der Entwurf eine überzeugende musikalische Idee enthält oder der zweite Aufruf bei beschreibendem Entwurf noch die entscheidende Musik erfindet.
4. Bei deutlichen Unterschieden denselben Vergleich mehrmals durchführen, bevor ein neuer Ansatz in die Haupt-App integriert wird.

**Beobachtungsziel:** Eigenständigkeit der Melodie, Verhältnis von Melodie und Begleitung, rhythmische Entwicklung, harmonische Abwechslung, Phrasen, dynamische Gestaltung, tatsächliche Länge und ggf. mechanische Wiederholungen. Keine automatischen Scores.
