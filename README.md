# ComposeMe 0.8.43

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

### 0.8.27 – Automatische Noten-App
Ein einziger Button „In Noten-App öffnen“ entscheidet automatisch: LilyPond wird an Hacklily übergeben; ABC, MusicXML und das Original-MIDI des historischen Zweistufenmodus werden an die abgespeckte wibem1-Version von ABC Tools übergeben. Größere MusicXML- und MIDI-Daten werden lokal im Browser übergeben statt in die URL geschrieben.

### 0.8.27 – Vergleich
Die Rubrik „Vergleich“ ist einklappbar.

### 0.8.27 – Interne Notenansicht entfernt
Die fehleranfällige interne ABC-Notendarstellung wurde entfernt. ComposeMe konzentriert sich auf Komposition, Wiedergabe des Original-MIDI im Zweistufenmodus, Verlauf und Vergleich. Der Vergleich zeigt Auftrag und Ausgabe beider Versionen; jede geeignete Ausgabe kann mit „In Noten-App öffnen“ an Hacklily oder ABC Tools übergeben werden.

### 0.8.27 – Zweistufenmodus: MusicXML statt MIDI-Transkription
Für „In Noten-App öffnen“ wird die vorhandene historische JSON-Partitur jetzt lokal und deterministisch in zweisystemiges Klavier-MusicXML umgesetzt und an ABC Tools übergeben. Kein zusätzlicher KI-Aufruf, keine musikalische Neukomposition und keine kostenpflichtige Konvertierung. Das Original-MIDI bleibt unverändert für Wiedergabe und Download erhalten. Die technische Aufteilung verwendet zwei Klaviersysteme und mehrere Stimmen, damit überlappende Noten nicht verloren gehen.

### 0.8.27 – Infotext entfernt
Der erläuternde Absatz unter dem Zweistufenmodus wurde aus der Oberfläche entfernt.

### 0.8.27 – Fortsetzen nach Netzwerkfehler
Bricht der zweite KI-Aufruf des Zweistufenmodus mit einem Netzwerkfehler ab, bleibt die bereits fertige Klangvorstellung erhalten. Beim Laden dieses Zwischenstands kann „Komposition fortsetzen“ nur den zweiten KI-Aufruf erneut ausführen; der erste Aufruf wird nicht wiederholt. Fehlgeschlagene Aufrufe werden im Protokoll ausdrücklich als fehlgeschlagen markiert.

### 0.8.27 – Erster Prompt dauerhaft editierbar
Eine eigene Fassung der ersten KI-Anweisung wird lokal im Browser gespeichert und nach Neustart wiederhergestellt. Beim Wechsel des Auftrags wird der AUFTRAG-Abschnitt an den aktuellen Auftrag angepasst. „Standard wiederherstellen“ löscht die gespeicherte eigene Fassung und stellt die historische Originalanweisung wieder her.

### 0.8.27 – Prompt bleibt unverändert
Der aktuell gespeicherte erste Prompt wird wortwörtlich weiterverwendet und nicht mehr automatisch an einen neuen Auftrag angepasst. Er bleibt gültig, bis er vom Nutzer überschrieben oder mit „Standard wiederherstellen“ zurückgesetzt wird.

### 0.8.27 – Alle editierbaren Prompts bleiben bestehen
Für beide editierbaren KI-Anweisungen gilt dieselbe Regel: Eine vom Nutzer geänderte Fassung wird wortwörtlich lokal gespeichert und bleibt erhalten, bis sie erneut überschrieben oder mit „Standard wiederherstellen“ zurückgesetzt wird. Solange Prompt 2 nie manuell geändert wurde, darf er weiterhin aus aktuellem Auftrag und aktueller Klangvorstellung erzeugt werden.

### 0.8.27 – Prompt 2: Vorspann bleibt, Klangvorstellung wechselt
Bei Prompt 2 wird nur der vom Nutzer geänderte Vorspann bis unmittelbar vor „KLINGENDE VORSTELLUNG“ dauerhaft gespeichert. Die Klangvorstellung wird bei jeder neuen Komposition aus KI-Aufruf 1 neu eingesetzt. Der technische Schlussblock wird aus dem aktuellen Standard übernommen. Alte v0.8.25-Speicherungen des vollständigen Prompt 2 werden auf den Vorspann migriert.

### 0.8.27 – Promptvorlagen stabil, Auftrag dynamisch
Die vom Nutzer bearbeiteten Anweisungsteile von Prompt 1 und Prompt 2 bleiben dauerhaft gespeichert. Der eigentliche Kompositionsauftrag wird bei jedem Lauf aus dem aktuellen Auftragsfeld eingesetzt. Bei Prompt 2 wird zusätzlich die jeweils neue Klangvorstellung eingesetzt; der technische Schlussblock bleibt separat. So bleiben die Promptformulierungen stabil, während Auftrag und Klangvorstellung flexibel bleiben.

