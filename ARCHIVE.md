# ComposeMe – abgeschlossene Entwicklung

Entscheidung des Nutzers: 07.10.2026. Letzter funktionaler App-Stand: 0.8.52, main, vor Stilllegung 564ede5300a225f8907b7926ae17db5b53ac8b06.

## Übernahme

[LilyPond Composition Lab v0.1.36](https://lilypond-composition-lab.wibem1.chatgpt.site), Repository [wibem1/LilyPond-Composition-Lab](https://github.com/wibem1/LilyPond-Composition-Lab), main, Commit cfabacf81ad677ae351e45b6253fd650d26e73d3.

- Optionale Klangvorstellung ohne ausnotierte Töne; vor der Komposition bearbeitbar.
- Gespeicherte Zwischenstände öffnen und fortsetzen; die erste KI-Anfrage wird dafür nicht wiederholt.
- Modell und Qualitätsstufe für die konkrete Ausarbeitung neu wählbar; tatsächliche Modelle, Kosten, Dauer und Prompts beider Schritte nachvollziehbar gespeichert.
- Vollständige Verlaufssicherung einschließlich Notenseiten, MIDI und Diagnose; bestehende Einträge werden beim Wiederherstellen nicht überschrieben.

Die Übernahme ist an LilyPonds bestehende direkte Ausgabe angepasst. ComposeMes historische JSON-/MIDI-Engine wurde nicht in LilyPond eingebaut. Der normale direkte Ablauf ist unverändert.

## Erhaltener Referenzbestand

Direkte Mehrformat-Ausgabe, direkte MIDI-/JSON-Komposition, direkte MIDI-Dateierzeugung über OpenAI Code Interpreter, historische Original-Engine und klassischer Ablauf (vollständiger musikalischer Entwurf → technische JSON-Übertragung → Beschreibung) bleiben in ComposeMe erhalten. Diese Spezialfunktionen sind nicht vollständig durch LilyPond Composition Lab ersetzt und sind bewusst nicht Gegenstand der Übernahme.

Keine Quellen oder bestehenden Browser-Verläufe wurden gelöscht; keine automatische Datenmigration. Die bisherigen Sicherungsfunktionen und der vorhandene App-Stand bleiben zugänglich. Neue Entwicklung nur nach einem neuen ausdrücklichen Auftrag; sonst historische Referenz.

## Prüfung und Status

LilyPond v0.1.36 wurde gebaut, anhand aller 16 Testprogramme geprüft und im bestehenden Sites-Projekt veröffentlicht. KI-Tests nutzten simulierte Antworten; es wurde keine kostenpflichtige Testkomposition und kein musikalischer Hörtest durchgeführt. Der praktische Nutzertest entscheidet über SAFE.

Die Entwicklungsstilllegung ist dokumentiert. **GitHub-Schreibschutz `archived=true` ist nicht gesetzt**, da die verfügbare GitHub-Verbindung keine Repository-Administration anbietet. Eine spätere technische Archivierung muss separat bestätigt und geprüft werden.
