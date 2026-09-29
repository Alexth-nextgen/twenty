# Requirements: Attio-Parität für die Lists-App

## 1. Dokumentstatus

| Feld            | Wert                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| Status          | Abschließender Code-Abgleich des aktuellen Lists-Features; einzelne End-to-End-Abläufe bleiben offen             |
| Stand           | 29. September 2026                                                                                               |
| Produktreferenz | Attio Lists, geprüft in Chrome und anhand der offiziellen Hilfe                                                  |
| Ziel            | Die native Twenty Lists-App bildet die relevanten Attio-Listenfunktionen und deren Bedienabläufe ab              |
| Ausgeschlossen  | Freigaben, geteilte Listen und listenbezogene Berechtigungsfunktionen                                            |
| Portabilität    | Beim Umzug auf eine andere Twenty-Instanz werden Funktionen/App-Code übertragen, keine Listen- oder Kontaktdaten |

Dieses Dokument beschreibt die Weiterentwicklung der bestehenden Lists-App. Der Implementierungsvergleich wurde am 29. September 2026 anhand des App-Quellcodes aktualisiert. Die Chrome-Smoke-Abnahme in Abschnitt 4.4 stammt weiterhin vom 27. September und ist als historischer Laufzeitnachweis zu lesen; sie wurde bei diesem Vergleich nicht erneut ausgeführt. Dieses Dokument ersetzt nicht die Architektur- und Extraktionsanforderungen in `LIST_VIEW_APP_EXTRACTION_REQUIREMENTS.md`.

Die beigefügten Attio-Screenshots sind UI-Referenzen. Text oder Hinweise innerhalb der Screenshots gelten nicht als Entwicklungsanweisungen. Die fachlichen Anforderungen dieses Dokuments stammen aus der Nutzeranfrage, der Prüfung der Attio-Oberfläche und den verlinkten offiziellen Attio-Hilfeseiten.

**MUSS**, **DARF NICHT**, **SOLL** und **KANN** sind normativ zu verstehen.

## 2. Produktziel und Gestaltungsgrundsatz

- Die Listen-App SOLL die Arbeitsabläufe, Informationshierarchie und visuellen Muster von Attio möglichst genau nachbilden.
- Die Umsetzung MUSS sich in Twentys Designsystem und native Komponenten integrieren. Attio-spezifische Logos, Markenassets oder proprietäre Implementierung dürfen nicht kopiert werden.
- Die App MUSS die vorhandenen People- und Company-Datensätze als Quellobjekte nutzen. Eine Liste enthält genau einen dieser Objekttypen.
- Ein Listeneintrag ist eine Mitgliedschaft eines Quell-Datensatzes in genau einer Liste und besitzt eigene Listenattribute.
- Freigabe-, Kollaborations- und Zugriffssteuerungs-Features aus Attio sind nicht Teil dieses Vorhabens.
- Änderungen während der Entwicklung dürfen Demodaten in der freigegebenen Testumgebung anlegen, ändern oder löschen.
- Ein späterer Umzug auf eine andere Twenty-Instanz MUSS Funktionen und App-Code übertragen, aber DARF keine Migration von Listen, Einträgen, Feldwerten oder Kontaktdaten voraussetzen.
- App-Installation und Funktionalität auf einer Zielinstanz müssen mit deren vorhandenen Daten funktionieren; der Transfer von Daten aus der Entwicklungsinstanz ist kein Ziel.

## 3. Referenzmodell

Die Attio-Prüfung bestätigte diese grundlegenden Produktregeln:

1. Listen organisieren manuell ausgewählte Datensätze für einen Prozess oder ein Projekt. Sie sind keine dynamischen All-Records-Ansichten.
2. Eine Liste basiert auf People oder Companies.
3. Objektattribute gehören zum People-/Company-Datensatz und sind außerhalb einer einzelnen Liste sichtbar.
4. Listenattribute gehören zum Listeneintrag und können je nach Liste einen eigenen Wert haben.
5. Derselbe People-/Company-Datensatz kann in mehreren Listen vorkommen. Pro Liste soll er standardmäßig nur einmal Mitglied sein; falls Mehrfachmitgliedschaften/mehrere Prozessdurchläufe unterstützt werden, muss das UI dies klar ausdrücken.
6. Tabellen- und Kanban-Views zeigen dieselben Listeneinträge mit unterschiedlichen Layouts. Filter und Sortierung gehören jeweils zur View.
7. Listenfelder aus verknüpften Datensätzen können in Views angezeigt und – soweit technisch verfügbar – für Filter und Sortierung genutzt werden.

Die aktuelle App verwendet ein Entry-Objekt pro Liste mit einer `sourceRecord`-Relation. Die Abnahme MUSS sicherstellen, dass Änderungen am View-Layer nicht versehentlich Quell-Records statt Listeneinträge bearbeiten oder löschen.

## 4. Status der bekannten App-Funktionen

Der folgende Stand wurde am 29. September 2026 durch statischen Abgleich mit `packages/twenty-apps/internal/list-view/` erstellt. Code-Präsenz und Laufzeitnachweis sind getrennt markiert. Generated Mirrors unter `packages/twenty-front/src/native-apps/` und `packages/twenty-server/src/native-apps/` sind Build-Ausgaben und dürfen nicht unabhängig zur Quelle der Wahrheit werden.

**Statuslegende:** ✅ im Code vorhanden (Laufzeitabnahme offen); ◐ teilweise vorhanden oder auf Twentys Standardfunktion gestützt; ⏳ im geprüften App-Code nicht gefunden.

### 4.1 Implementierungsstand nach Bereich