### 0.8.28 – JSON-Codeblöcke robust verarbeiten
Im Zweistufenmodus akzeptiert ComposeMe nun auch technisch korrektes JSON, das ein Modell in einen äußeren Markdown-Codeblock (`\`\`json … \`\`\``) setzt. Der Codeblock wird lokal vor dem JSON-Parsing entfernt; die originale KI-Antwort bleibt im Protokoll unverändert. Keine zusätzliche KI-Anfrage und keine musikalische Veränderung.


### 0.8.29 – Allgemeine Partiturstruktur
Der technische JSON-Vertrag kann musikalisch eigenständige Stimmen desselben Instruments nun explizit als getrennte Spuren kennzeichnen (`Instrument :: Stimme`). Das gilt allgemein für Klavier, Streicher, Chor und andere mehrstimmige Besetzungen; einzelne Instrumente bleiben normale eigene Spuren. Der lokale MusicXML-Konverter gruppiert solche Stimmen wieder zu einem Instrument, erhält ihre Stimmenstruktur und übernimmt vorhandene enharmonische Notennamen. Keine zusätzliche KI-Anfrage und keine musikalische Nachkorrektur.


### 0.8.37 – Darstellungsquantifizierung
Die direkte MIDI/JSON-Komposition bleibt unverändert und behält freie Start- und Dauernwerte für die Wiedergabe. Für ABC Tools erzeugt ComposeMe aus einer geklonten Partitur eine separate Anzeige-MIDI, deren Notenanfänge und -enden auf ein Sechzehntel-Raster gesetzt werden. Die gespeicherte JSON-Partitur und die Original-MIDI-Datei bleiben unverändert. Für intern erzeugte JSON-Partituren ist damit kein MusicXML-Zwischenschritt mehr nötig.


### 0.8.38 – Polyphone Anzeige-MIDI
Für die Übergabe an ABC Tools werden überlappende Noten eines Tracks in getrennte Notationsstimmen verteilt. Gleichzeitig beginnende und gleich lange Akkordtöne bleiben zusammen. Das betrifft ausschließlich die darstellungsquantisierte Anzeige-MIDI; Original-JSON und Original-MIDI bleiben unverändert.


### 0.8.39 – Transparente technische Zusatzangaben
Im Pure→MIDI/JSON-Modus wird der technische JSON/MIDI-Vertrag nicht mehr unsichtbar im Code an die Anfrage angehängt. Er steht sichtbar und editierbar im Feld „Zusätzliche Angaben an die KI“. Gesendet wird ausschließlich der dort sichtbare Inhalt plus der Kompositionsauftrag. Das Feld speichert seinen Inhalt getrennt pro Kompositionsmodus.


### 0.8.40 – Zusätzliche Angaben dauerhaft speichern
Editierte Inhalte im Feld „Zusätzliche Angaben an die KI“ werden pro Kompositionsmodus dauerhaft im Browser gespeichert und beim Neustart wiederhergestellt. Das Laden eines alten Verlaufseintrags überschreibt diesen aktuellen gespeicherten Text nicht mehr.


### 0.8.41 – Verlauf zeigt damalige Zusatzangaben
Beim Laden eines Verlaufseintrags zeigt „Zusätzliche Angaben an die KI“ wieder exakt den damals verwendeten Zusatztext. Das bloße Laden überschreibt die dauerhaft gespeicherte aktuelle Vorlage nicht. Erst eine Bearbeitung oder ein neuer Kompositionslauf speichert den Feldinhalt als aktuelle Vorlage.


### 0.8.42 – Klavierdarstellung
Bei in mehrere Notationsstimmen aufgeteilten Klavierspuren wird die höhere Stimme als rechte Hand oben und die tiefere als linke Hand darunter ausgegeben. ABC Tools entfernt bei ComposeMe-Übergaben die wiederholten Kurzbezeichnungen der Instrumente in Folgesystemen.


### 0.8.43 – Titel in der Notendarstellung
Beim MIDI-Handoff an ABC Tools wird der tatsächliche Kompositionstitel mitgegeben. ABC Tools verwendet ihn für die virtuelle MIDI-Datei und damit als ABC-Titel statt des generischen „ComposeMe“. Die Entfernung wiederholter Kurzbezeichnungen bleibt während der MIDI→ABC-Transkription länger aktiv, damit sie auch auf langsameren mobilen Geräten zuverlässig greift.
