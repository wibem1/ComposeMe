# ComposeMe 0.8.23

GitHub Pages: https://wibem1.github.io/ComposeMe/

## Komponieren

**Direkter Modus:** Bisheriger ComposeMe-Ablauf, genau ein KI-Aufruf mit dem sichtbaren Kompositionsauftrag und optionalen sichtbaren zusätzlichen Angaben. Die KI-Ausgabe bleibt vollständig sichtbar. Notendarstellung wird an die passende externe Noten-App übergeben.

**Klangvorstellung → Komposition:** Vollständig dokumentierte Integration des ursprünglichen zweistufigen Verfahrens von Minimal Composer 0.5.99 / Composition Engine 1.4.0-experiment. Im Auswahlfeld **Kompositionsablauf** wählen.

1. Der persönliche Auftrag bleibt frei. Die erste vollständige historische KI-Anfrage ist sichtbar und editierbar.
2. Sol entwickelt eine klingende Vorstellung, die in ComposeMe vollständig angezeigt wird.
3. Aus persönlichem Auftrag und dieser Vorstellung entsteht die zweite vollständige historische Anfrage. Sie wird ebenfalls vollständig angezeigt. Optional zwischen den Aufrufen anhalten, lesen, bearbeiten und manuell fortsetzen. Im automatischen Modus laufen beide ursprünglichen Aufrufe unmittelbar nacheinander und unverändert.
4. Die Original-Engine verarbeitet die kompakte JSON-Partitur zu MIDI **ohne neue musikalische KI-Anweisungen oder nachträgliche Note-by-note-Korrektur**.
5. Das originale MIDI, das Protokoll mit den beiden tatsächlich gesendeten Prompts und den originalen KI-Antworten sowie die Klangvorstellung werden im normalen ComposeMe-Verlauf gespeichert. Auch bei einem Fehler bleiben abgeschlossene KI-Aufrufe für die Diagnose erhalten.

Der historisch identische Ablauf nutzt **OpenAI GPT-5.6 Sol**. Eine bewusst editierte Anweisung ist als solche im Kommunikationsprotokoll erkennbar und gilt dann nicht mehr als unveränderter historischer Test. Bei exakt einer fehlenden terminalen eckigen JSON-Klammer wird nur diese technische Klammer ergänzt; die unberührte Originalantwort bleibt im Protokoll erhalten.

**Historischer Zweistufenmodus (0.8.15):** Der Ablauf endet nach Klangvorstellung und Komposition. Danach stehen Original-MIDI, SoundFont-Wiedergabe, Verlauf und vollständiges Kommunikationsprotokoll zur Verfügung. Es gibt keinen dritten KI-Aufruf und keine interne MusicXML- oder ABC-Erzeugung für diesen Modus. Notensatz ist bewusst ausgelagert; ComposeMe enthält keine interne ABC-Notendarstellung mehr.

## Historische Quellen