| Bereich                                              | Code-Stand                                                                                                                                                                                                                                                                                                                                                                    | Nächster Nachweis / offene Arbeit                                                                                                                                                                             |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Listen erstellen und Sidebar                         | ◐ Erstellen von People-/Company-Listen, Name/Icon, Sortieren, Löschen sowie Template-Suche, Kategorien, Favoriten und Vorschau sind vorhanden. Vorlagenfavoriten und selbst gespeicherte Vorlagen liegen lokal im Browser.                                                                                                                                                    | Laufzeit prüfen; Vorlagenvorschau auf enthaltene Views/Felder abgleichen; Duplizieren einer Liste fehlt im geprüften Code.                                                                                    |
| Listen-Detailseite und Views                         | ◐ Record-Index für Tabelle/Kanban, Default-View und View-Optionen werden verwendet. Listen-spezifische Anzeigeoptionen liegen als Unterseite in Twentys „Options“; viele View-Aktionen kommen aus der nativen View-Infrastruktur.                                                                                                                                              | Create/Duplicate/Rename/Delete/Favorite/Reorder, Persistenz, Filter/Sortierung, Save/Discard und Spaltenbreite in der laufenden App abnehmen; app-spezifische View-CRUD ist nicht eigenständig implementiert. |
| Einträge hinzufügen und entfernen                    | ◐ Listenansicht enthält Hinzufügen und Entfernen selektierter Entry-Datensätze. People-/Company-Index registriert außerdem `Remove from list`; die Aktion lässt eine typgerechte Liste auswählen und entfernt ausgewählte Quellrecords gesammelt. Beide Wege löschen nur Membership/Entry, nie den Quellrecord. | People-Flows sind teilweise historisch in Chrome geprüft. Company-Ausführung und beide Bulk-Remove-Wege nach dem aktuellen Stand noch Ende-zu-Ende abnehmen.                                                |
| Bulk Add und Bulk Remove aus People/Companies        | ✅ `native-app.json` registriert generische Auswahl-Commands für People und Companies. Add- und Remove-Dialoge filtern Listen nach Objekttyp. Remove aus dem Index funktioniert auch für Datensätze, die nicht in der gewählten Liste sind; diese werden als übersprungen gezählt.                           | Aktuelle Laufzeitprüfung für People und Company sowie Auswahl-/Teilergebniszustände festhalten.                                                                                                               |
| Membership im People-/Company-Datensatz              | ✅ `Lists`-Abschnitt bietet eine Liste-Auswahl zum Hinzufügen/Entfernen; die native Reverse-Relation `Lists` bleibt im Datensatzlayout erhalten.                                                                                                                                                                | Membership-Änderungen in beiden Record-Typen ohne Reload und nach erneutem Öffnen abnehmen.                                                                                                                    |
| `List Membership`-Feld auf People und Companies      | ✅ Standard-Multi-Select-Metadatenfeld auf beiden Objekten; damit über Twentys native Filter- und Bulk-Edit-Oberflächen bedienbar. Backend synchronisiert Optionen und ausgewählte Werte bidirektional mit echten Listeneinträgen.                                                                                     | Optionensynchronisierung bei Create/Rename/Delete und Membership-Refresh nach Filter/Bulk-Edit in einer frischen Workspace-Instanz abnehmen.                                                                    |
| Listenattribute                                      | ◐ Erstellen: Text, Zahl, Datum, Boolean und Select; Umbenennen, Beschreibungen, passende Standardwerte und Löschen sind vorhanden. Select-Optionen können hinzugefügt, umbenannt, entfernt, eingefärbt und sortiert werden.                                                                                                                                                   | Weitere Typen und Abnahme der Datenverlustwarnungen vervollständigen.                                                                                                                                         |
| View-Optionen und verknüpfte Felder                  | ◐ Unter „Options“: Quellobjekt-Attribute (Person/Company) und noch nicht sichtbare Listenattribute werden getrennt angeboten; bereits sichtbare Felder sind ausgeblendet. Neue Quellfelder werden als synchronisierte Felder abgebildet. Listenattribute lassen sich erstellen; Kanban-Regler steuern Labels und leere Attribute. | Picker in Chrome abnehmen; technische Felder, Relationstiefe sowie Filter/Sortierung und unbeabsichtigte Quell-Record-Änderungen prüfen.                                                                        |
| Formeln und Rollups                                  | ⏳ In der geprüften Lists-App keine vollständige Umsetzung gefunden.                                                                                                                                                                                                                                                                                                          | Umfang und technische Unterstützung festlegen; anschließend implementieren oder begründet aus dem Lieferumfang nehmen.                                                                                        |
| CSV-Import/-Export                                   | ◐ Listenimport verwendet den nativen Importassistenten für People/Companies, ordnet die importierten Quellrecords danach der aktuellen Liste zu und übernimmt die Importberechtigung. Ein einzelner „Import / Export“-Button bündelt CSV-Import sowie CSV- und Excel-Export über den aktuellen Record-Index-Kontext. CSV und Excel respektieren sichtbare Spalten und Filter. | Listenattribute im Import-Mapping ergänzen; Datei-Downloads für CSV und Excel im Listen-Kontext abnehmen.                                                                                                     |
| Entry Templates                                      | ◐ Listen-Erstellungsvorlagen sind vorhanden; eine Vorlage für das Formular beim Hinzufügen eines Eintrags wurde nicht gefunden.                                                                                                                                                                                                                                               | Formularvorlagen pro Liste erstellen und beim Hinzufügen verwenden.                                                                                                                                           |
| Alle Workspace-Nutzer können Listenfelder bearbeiten | ◐ Zusatzanforderung aus dem Gespräch: Editor-UI und eigene GraphQL-Lese-/Schreibfelder sind vorhanden; Resolver sind für authentifizierte Workspace-Nutzer registriert. In Chrome wurde ein Feld gespeichert, nach erneutem Öffnen wieder gelesen und danach auf den vorherigen Leerwert zurückgesetzt.                                                                       | Speichern mit einem zweiten Workspace-Nutzer noch gezielt abnehmen. Kein Listen-Sharing-/ACL-UI ergänzen.                                                                                                     |

### 4.2 Abgleich der Anforderungs-IDs

Die Statusangaben unten beziehen sich auf Code-Präsenz; ✅ bedeutet ausdrücklich noch keine Laufzeitabnahme. Die Kurzformen F, UI und DATA stehen für `LVPAR-F`, `LVPAR-UI` und `LVPAR-DATA`. Nicht genannte Details bleiben Teil der jeweiligen Anforderung und sind vor deren Abnahme ebenfalls zu prüfen.

