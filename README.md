# ComposeMe 0.8.3

GitHub Pages: https://wibem1.github.io/ComposeMe/

## Komponieren

**Direkter Modus:** Bisheriger ComposeMe-Ablauf, genau ein KI-Aufruf mit dem sichtbaren Kompositionsauftrag und optionalen sichtbaren zusätzlichen Angaben. Bestehende ABC-/LilyPond-Ansicht und Exportfunktionen bleiben erhalten.

**Klangvorstellung → Komposition:** Vollständig dokumentierte Integration des ursprünglichen zweistufigen Verfahrens von Minimal Composer 0.5.99 / Composition Engine 1.4.0-experiment. Im Auswahlfeld **Kompositionsablauf** wählen.

1. Der persönliche Auftrag bleibt frei. Die erste vollständige historische KI-Anfrage ist sichtbar und editierbar.
2. Sol entwickelt eine klingende Vorstellung, die in ComposeMe vollständig angezeigt wird.
3. Aus persönlichem Auftrag und dieser Vorstellung entsteht die zweite vollständige historische Anfrage. Sie wird ebenfalls vollständig angezeigt. Optional zwischen den Aufrufen anhalten, lesen, bearbeiten und manuell fortsetzen. Im automatischen Modus laufen beide ursprünglichen Aufrufe unmittelbar nacheinander und unverändert.
4. Die Original-Engine verarbeitet die kompakte JSON-Partitur zu MIDI **ohne neue musikalische KI-Anweisungen oder nachträgliche Note-by-note-Korrektur**.
5. Das originale MIDI, das Protokoll mit den beiden tatsächlich gesendeten Prompts und den originalen KI-Antworten sowie die Klangvorstellung werden im normalen ComposeMe-Verlauf gespeichert. Auch bei einem Fehler bleiben abgeschlossene KI-Aufrufe für die Diagnose erhalten.

Der historisch identische Ablauf nutzt **OpenAI GPT-5.6 Sol**. Eine bewusst editierte Anweisung ist als solche im Kommunikationsprotokoll erkennbar und gilt dann nicht mehr als unveränderter historischer Test. Bei exakt einer fehlenden terminalen eckigen JSON-Klammer wird nur diese technische Klammer ergänzt; die unberührte Originalantwort bleibt im Protokoll erhalten.

**Wiedergabe und Notenansicht (0.8.3):** Die fertige Komposition bleibt als JSON-Partitur und Original-MIDI unverändert. Danach folgt ein **dritter, ausdrücklich nicht-kompositorischer KI-Aufruf**: Sol erhält die fertige JSON-Partitur und überträgt sie in ABC-Notation. Dieser Aufruf darf keine Musik ändern, sondern nur notatorische Entscheidungen treffen. Seine vollständige Anfrage und Originalantwort werden im Kommunikationsprotokoll gespeichert. Der SoundFont-Player liest weiterhin ausschließlich das Original-MIDI und ist unabhängig vom ABC. Für die Klänge werden die im MIDI enthaltenen General-MIDI-Programme über WebAudioFont mit SoundFont-Samples wiedergegeben; die bisherige Oszillator-Vorschau entfällt.

Für ältere zweistufige Verlaufseinträge ohne KI-ABC gibt es **„ABC durch KI erzeugen“**. Dadurch wird nur die Notationsstufe nachgeholt; die vorhandene Komposition und das vorhandene MIDI werden nicht neu erzeugt. Die bisherige direkte ComposeMe-Komposition bleibt unverändert und benutzt weiterhin ihren bisherigen ABC-Player.

## Historische Quellen

- Historische Original-Engine: [Minimal Composer, Commit 37fa33d636, composition-engine-sound-concept.js](https://github.com/wibem1/Minimal-Composer/blob/37fa33d636/composition-engine-sound-concept.js)
- Byte-identische Kopie: [experiments/sound-concept-149/historical-engine.js](experiments/sound-concept-149/historical-engine.js), ursprüngliche Git-Blob-SHA `f40b809e1cfe8b2bd18db348a35859be3932e0fa`. Ihr Inhalt wurde für die Integration **nicht verändert**.
- Separater unveränderter Vergleichsversuch: [experiments/sound-concept-149/](experiments/sound-concept-149/)

## Qualitätssicherung

`npm run verify` führt statische, Unit- und Smoke-Tests aus, einschließlich exakter historischer Anfragen, des zweistufigen Ablaufs, des optionalen manuellen Halts, unveränderter Original-MIDI-Daten, MIDI-Parsing, JSON→ABC-Projektion und technischer Fehlerbehandlung. GitHub Actions führt zusätzlich echte Browser-Smoke-Tests aus, die beide historischen KI-Aufrufe mit einer **simulierten** API-Antwort und die Speicherung im regulären Verlauf prüfen. Die Tests verursachen keine kostenpflichtigen API-Aufrufe und stellen **keinen musikalischen Hörtest** dar; die musikalische Qualität einer neuen echten Sol-Komposition muss beim Anwender beurteilt werden.

Die bisherige Direktkomposition und bestehende Experimente werden nicht gelöscht oder migriert.