- Historische Original-Engine: [Minimal Composer, Commit 37fa33d636, composition-engine-sound-concept.js](https://github.com/wibem1/Minimal-Composer/blob/37fa33d636/composition-engine-sound-concept.js)
- Byte-identische Kopie: [experiments/sound-concept-149/historical-engine.js](experiments/sound-concept-149/historical-engine.js), ursprüngliche Git-Blob-SHA `f40b809e1cfe8b2bd18db348a35859be3932e0fa`. Ihr Inhalt wurde für die Integration **nicht verändert**.
- Separater unveränderter Vergleichsversuch: [experiments/sound-concept-149/](experiments/sound-concept-149/)

## Qualitätssicherung

`npm run verify` führt statische, Unit- und Smoke-Tests aus, einschließlich exakter historischer Anfragen, des zweistufigen Ablaufs, des optionalen manuellen Halts, unveränderter Original-MIDI-Daten, MIDI-Parsing, JSON→MusicXML-Notation, MusicXML-Ausgabe und technischer Fehlerbehandlung. GitHub Actions führt zusätzlich echte Browser-Smoke-Tests aus, die beide historischen KI-Aufrufe mit einer **simulierten** API-Antwort und die Speicherung im regulären Verlauf prüfen. Die Tests verursachen keine kostenpflichtigen API-Aufrufe und stellen **keinen musikalischen Hörtest** dar; die musikalische Qualität einer neuen echten Sol-Komposition muss beim Anwender beurteilt werden.

Die bisherige Direktkomposition und bestehende Experimente werden nicht gelöscht oder migriert.


### 0.8.15 – Entschlackung\nDer historische Modus wurde auf die zwei musikalisch relevanten KI-Aufrufe zurückgeführt. Alte MusicXML-/ABC-Daten in bestehenden Verlaufseinträgen bleiben als gespeicherte Alt-Daten erhalten, werden aber nicht mehr ausgeführt oder dargestellt.\n

### 0.8.15 – Modellauswahl
Provider und Modell sind im Zweistufenmodus wieder frei wählbar. Fest bleibt nur der Ablauf „Klangvorstellung → Komposition“; die Auswahl wird tatsächlich für beide KI-Aufrufe verwendet und im Kommunikationsprotokoll gespeichert.


### 0.8.15 – Experimentisolation und Diagnose
Geladene historische Versuche zeigen ihre alten Prompts nur zur Einsicht. Ein neuer Versuch verwendet wieder die vollständige erste Originalanweisung, sofern diese nicht nach dem Laden ausdrücklich bearbeitet wurde. Diagnose-Export ist eine separate Rubrik und darf Key-Speicher nicht verändern; beim Start löscht ein leeres Key-Eingabefeld keinen gespeicherten Schlüssel mehr. Größere Rubriktitel.

### 0.8.15 – Oberfläche
Einheitliche Schriftgrößen für Eingabefelder, Schaltflächen und aufklappbare Rubriken, klar abgegrenzte Bereiche, harmonisierte Abstände und bessere Darstellung auf schmalen Displays. Nur Darstellung; Komposition, MIDI, Verlauf und Diagnose unverändert.

### 0.8.15 – Lesbarkeit und Player
Größere Beschriftungen der Hauptfelder; „Kompositionsauftrag“ heißt „Auftrag“. Original-MIDI-Player nach dem kompakten Vorbild von Minimal Composer mit Abspielen/Pause, Stopp, Positionsregler, Zeit und Status. Keine Änderung des eigentlichen Kompositionsverfahrens.

### 0.8.15 – Übergabe an ABC Tools
Für KI-Ausgaben im ABC-Format gibt es jetzt direkt bei der Antwort die Schaltfläche „An ABC Tools übergeben“. Übergeben wird die erkannte ABC-Partitur an die abgespeckte wibem1-ABC-Tools-Version; dort wird sie unmittelbar geladen und dargestellt.

### 0.8.23 – Automatische Noten-App
Ein einziger Button „In Noten-App öffnen“ entscheidet automatisch: LilyPond wird an Hacklily übergeben; ABC, MusicXML und das Original-MIDI des historischen Zweistufenmodus werden an die abgespeckte wibem1-Version von ABC Tools übergeben. Größere MusicXML- und MIDI-Daten werden lokal im Browser übergeben statt in die URL geschrieben.

### 0.8.23 – Vergleich
Die Rubrik „Vergleich“ ist einklappbar.

### 0.8.23 – Interne Notenansicht entfernt
Die fehleranfällige interne ABC-Notendarstellung wurde entfernt. ComposeMe konzentriert sich auf Komposition, Wiedergabe des Original-MIDI im Zweistufenmodus, Verlauf und Vergleich. Der Vergleich zeigt Auftrag und Ausgabe beider Versionen; jede geeignete Ausgabe kann mit „In Noten-App öffnen“ an Hacklily oder ABC Tools übergeben werden.

### 0.8.23 – Zweistufenmodus: MusicXML statt MIDI-Transkription
Für „In Noten-App öffnen“ wird die vorhandene historische JSON-Partitur jetzt lokal und deterministisch in zweisystemiges Klavier-MusicXML umgesetzt und an ABC Tools übergeben. Kein zusätzlicher KI-Aufruf, keine musikalische Neukomposition und keine kostenpflichtige Konvertierung. Das Original-MIDI bleibt unverändert für Wiedergabe und Download erhalten. Die technische Aufteilung verwendet zwei Klaviersysteme und mehrere Stimmen, damit überlappende Noten nicht verloren gehen.

### 0.8.23 – Infotext entfernt
Der erläuternde Absatz unter dem Zweistufenmodus wurde aus der Oberfläche entfernt.

### 0.8.23 – Fortsetzen nach Netzwerkfehler
Bricht der zweite KI-Aufruf des Zweistufenmodus mit einem Netzwerkfehler ab, bleibt die bereits fertige Klangvorstellung erhalten. Beim Laden dieses Zwischenstands kann „Komposition fortsetzen“ nur den zweiten KI-Aufruf erneut ausführen; der erste Aufruf wird nicht wiederholt. Fehlgeschlagene Aufrufe werden im Protokoll ausdrücklich als fehlgeschlagen markiert.

### 0.8.23 – Erster Prompt dauerhaft editierbar
Eine eigene Fassung der ersten KI-Anweisung wird lokal im Browser gespeichert und nach Neustart wiederhergestellt. Beim Wechsel des Auftrags wird der AUFTRAG-Abschnitt an den aktuellen Auftrag angepasst. „Standard wiederherstellen“ löscht die gespeicherte eigene Fassung und stellt die historische Originalanweisung wieder her.