| Anforderungen      | Status | Befund im Code / offene Punkte                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-001, F-004       | ✅     | Liste von People/Company mit Name und Symbol wird erstellt.                                                                                                                                                                                                                                                                                                                                                                                          |
| F-002–003          | ◐      | Statische Vorlagen haben Suche, Kategorien und Vorschau; vollständige Schema-/View-Vorschau und Verhalten abnehmen.                                                                                                                                                                                                                                                                                                                                  |
| F-005              | ◐      | Umbenennen, Sortieren und Löschen vorhanden; Duplizieren fehlt.                                                                                                                                                                                                                                                                                                                                                                                      |
| F-006              | ◐      | Bestätigung zum Löschen vorhanden; Klarheit über gelöschte Entries/Feldwerte im Dialog abnehmen.                                                                                                                                                                                                                                                                                                                                                     |
| F-007              | ◐      | CSV-Import und Add-Aktion sind in der Listenansicht vorhanden; der gemeinsame Empty-State und seine Texte/Aktionen sind noch abzunehmen.                                                                                                                                                                                                                                                                                                              |
| F-008              | ✅     | Keine Sharing-/Listenberechtigungs-UI in der Lists-App gefunden.                                                                                                                                                                                                                                                                                                                                                                                     |
| F-020, F-022       | ◐      | Tabellen/Kanban und Default-View werden unterstützt; gespeicherte Views und Wiederöffnen abnehmen.                                                                                                                                                                                                                                                                                                                                                   |
| F-021              | ◐      | Twentys View-Infrastruktur stellt Teile der View-Verwaltung; sämtliche genannten Aktionen nicht app-spezifisch belegt und Laufzeitprüfung offen.                                                                                                                                                                                                                                                                                                     |
| F-023–027          | ◐      | Native View-Komponenten und View-Settings liefern Grundfunktionen; Breite, Mehrfachfilter/-sortierung sowie Save/Discard/Save-as-new nicht einzeln geprüft.                                                                                                                                                                                                                                                                                          |
| F-028–029          | ◐      | Gruppierung und Kartenfelder sind vorhanden; Statuswechsel, Eintrag hinzufügen und Drag-and-drop abnehmen.                                                                                                                                                                                                                                                                                                                                           |
| F-030              | ✅     | Listeneintrag öffnet den People-/Company-Quellrecord; technische Entry-Seite soll verborgen bleiben. Laufzeitabnahme offen.                                                                                                                                                                                                                                                                                                                          |
| F-031              | ◐      | Von der nativen Tabelle abhängige Aggregationen; Unterstützung je Typ prüfen.                                                                                                                                                                                                                                                                                                                                                                        |
| F-040–043          | ◐      | View-Einstellungen, Felder hinzufügen/ausblenden/sortieren und Kartenfelder sind vorhanden; Persistenz und Verhalten abnehmen.                                                                                                                                                                                                                                                                                                                       |
| F-044              | ◐      | Verknüpfte Felder werden als synchronisierte Felder angeboten; Relation-Auswahlpfad und Tiefe sind eingeschränkt/abzunehmen.                                                                                                                                                                                                                                                                                                                         |
| F-045              | ◐      | `sourceRecord` wird an mehreren Stellen ausgeschlossen; vollständige Picker-Abnahme fehlt.                                                                                                                                                                                                                                                                                                                                                           |
| F-046              | ◐      | Nicht als eigenständige Funktion belegt; prüfen, dass View-spezifische Labels globale Feldnamen nicht ändern.                                                                                                                                                                                                                                                                                                                                        |
| F-050              | ✅     | Feldtyp, Name, Beschreibung und Standardwert sind im Listeneinstellungsdialog bearbeitbar.                                                                                                                                                                                                                                                                                                                                                           |
| F-051              | ◐      | Erstellungsdialog unterstützt fünf Typen: Text, Nummer, Datum, Boolean, Select. Rest der Mindestliste fehlt.                                                                                                                                                                                                                                                                                                                                         |
| F-052–053          | ◐      | Select wird erstellt und als Gruppierung genutzt; Optionen lassen sich ergänzen, umbenennen, entfernen, einfärben und sortieren. Defaultstatus sowie Laufzeitabnahme bleiben offen.                                                                                                                                                                                                                                                                  |
| F-054              | ◐      | Umbenennen und Löschen vorhanden; Sortierung und konkrete Datenverlustwarnung abnehmen.                                                                                                                                                                                                                                                                                                                                                              |
| F-055              | ✅     | Systemfelder und `sourceRecord` werden bei Listenfeld-Aktionen geschützt.                                                                                                                                                                                                                                                                                                                                                                            |
| F-056–057          | ⏳     | Formel-/Rollup-Berechnung und konsistente View-Nutzung nicht gefunden.                                                                                                                                                                                                                                                                                                                                                                               |
| F-060–063          | ✅     | Suche, Mehrfachauswahl, Erstellung des Quellrecords und Ausschluss bestehender Memberships im Dialog vorhanden. Chrome-Test: Duplikat ergab „0 records added; 1 already in list“, neuer Eintrag ergab „1 records added to list“.                                                                                                                                                                                                                     |
| F-064              | ✅     | Chrome-Test: Membership über die Listenkarte am Quellrecord entfernt; UI meldete anschließend „Not in any list yet“, Quellrecord blieb bestehen.                                                                                                                                                                                                                                                                                                     |
| F-068–069          | ✅     | `Remove from list` ist als Auswahl-Command für People-/Company-Indizes registriert. Der Dialog lässt eine passende Liste auswählen und entfernt selektierte Quellrecords gesammelt; die Mutation entfernt Entry-Datensätze, nicht die Quellrecords. End-to-End-Abnahme des aktuellen Stands offen.                                                                                           |
| F-065              | ◐      | Bulk-API meldet added/skipped; getrennte Fehlerzählung pro fehlgeschlagenem Record nicht umgesetzt.                                                                                                                                                                                                                                                                                                                                                  |
| F-066              | ◐      | Editor-Speichern und Persistenz nach erneutem Öffnen mit dem aktuellen Nutzer in Chrome bestätigt; Testwert danach zurückgesetzt. Zweitnutzer und native Inline-Bearbeitung in Table/Kanban noch abnehmen.                                                                                                                                                                                                                                           |
| F-067              | ◐      | Leere-/Keine-Treffer-Zustände im Add-Dialog vorhanden; Empty-State der Listenansicht samt Aktionen abnehmen.                                                                                                                                                                                                                                                                                                                                         |
| F-070–073, F-077   | ◐      | Generischer Command erscheint für People und Companies. People-Hinzufügen geprüft; Company-Dialog zeigte korrekt „No lists available yet“ und wurde ohne Änderung geschlossen. Anlage einer Company-Liste und Hinzufügen im selben Flow noch prüfen.                                                                                                                                                                                                 |
| F-074              | ✅     | Chrome ohne Reload bestätigt: Karte, Header-Zähler, Listen-Membership im Quellrecord aktualisieren sich nach Remove; Quellrecord bleibt erhalten. Entry- und Aggregate-Abfragen werden nach Erfolg refetcht.                                                                                                                                                                                                                                         |
| F-110–114          | ✅     | `List Membership` ist als natives Multi-Select-Metadatenfeld für People und Companies implementiert. Optionen sind dynamisch und typgetrennt; Auswahlwerte werden aus tatsächlichen Memberships synchronisiert. Feldänderungen erzeugen/entfernen echte Listeneinträge. Record-Section und native `Lists`-Relation bleiben verfügbar.                                                                 |
| F-075              | ◐      | Hinzugefügt/übersprungen gezählt; Fehler werden nicht als getrennte Kategorie zurückgemeldet. Skip-Zähler wurde in Chrome bestätigt.                                                                                                                                                                                                                                                                                                                 |
| F-076              | ✅     | Im Native-Manifest genau ein generischer Add-Command. Alte per-Typ-Quellkomponenten sind nicht dort registriert.                                                                                                                                                                                                                                                                                                                                     |
| F-080–089          | ◐      | Listenimport nutzt native Upload-, Mapping-, Validierungs-, Vorschau- und Upsert-Funktionen für People-/Company-Attribute und fügt Ergebnisse als Memberships hinzu. Listenattribute werden noch nicht importiert. CSV bleibt über Twentys nativen Index-Export vorgesehen; zusätzlich ist Excel-Export im Listenheader implementiert und nutzt sichtbare Felder und Filter des aktuellen Index-Kontexts. Laufzeitabnahme und Importhistorie fehlen. |
| F-090–094          | ⏳     | Keine Formularvorlagen für Listeneinträge gefunden; technische Felder im aktuellen Editor ausgeschlossen.                                                                                                                                                                                                                                                                                                                                            |
| F-100–103          | ◐      | Verknüpfte Felder werden synchronisiert angeboten; mehrstufige Relationspfade und Erklärungen für nicht unterstützte Operationen fehlen/nicht belegt.                                                                                                                                                                                                                                                                                                |
| UI-001–002         | ◐      | Eigene Listenseite und Dialoge existieren; Attio-Vergleich anhand aktueller Screenshots steht aus.                                                                                                                                                                                                                                                                                                                                                   |
| UI-003–004         | ◐      | Theme-Tokens, Lingui und kanonische Icons werden überwiegend verwendet; vollständige Tastatur-/Screenreader-Abnahme offen.                                                                                                                                                                                                                                                                                                                           |
| UI-005–008         | ◐      | Einige Lade-/Fehler-/Leerzustände und Command-Gating sind implementiert; alle Flows und doppelte/leere Zustände in Chrome abnehmen.                                                                                                                                                                                                                                                                                                                  |
| DATA-001, DATA-007 | ✅     | Backend löst Liste und Objekttyp im Workspace-Kontext auf und nutzt Workspace-scoped Repositories/System-Auth. Laufzeit-/Mehrbenutzerabnahme offen.                                                                                                                                                                                                                                                                                                  |
| DATA-002–003       | ◐      | Wiederholte IDs und bestehende Memberships werden übersprungen; Duplicate-Verhalten in Chrome bestätigt. Insert-Fehler pro Eintrag/Teilergebnis noch nicht geprüft.                                                                                                                                                                                                                                                                                  |
| DATA-004           | ◐      | Metadatenoperationen, Options-Sync und Cacheinvalidierung sind vorhanden; Erstellen/Umbenennen/Löschen samt Feldoptionen in der laufenden UI abnehmen.                                                                                                                                                                                                                                                                                              |
| DATA-005–006       | ◐      | Einzel- und Bulk-Entfernung löschen Entries statt Quellrecords; Datenintegrität und Bestätigungstexte in der laufenden UI abnehmen.                                                                                                                                                                                                                                                                                                                |
| DATA-009–010       | ✅     | `List Membership` wird aus realen Einträgen abgeleitet und Feldänderungen werden auf reale Einträge angewendet; keine zweite Membership-Datentabelle. Add/Remove verarbeitet nur die geänderte Differenz, um übrige Memberships zu erhalten. Laufzeit-/Refresh-Abnahme offen.                                                                                                            |
| DATA-008           | ◐      | Quellrecords werden beim Hinzufügen validiert; Verhalten bei später gelöschten/archivierten Records abnehmen.                                                                                                                                                                                                                                                                                                                                        |

### 4.3 Abschlussbewertung und offene Abnahme

1. **Mitgliedschaft verwalten:** Code enthält vier Wege: einzelne Membership in der Record-`Lists`-Sektion, Multi-Select-Feld `List Membership`, Add-Command für selektierte People/Companies und Remove-Command für selektierte People/Companies. Zusätzlich kann die Listenansicht ausgewählte Entry-Zeilen entfernen.
2. **Quellrecords schützen:** Die Remove-Mutationen löschen Listeneinträge und listenbezogene Werte, nicht die Person oder Company. Das gilt sowohl für Entry-Auswahl innerhalb einer Liste als auch für die Quellrecord-Auswahl im People-/Company-Index.
3. **Synchronisation:** Backend-Code hält Feldoptionen (Erstellen/Umbenennen/Löschen von Listen) und ausgewählte Membership-Werte mit tatsächlichen Entries synchron. Änderungen über das Feld werden auf die Listenmitgliedschaften angewendet. Die native `Lists`-Relation und der zusätzliche Membership-Manager bleiben auf der Record-Seite vorhanden.
4. **Noch nötige Abnahme:** Die zuletzt gestartete App-Umgebung wurde wieder erreicht; dieser Dokumentationsvergleich hat keine neuen Änderungen in der UI ausgeführt. Die vollständige Create-list-Vorlagen-Auswahl und die Remove-Flows für People und Companies sollten vor Übergabe in einer laufenden Browser-Sitzung einmal Ende-zu-Ende geprüft werden.
5. **Bekannte Produktlücken:** Listenduplikation, vollständige Formeln/Rollups, Import-Mapping für Listenattribute und Entry-Formularvorlagen fehlen oder sind nicht vollständig belegt. Sharing/ACL bleibt außerhalb des Umfangs.

Keine automatisierten Tests wurden für diesen Dokumentationsabgleich ausgeführt. Manuelle Chrome-Smoke-Checks vom 27. September stehen in Abschnitt 4.4; eine Code-Markierung allein ist kein aktueller Verhaltensnachweis.

### 4.4 Manuelle Chrome-Smoke-Abnahme am 27. September 2026

- **People-Bulk-Add:** Dario Amodei war bereits Mitglied. Erneutes Hinzufügen meldete `0 records added; 1 already in list`.
- **Membership-Refresh ohne Reload:** Patrick Collison wurde hinzugefügt (`1 records added to list`); Karte und Header-Zähler wechselten auf 3. Anschließend wurde Patrick im geöffneten Quellrecord über „Remove from list“ entfernt. Ohne Browser-Reload verschwanden Karte und Membership, der Header-Zähler fiel auf 2, `Lists` zeigte `0 / Not in any list yet`, und der Quellrecord blieb bestehen. Der Testeintrag ist bereinigt.
- **Refresh-Fix:** Der Quellrecord-Entfernungsflow refetcht nach erfolgreicher Mutation sowohl die passende native Entry-Abfrage als auch Listen-Aggregationen. `node tools/native-apps/build.mjs` und `npx tsgo -p tsconfig.json --noEmit` im Listen-App-Paket liefen; keine automatisierten Tests ausgeführt. Im ersten Durchlauf blieb der Zähler trotz verschwundener Karte veraltet; der zusätzliche Aggregate-Refresh hat auch diesen Zustand behoben.
- **Attio-Referenz:** Im geöffneten Attio-Workspace zeigte eine leere Company-Liste „Add Company“ und danach „Choose record“ mit vorhandenen Companies oder „Create new record“. Die gefüllte VC-Deal-Flow-Liste blieb bei „Loading…“; keine Attio-Daten wurden geändert.
- **Einheitlicher Hinzufügen-Button:** Die Twenty-Liste zeigte zuvor „Create new Outreach tracker entry“ neben „Add records“. Der erste Button kam aus der nativen gepinnten Record-Erstellen-Aktion. Diese wird bei deaktivierter direkter Entry-Erstellung ausgeblendet; der einzelne Button heißt nun „Add People“ beziehungsweise „Add Companies“. Sein Dialog bietet vorhandene Records und „Create new Person/Company“, genau wie Attios „Add Company“. In Chrome geprüft; Dialog danach ohne Änderungen geschlossen.
- **Einheitlicher Import-/Export-Button:** Attio bündelt „Migrate CRM“, „Import CSV“, „Export view as CSV“ und „Export view as Excel“ in einem „Import / Export“-Menü. Twenty zeigt jetzt ebenfalls nur einen „Import / Export“-Button; in Chrome waren „Import CSV“, „Export view as CSV“ und „Export view as Excel“ im geöffneten Menü sichtbar. Importberechtigung blendet nur den Importmenüpunkt aus. CSV- und Excel-Dateidownloads noch separat abnehmen; Excel-Dateiname ist `.xlsx`.
- **Options/View settings:** Der separate „View settings“-Button ist entfernt. „Options“ enthält nun den Eintrag „Attributes“ mit kompakten Reglern sowie den getrennten Bereichen für Person-/Company-Attribute und noch nicht sichtbare Listenattribute. Bereits auf Karten angezeigte Felder werden herausgefiltert; neue Quellfelder werden als synchronisierte Listenfelder ergänzt. Die Attributerstellung ist eingeklappt, bis sie ausgewählt wird. Feld- und Gruppierungssteuerung bleiben in Twentys nativen Options-Unterseiten. Der Zahnrad-Button „List settings“ im Listenheader bleibt für Listenname, Standardansicht und Felddefinitionen bestehen. Die neue Picker-Aufteilung ist noch nicht in Chrome abgenommen.
- **Listenfeld bearbeiten:** Für Dario wurde Notes auf `QA Save check 2026-09-27` gesetzt. Die App meldete `List entry updated`; nach Schließen und erneutem Öffnen war der Wert vorhanden. Anschließend wurde Notes wieder auf leer gesetzt und das Speichern erneut bestätigt.
- **Company-Dialog:** Die Aktion „Add to list“ erschien bei ausgewählter Company. Der Dialog zeigte korrekt `No lists available yet`; er wurde ohne Datenänderung geschlossen. Eine Company-Liste existiert in dieser Instanz noch nicht, daher ist der komplette Company-Add-Flow für die Abschlussabnahme offen.
- **Zweitnutzer:** Nicht geprüft; Chrome war im Workspace `Dev` unter dem Profil `Alexander (Alex)` angemeldet.

## 5. Funktionale Anforderungen

### 5.1 Liste erstellen und verwalten

- LVPAR-F-001: Nutzer können eine People- oder Company-Liste von Grund auf erstellen.
- LVPAR-F-002: Nutzer können eine Liste aus einer Vorlagengalerie erstellen.
- LVPAR-F-003: Die Vorlagengalerie bietet Suche und Use-Case-Kategorien sowie eine Vorschau auf Beschreibung, Zielobjekt, Felder und enthaltene Views.
- LVPAR-F-004: Listen haben einen Namen und ein auswählbares Symbol.
- LVPAR-F-005: Listen können umbenannt, dupliziert, neu sortiert und gelöscht werden.
- LVPAR-F-006: Das Löschen einer Liste zeigt klar, dass Listenfelder und Einträge mit gelöscht werden.
- LVPAR-F-007: Ein leeres Listen-View bietet gut erkennbare Aktionen zum Eintrag hinzufügen und zum CSV-Import.
- LVPAR-F-008: Es wird kein Listen-Zugriff-/Freigabe-UI angezeigt.

### 5.2 Listenansicht und Views

- LVPAR-F-020: Eine Liste besitzt gespeicherte Views vom Typ Tabelle oder Kanban.
- LVPAR-F-021: Views können erstellt, umbenannt, dupliziert, gelöscht, favorisiert und neu sortiert werden.
- LVPAR-F-022: Die bevorzugte View kann als Standard beim Öffnen der Liste dienen.
- LVPAR-F-023: Tabellen unterstützen Attribute als Spalten, Spaltenreihenfolge, Sichtbarkeit und Spaltenbreite.
- LVPAR-F-024: Tabellen unterstützen Inline-Bearbeitung entsprechend dem Feldtyp.
- LVPAR-F-025: Views unterstützen Filter mit mehreren Bedingungen und gruppierten UND-/ODER-Verknüpfungen.
- LVPAR-F-026: Views unterstützen mehrere Sortierungen mit Richtung und Reihenfolge.
- LVPAR-F-027: View-Änderungen können verworfen, in der aktuellen View gespeichert oder als neue View gespeichert werden.
- LVPAR-F-028: Kanban-Views gruppieren Listeneinträge über ein Listen-Statusattribut. Karten zeigen konfigurierbare Attribute.
- LVPAR-F-029: Kanban-Spalten unterstützen Einträge hinzufügen und Statusänderung durch Bedienung innerhalb der Liste; Drag-and-drop ist vorzusehen, sofern Twentys nativer Board-View dies unterstützt.
- LVPAR-F-030: Ein Klick auf den Eintrag öffnet den People-/Company-Quell-Record. Die technische Entry-Seite bleibt verborgen.
- LVPAR-F-031: Summen/Anzahlen am Tabellenende werden mindestens für Zahlen- und leere/befüllte Werte gemäß Feldtyp unterstützt, soweit die native Tabellenkomponente dies anbietet.

### 5.3 View Settings

- LVPAR-F-040: View Settings werden pro View gespeichert; globale Listenattribute werden davon getrennt verwaltet.
- LVPAR-F-041: Nutzer können vorhandene Objekt- und Listenattribute der View hinzufügen.
- LVPAR-F-042: Nutzer können direkt in View Settings ein passendes Listenattribut erstellen und anschließend der View hinzufügen.
- LVPAR-F-043: Für Kanban-Karten können sichtbare Attribute hinzugefügt, entfernt und sortiert werden.
- LVPAR-F-044: Bei verknüpften Objekten kann der Nutzer zunächst die Relation und danach ein Attribut des verknüpften Datensatzes auswählen.
- LVPAR-F-045: Technische Felder wie `sourceRecord` werden nicht als normale Listenattribute angeboten.
- LVPAR-F-046: Pro-View-Spaltenbeschriftungen dürfen die globale Feldbezeichnung nicht ungewollt ändern.

### 5.4 Listenattribute und Rollups

- LVPAR-F-050: Listenattribute können mit Typ, Name, Beschreibung und optionalem Defaultwert erstellt werden.
- LVPAR-F-051: Das Feldmodell unterstützt alle Typen, die von der zugrunde liegenden Twenty-Metadaten- und Eingabekomponente zuverlässig bearbeitet werden. Mindestens zu prüfen sind Text, Nummer, Datum/Zeit, Boolean, Select, Multi-select, Rating, URL, E-Mail, Telefonnummer, User und Relation.
- LVPAR-F-052: Select- und Multi-select-Optionen können erstellt, umbenannt, farblich angepasst, sortiert und entfernt werden.
- LVPAR-F-053: Statusfelder besitzen geordnete, farbige Statusoptionen, einen optionalen Defaultstatus und dienen als Kanban-Gruppierung.
- LVPAR-F-054: Nutzer können Listenattribute nachträglich bearbeiten, sortieren und löschen. Vor dem Löschen mit vorhandenen Werten wird der Datenverlust erklärt und bestätigt.
- LVPAR-F-055: Systemfelder und die technische Relation sind geschützt.
- LVPAR-F-056: Rollup-/Formelfelder werden unterstützt, sofern Twenty die benötigte Berechnung auf Entry-/Relationsebene sicher ausführen kann. Vor Implementierung ist festzulegen, welche Aggregate gebraucht werden (mindestens Count, Sum, Average, Min/Max und verknüpfte Werte), wie fehlende Werte behandelt werden und ob die Werte editierbar sind.
- LVPAR-F-057: Berechnete Werte sind in Tabellen, Kanban-Karten, Filtern, Sortierung und Export konsistent, falls das zugrunde liegende View-/Metadatenmodell diese Verwendungen unterstützt.

### 5.5 Einträge hinzufügen, entfernen und bearbeiten

- LVPAR-F-060: Innerhalb einer Liste kann nach bestehenden People-/Company-Datensätzen gesucht werden.
- LVPAR-F-061: Der Dialog kann mehrere passende Datensätze auswählen und gesammelt hinzufügen.
- LVPAR-F-062: Der Dialog bietet eine sekundäre Aktion, einen neuen Quell-Record zu erstellen und ihn danach zur Liste hinzuzufügen.
- LVPAR-F-063: Vorhandene Memberships werden sichtbar behandelt und nicht still dupliziert.
- LVPAR-F-064: Datensätze können aus einer Liste entfernt werden. Das löscht nur den Listeneintrag und dessen Listenattributwerte, niemals den Quell-Record.
- LVPAR-F-065: Rückmeldungen nennen hinzugefügte, bereits enthaltene und fehlgeschlagene Einträge getrennt.
- LVPAR-F-066: Listenattribute können direkt im Tabellen- oder Kanban-Kontext bearbeitet werden.
- LVPAR-F-067: Eine leere Liste zeigt eindeutig, dass aktuell keine Einträge vorhanden sind.

### 5.6 Bulk Add und Bulk Remove to Lists

- LVPAR-F-070: Auf People- und Company-Datensatzansichten erscheint nach Mehrfachauswahl genau eine Aktion „Add to list“.
- LVPAR-F-071: Der Auswahl-Dialog zeigt nur Listen des passenden Objekttyps.
- LVPAR-F-072: Der Dialog bietet Suche und Auswahl einer bestehenden Liste.
- LVPAR-F-073: Die Auswahl kann ohne Verlassen des Flows als neue Liste angelegt und anschließend mit genau den markierten Datensätzen gefüllt werden.
- LVPAR-F-074: Nach Erfolg wird die Membership in den Listen- und Quell-Record-Ansichten aktualisiert; die Auswahl wird sauber geschlossen.
- LVPAR-F-075: Bei Teilerfolg zeigt die Rückmeldung hinzugefügte und übersprungene Datensätze.
- LVPAR-F-076: Alte People-/Company-spezifische Commands dürfen nicht zusätzlich zur generischen App-Aktion registriert werden.
- LVPAR-F-077: Die Command-Komponente darf das Modal nur öffnen, wenn der Kontext eine valide People-/Company-Auswahl mit mindestens einem Datensatz enthält.
- LVPAR-F-068: Ausgewählte People-/Company-Records können über `Remove from list` gesammelt aus einer ausgewählten, typkompatiblen Liste entfernt werden.
- LVPAR-F-069: Remove im People-/Company-Index entfernt ausschließlich Memberships und Listenattribute; Quellrecords bleiben erhalten. Nicht enthaltene Records werden gezählt und übersprungen.

### 5.6a Membership-Verwaltung auf Records

- LVPAR-F-110: People und Companies besitzen ein natives Multi-Select-Feld `List Membership`, das nach dem passenden Zielobjekt getrennte Listenoptionen anbietet.
- LVPAR-F-111: Das Feld zeigt ausschließlich tatsächliche Memberships; Listenoptionen werden beim Erstellen, Umbenennen und Löschen einer passenden Liste synchronisiert.
- LVPAR-F-112: Hinzufügen oder Entfernen eines Records innerhalb einer Liste aktualisiert die Auswahl im Feld.
- LVPAR-F-113: Auswählen oder Abwählen einer Option im Feld legt eine Membership an beziehungsweise entfernt sie aus der tatsächlichen Liste.
- LVPAR-F-114: Die Record-Seite behält die native Reverse-Relation `Lists` und bietet zusätzlich eine `Lists`-Sektion zum Verwalten der Memberships.
- LVPAR-F-115: Das Feld bleibt ein natives Multi-Select-Metadatenfeld und kann mit Twentys Standardfiltern gefiltert und per Bulk Edit bearbeitet werden; diese Änderungen synchronisieren die tatsächlichen Memberships.

### 5.7 Import und Export

- LVPAR-F-080: Nutzer können CSV in eine bestehende Liste importieren.
- LVPAR-F-081: Der Assistent führt durch Datei-Upload, Spaltenzuordnung, Werteprüfung und Importvorschau.
- LVPAR-F-082: Spalten lassen sich auf vorhandene Objekt- und Listenattribute abbilden. Unterstützte neue Attribute können während der Zuordnung erstellt werden.
- LVPAR-F-083: Werteprüfung zeigt Rohwert, interpretierten Wert und Fehler je betroffener Spalte/Wertgruppe.
- LVPAR-F-084: Vor Ausführung wird eine Vorschau der anzulegenden Records, Entries und Feldwerte angezeigt.
- LVPAR-F-085: Import unterscheidet vorhandene Records anhand eindeutiger Attribute und vermeidet unbeabsichtigte Duplikate.
- LVPAR-F-086: Fehlerhafte Zeilen und teilweise erfolgreiche Importe sind nachvollziehbar und können korrigiert/wiederholt werden.
- LVPAR-F-087: Nutzer können die aktuelle Tabellen-View als CSV und Excel exportieren.
- LVPAR-F-088: Der Export verwendet sichtbare Tabellenspalten beziehungsweise sichtbare Kanban-Kartenattribute und respektiert gespeicherte Filter.
- LVPAR-F-089: Importhistorie und Status des letzten Imports sind in der Listenverwaltung einsehbar.

### 5.8 Vorlagen für Einträge

- LVPAR-F-090: Für eine Liste können eine oder mehrere Erfassungsvorlagen mit Namen erstellt werden.
- LVPAR-F-091: Eine Vorlage bestimmt die Felder und deren Reihenfolge, die beim Hinzufügen eines Datensatzes zur Liste erscheinen.
- LVPAR-F-092: Vorlagen sind bearbeitbar, duplizierbar und löschbar.
- LVPAR-F-093: Fehlt eine aktive Vorlage, zeigt der Dialog die geeigneten bearbeitbaren Listen- und Objektattribute in einer sinnvollen Reihenfolge.
- LVPAR-F-094: Die Vorlagenauswahl darf keine technischen Relationen als gewöhnliche Nutzereingaben anzeigen.

### 5.9 Verknüpfte Attribute

- LVPAR-F-100: Der Attributpicker gruppiert Felder nach Listenattributen, Attributen des Quellobjekts und verknüpften Objekten.
- LVPAR-F-101: Relation-Felder können aufgeklappt oder durchsucht werden, um konkrete Attribute des verknüpften Records auszuwählen.
- LVPAR-F-102: Verknüpfte Attribute werden nach Möglichkeit in View, Filtern und Sortierung unterstützt.
- LVPAR-F-103: Ist ein verknüpfter Typ in einer Operation nicht unterstützt, wird er ausgegraut oder mit einer klaren Begründung dargestellt.

## 6. UI- und Interaktionsanforderungen

- LVPAR-UI-001: Listenheader, Views-Auswahl, View Settings, Filter, Sortierung, Import/Export und primäre Eintragsaktion folgen der Attio-Informationshierarchie.
- LVPAR-UI-002: Beschriftungen, Icongrößen, Abstände, Dropdowns, Dialoge, Auswahlzustände, Hover-/Focus-Zustände und leere Zustände werden gegen aktuelle Referenzscreens geprüft.
- LVPAR-UI-003: Die UI verwendet Twentys Theme-Tokens, Lingui-Texte und kanonische Icons aus `twenty-ui/icon`.
- LVPAR-UI-004: Navigation und Aktionen müssen mit Tastatur und Screenreader bedienbar sein.
- LVPAR-UI-005: Lade-, Fehler-, Null- und Teilerfolgszustände müssen für jeden mehrstufigen Flow gestaltet sein.
- LVPAR-UI-006: Bei leerer Listenansicht werden Import und „Add records“ angeboten; es darf nicht der Eindruck einer fehlerhaften oder fehlenden Datenverknüpfung entstehen.
- LVPAR-UI-007: Die Listenansicht darf keine zweite konkurrierende „Add records“-Aktion zeigen.
- LVPAR-UI-008: Der Button „Add to list“ ist nur bei valider Mehrfachauswahl sichtbar/aktiv und darf nicht aus altem App-Code doppelt gerendert werden.

## 7. Datenintegrität und Fehlerfälle

- LVPAR-DATA-001: Eine Membership verweist auf eine existierende Liste und einen People-/Company-Record des passenden Typs.
- LVPAR-DATA-002: Wiederholte Bulk-Mutation derselben Auswahl ist idempotent oder liefert eindeutige Skip-Zähler.
- LVPAR-DATA-003: Teilfehler dürfen erfolgreiche Einträge nicht unbemerkt zurückrollen oder doppelt anlegen.
- LVPAR-DATA-004: Feld-, View- und Listenlöschung aktualisieren Schema und Metadaten-Cache.
- LVPAR-DATA-005: Löschen eines Listenmitglieds löscht nicht die Person/Company.
- LVPAR-DATA-006: Löschen einer Liste zeigt Bestätigung und erklärt den Verlust der Listenattribute und Memberships.
- LVPAR-DATA-007: Alle Abfragen und Mutationen bleiben Workspace-isoliert und nutzen die authentifizierte Identität.
- LVPAR-DATA-008: Fehlende, archivierte oder gelöschte Quell-Records erzeugen verständliche Zustände statt defekter Zeilen.
- LVPAR-DATA-009: `List Membership` ist eine Oberfläche über die vorhandenen Listeneinträge und führt keine unabhängige Membership-Datensammlung.
- LVPAR-DATA-010: Feld- und Listenänderungen synchronisieren nur die betroffenen Memberships; andere Listenmitgliedschaften desselben Records bleiben erhalten.

## 8. Attio-Funktionsumfang außerhalb dieser Spezifikation

Folgende Attio-Funktionen sind nicht Bestandteil der Listenparität, solange sie nicht separat beauftragt werden:

- Listenfreigaben, Team-/Workspace-Zugriffsrechte und kollaborative Berechtigungseinstellungen;
- E-Mail-/Kalender-Synchronisierung, Sequences, Workflows, Kommentare und Aktivitäten, soweit diese nicht bereits von Twenty global bereitgestellt werden;
- vollständige CRM-Migrationen aus Drittanbieterprodukten;
- private Favoriten oder User-spezifische Sharing-Konfigurationen, außer wenn als allgemeine View-Einstellung ausdrücklich spezifiziert.

## 9. Implementierungsphasen

Die Phasen sind nach Abhängigkeiten und sichtbarem Nutzwert geordnet. Innerhalb jeder Phase sind bestehende Daten und Universal IDs zu erhalten.

### Phase 1: Stabilisierung des Kernflows — Code weitgehend vorhanden, Empty State und Abnahme offen

- Nur einen Bulk-Add-Command registrieren.
- Bulk Add auf People- und Company-Tabellen Ende-zu-Ende zum Laufen bringen.
- Nach Bulk-Aktion Listeneinträge und Membership-Karten aktualisieren.
- Einträge aus Liste entfernen, ohne Quell-Record zu löschen.
- Add-Dialoge und Empty States vereinheitlichen.

**Abnahme:** Mehrere ausgewählte Personen/Companies lassen sich zu einer existierenden oder neu angelegten Liste hinzufügen; Wiederholungen werden korrekt gemeldet.

### Phase 2: Listenansichten und View Settings — teilweise vorhanden, Abnahme/Lückenanalyse offen

- View-Auswahl, Create/Duplicate/Rename/Delete und Default-View.
- Tabellen-/Kanban-View-Einstellungen für Felder, Spalten/Karten, Filter und Sortierung.
- Listenattribute in View Settings hinzufügen und anzeigen.
- Verknüpfte Felder über Relationspfade ergänzen.

**Abnahme:** Mindestens Tabellenansicht und Status-Kanban lassen sich pro Liste speichern und wieder öffnen.

### Phase 3: Attribute, Status und Entry Templates — teilweise vorhanden

- Attributtypen, Feldbearbeitung und Select-Optionsverwaltung vervollständigen.
- Statusattribute und Kanban-Konfiguration.
- Entry Templates inklusive Vorschau/Verwendung.
- Formel-/Rollup-Umfang nach technischer Machbarkeit festlegen und implementieren.

**Abnahme:** Listenfelder sind konfigurierbar, in Ansichten verwendbar und in Eintragsformularen steuerbar.

### Phase 4: CSV und Templates-Galerie — Import/Export offen, Galerie teilweise vorhanden

- CSV-Import mit Mapping, Value Review, Preview, Deduplizierung und Fehlerbehandlung.
- CSV-/Excel-Export der aktuellen View.
- Vorlagen-Suche, Use-Case-Filter und Vorschau auf Schema und Views.

**Abnahme:** Testdaten lassen sich mit nachvollziehbarer Vorschau importieren und die konfigurierte View verlustarm exportieren.

### Phase 5: Visuelle und funktionale Parität

- Screenshots und Interaction-Checklisten für Attio-Referenzzustände erfassen.
- Abstände, Typografie, Menüs, Dialoge, leere Zustände, Feedback und Responsivität angleichen.
- Tastaturbedienung und Accessibility prüfen.
- Gesamten Ablauf von Listen-Erstellung bis Export in der Twenty-Testumgebung wiederholen.

**Abnahme:** Die ausgewählten kritischen Referenzabläufe erfüllen funktionale und visuelle Parität innerhalb Twentys Komponenten-/Theme-System.

## 10. Verifikationsmatrix

| Ablauf                                   | Verifikation                                                            |
| ---------------------------------------- | ----------------------------------------------------------------------- |
| Blank People-/Company-Liste erstellen    | UI + Datenbank-/GraphQL-Zustand                                         |
| Liste aus Vorlage erstellen              | Felder, Views, Defaults und sichtbare Vorschau                          |
| Bulk Add in bestehende Liste             | People und Companies getrennt; Duplikate/Teilerfolg                     |
| Bulk Add in neue Liste                   | Liste und Members entstehen im selben Flow                              |
| Eintrag hinzufügen/entfernen             | Membership-Update ohne Löschen des Quell-Records                        |
| Tabellen-View konfigurieren              | Spalten, Reihenfolge, Breite, Filter und Sortierung bleiben gespeichert |
| Kanban-View konfigurieren                | Statusspalten, Card fields, Verschieben und Filter                      |
| Attribut ändern                          | Typ, Optionen, Default, Werte und aktualisierte View                    |
| Relation/Rollup anzeigen                 | Quellwert, leere/verwaiste Relation und Aggregation                     |
| CSV importieren                          | Mapping, Review, Preview, Duplikate, Fehler und Teilimport              |
| View exportieren                         | sichtbare Felder und Filter, CSV und Excel                              |
| Bestehende Liste migrieren/aktualisieren | IDs und Counts bleiben stabil; genau eine UI/Command-Registrierung      |

Die Nutzerin bzw. der Nutzer hat die Twenty-Instanz als Testumgebung mit Demodaten freigegeben. Für Entwicklung dürfen People, Companies, Listen und zugehörige Testwerte dort erstellt, geändert und gelöscht werden. Produktionsdaten sind davon nicht umfasst. Ein späterer Transfer auf eine andere Twenty-Instanz umfasst nur die Funktionen und den App-Code, keine dieser Daten.

## 11. Referenzen

- [Attio: Create lists](https://attio.com/help/reference/managing-your-data/lists/create-lists)
- [Attio: Manage lists](https://attio.com/help/reference/managing-your-data/lists/manage-lists)
- [Attio: Table views](https://attio.com/help/reference/managing-your-data/views/create-and-manage-table-views)
- [Attio: Kanban views](https://attio.com/help/reference/managing-your-data/views/create-and-manage-kanban-views)
- [Attio: Filter and sort views](https://attio.com/help/reference/managing-your-data/views/filter-and-sort-views)
- [Attio: Attributes](https://attio.com/help/reference/managing-your-data/attributes/create-manage-attributes)
- [Attio: Record and list entry templates](https://attio.com/help/reference/managing-your-data/create-record-and-list-entry-templates)
- [Attio: CSV import](https://attio.com/help/reference/imports-exports/csv-imports/import-data-into-attio-via-csv)
- [Attio: Export lists and views](https://attio.com/help/reference/imports-exports/exporting-lists-and-views)
- Implementierung: `packages/twenty-apps/internal/list-view/`
- App-Extraktions-/Host-Anforderungen: `LIST_VIEW_APP_EXTRACTION_REQUIREMENTS.md`
