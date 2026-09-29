# Requirements: Extraktion des ListView-Features in eine Twenty App

## 1. Dokumentstatus

| Feld | Wert |
| --- | --- |
| Status | Entwurf zur Umsetzung |
| Stand | 17. September 2026 |
| Ausgangspunkt | Aktueller Arbeitsstand in diesem Repository |
| Ziel | Installierbare Twenty App mit funktionaler und visueller 1:1-Parität |
| Primäre Zielgruppe | Produktentwicklung, Twenty-Core-Entwicklung, App-Entwicklung, QA und Partnerbetrieb |

Dieses Dokument ist die verbindliche fachliche und technische Spezifikation für die Extraktion des aktuell im Twenty-Core implementierten ListView-Features. Es beschreibt nicht die Entwicklung eines ähnlichen Listen-Features, sondern die kontrollierte Verlagerung der bestehenden Funktionalität in eine installierbare App.

Die Schlüsselwörter **MUSS**, **DARF NICHT**, **SOLL** und **KANN** sind normativ:

- **MUSS / DARF NICHT:** zwingend für die Abnahme.
- **SOLL:** nur mit dokumentierter technischer Begründung abweichbar.
- **KANN:** optionale Erweiterung außerhalb der Abnahme.

## 2. Kurzentscheidung

Das ListView-Feature wird als **First-Party Twenty App mit einem kleinen generischen Native App Host** umgesetzt.

Eine reine SDK-App mit den heute dokumentierten Front Components reicht für die geforderte 1:1-Parität nicht aus. Front Components laufen in einer Sandbox und können die internen React-Komponenten, den nativen Workspace-Router, die Record-Index-Kontexte, die Sidebar und die serverseitigen NestJS-/TypeORM-Module nicht direkt wiederverwenden. Eine reine SDK-Neuentwicklung würde daher eine zweite Oberfläche erzeugen und sich funktional vom aktuellen Feature entfernen.

Die Ziellösung besteht deshalb aus zwei getrennten Artefakten:

1. **ListView App:** besitzt Produktidentität, Installation, Aktivierung, App-Version, ListView-spezifische Registrierung und alle ListView-spezifischen Implementierungen.
2. **Native App Host:** eine kleine, additive und generische Erweiterung des Twenty-Core, über die Apps native Routen, Navigationsbereiche, Record-Page-Slots, Commands und Servermodule registrieren können.

Der Native App Host DARF keine ListView-Fachlogik enthalten. Der Twenty-Core DARF nach Abschluss nicht direkt von einem `record-list`-Modul abhängen. Die App hängt ausschließlich von einer versionierten Host-Capability ab.

> **Wichtige Betriebsgrenze:** Die App funktioniert 1:1 auf jeder Twenty-Installation, die eine kompatible Version des Native App Hosts enthält. Sie kann auf einer unveränderten Standard-Twenty-Version erst dann 1:1 installiert werden, wenn diese generischen Host-Erweiterungspunkte in Twenty upstream verfügbar sind.

## 3. Ziele

### 3.1 Produktziele

- LVAPP-G-001: Die extrahierte App MUSS aus Nutzersicht dieselbe Oberfläche und dasselbe Verhalten wie die aktuelle Version bieten.
- LVAPP-G-002: Nutzer DÜRFEN durch die Extraktion keine bestehenden Listen, Einträge, Views, Felder, Sortierungen oder gespeicherten Werte verlieren.
- LVAPP-G-003: Die App MUSS auf einer kompatiblen Twenty-Installation installierbar, aktivierbar, aktualisierbar und deaktivierbar sein.
- LVAPP-G-004: Ein normales Twenty-Update DARF nicht regelmäßig manuelle Konfliktauflösung in ListView-Fachcode erfordern.
- LVAPP-G-005: Core-Änderungen MÜSSEN generisch, additiv, durch Tests abgesichert und als Upstream-Beitrag geeignet sein.
- LVAPP-G-006: Ohne installierte App MUSS sich Twenty wie eine Standardinstallation ohne ListView verhalten.
- LVAPP-G-007: Die vorhandene native Twenty-Record-Index-Oberfläche MUSS weiterverwendet werden; es darf keine nachgebaute Parallel-Tabelle entstehen.

### 3.2 Technische Ziele

- LVAPP-G-008: Die App MUSS einen stabilen `universalIdentifier` und eine semantische App-Version besitzen.
- LVAPP-G-009: Die App MUSS ihre benötigte Native-Host-Capability und deren Versionsbereich deklarieren.
- LVAPP-G-010: Die ListView-Fachimplementierung SOLL durch Verschieben und Entkoppeln des bestehenden Codes entstehen, nicht durch eine funktional abweichende Neuentwicklung.
- LVAPP-G-011: App, Native App Host und unterstützte Twenty-Versionen MÜSSEN durch eine automatisierte Kompatibilitätsmatrix geprüft werden.
- LVAPP-G-012: Installation und Migration MÜSSEN wiederholbar, transaktional soweit technisch möglich und gegen Teilfehler abgesichert sein.

## 4. Explizite Nicht-Ziele

Die folgenden Punkte gehören nicht zu dieser Extraktion und dürfen die Umsetzung nicht blockieren:

- LVAPP-NG-001: Es wird **keine neue verbindliche Semantik für Listeneinträge oder Duplikate** definiert. Das aktuelle Verhalten bleibt erhalten.
- LVAPP-NG-002: Es werden **keine weiteren Standard- oder Custom Objects** unterstützt. Listen bleiben zunächst auf `person` und `company` beschränkt.
- LVAPP-NG-003: Es wird **kein neues Berechtigungs- oder ACL-Modell** für Listen entwickelt. Das aktuelle Autorisierungsverhalten bleibt für diese Phase bestehen.
- LVAPP-NG-004: Es wird keine zweite, vereinfachte ListView als isolierte Remote-DOM-Tabelle gebaut.
- LVAPP-NG-005: Es erfolgt kein Wechsel auf ein einzelnes generisches JSON-Feld als Ersatz für echte Felder, Views und Metadatenobjekte.
- LVAPP-NG-006: Die Extraktion ist kein Anlass für ein visuelles Redesign, neue Templates oder eine Änderung der bestehenden Interaktionen.
- LVAPP-NG-007: Marketplace-Publishing, Monetarisierung und öffentliche Dokumentation sind nicht Teil der technischen Erstabnahme.

## 5. Definition von „1:1-Parität“

1:1-Parität bedeutet für diese Aufgabe:

- identische sichtbare Inhalte, Texte, Icons, Buttonreihenfolge, Modals und Zustände;
- identische Navigation, URLs und Deep Links;
- identische Tastaturinteraktionen und Hotkeys;
- identische Tabellen-, Kanban-, Filter-, Sortier-, View- und Inline-Editing-Funktionen;
- identisches Datenmodell und identische GraphQL-Semantik;
- identisches Verhalten bei Ladezuständen, leeren Zuständen und Fehlern;
- identische Nutzung der Twenty-Design-Tokens und nativen Twenty-Komponenten;
- keine zusätzliche primäre Aktion zum direkten Erstellen eines technischen Listeneintrags;
- keine sichtbare Abhängigkeit davon, ob die Funktion als Core-Feature oder App geladen wurde.

Parität wird nicht allein durch Code Review bestätigt, sondern durch automatisierte Behavior-Tests und visuelle Referenztests.

## 6. Aktueller Implementierungsumfang

Die Extraktion MUSS mindestens den folgenden aktuellen Umfang erfassen. Vor dem ersten Refactoring ist daraus ein maschinenlesbares Inventar zu erzeugen, damit keine Datei oder Integration stillschweigend zurückbleibt.

### 6.1 Serverdomäne

Aktuelle Hauptquellen:

- `packages/twenty-server/src/engine/metadata-modules/record-list/`
- `packages/twenty-server/src/engine/metadata-modules/view/`
- `packages/twenty-server/src/engine/metadata-modules/view-permissions/`
- `packages/twenty-server/src/engine/metadata-modules/command-menu-item/`
- `packages/twenty-server/src/engine/workspace-manager/twenty-standard-application/constants/standard-command-menu-item.constant.ts`
- `packages/twenty-server/src/database/commands/upgrade-version-command/2-39/`

Der aktuelle Umfang umfasst:

- `RecordListEntity` in der Core-Datenbank;
- GraphQL-Queries für Listen, einzelne Listen, Einträge und Mitgliedschaften;
- GraphQL-Mutationen für Erstellen, Ändern, Sortieren und Löschen von Listen;
- Hinzufügen eines oder mehrerer Records sowie Entfernen eines Eintrags;
- Erstellen, Ändern und Löschen benutzerdefinierter Listenfelder;
- dynamische Erzeugung eines Entry-Objekts je Liste;
- Relation `sourceRecord` zum People- oder Companies-Objekt;
- Erzeugung und Zuordnung von Default-Views;
- Template-Felder und Template-Views;
- View-Zuordnung über `recordListId`;
- Workspace-Isolation, Positionsverwaltung, Actor-Felder und Soft-Delete-Verhalten;
- existierende Upgrade Commands und Tests.

### 6.2 Frontend

Aktuelle Hauptquellen:

- `packages/twenty-front/src/modules/record-list/`
- `packages/twenty-front/src/pages/record-list/RecordListPage.tsx`
- `packages/twenty-front/src/modules/app/routing/utils/createWorkspaceRouteObjects.tsx`
- `packages/twenty-front/src/modules/navigation/components/MainNavigationDrawerScrollableItems.tsx`
- `packages/twenty-front/src/pages/object-record/RecordShowPage.tsx`
- `packages/twenty-front/src/modules/command-menu-item/`
- `packages/twenty-front/src/modules/object-record/record-index/`
- betroffene Komponenten unter `record-table`, `record-board`, `record-calendar` und `record-list` im Object-Record-Modul.

Der aktuelle Umfang umfasst:

- Lists-Bereich in der Hauptnavigation;
- Erstellen einer leeren oder template-basierten Liste;
- Auswahl zwischen People und Companies;
- Reihenfolge per Drag-and-drop und Tastatursteuerung;
- native Route `/lists/:recordListId`;
- nativer Record Index mit Table- und Kanban-Views;
- View-Auswahl, Filter, Sortierung und Options-Menü;
- Listenkopf mit Icon, Name, Command-Menü, Settings und `Add records`;
- Hotkey `e` zum Öffnen von `Add records`;
- Suche, Mehrfachauswahl und Bulk-Hinzufügen vorhandener Records;
- Erstellen eines neuen People-/Company-Records aus dem Add-Dialog;
- Öffnen des Quell-Records statt des technischen Entry-Records;
- Unterdrückung aller nativen „New entry“-Aktionen im Listenindex;
- Settings für Name, Icon, Default-View, Felder und Select-Optionen;
- Mitgliedschaften und Inline-Bearbeitung auf People-/Company-Record-Seiten;
- Bulk-Command „Add records to list“ für ausgewählte Records;
- GraphQL-Hooks, Fragmente, Types und Cache-Aktualisierung.

### 6.3 Shared Contracts und Generated Code

Die Extraktion MUSS außerdem alle ListView-bezogenen Änderungen in folgenden Bereichen inventarisieren:

- `packages/twenty-shared/src/types/AppPath.ts`;
- generierte Frontend-GraphQL-Typen;
- Workspace-Schema-Cache-Abhängigkeiten;
- Flat-Metadata-Konvertierung für Views;
- Engine Component Keys;
- Tests für Navigation, Home Paths und Object-Record-Komponenten.

Generated Code DARF nicht zur Quelle der Wahrheit werden. Er wird ausschließlich aus dem finalen Schema neu erzeugt.

## 7. Zielarchitektur

### 7.1 Komponenten

```text
ListView App
  ├── application.config.ts
  ├── App-Manifest und stabile Universal IDs
  ├── ListView-Frontendmodul
  ├── ListView-Servermodul
  ├── Domain Contracts und GraphQL-Dokumente
  ├── Installations-/Upgrade-Definitionen
  └── App-spezifische Tests
            │
            │ benötigt Capability native-app-host@1
            ▼
Generischer Native App Host in Twenty
  ├── Frontend Extension Registry
  ├── Server Extension Registry
  ├── Installationsstatus und Capability-Prüfung
  └── stabile, öffentliche Host Contracts
            │
            ▼
Twenty Public APIs und native UI-Bausteine
```

### 7.2 Quellcodegrenzen

- LVAPP-ARCH-001: ListView-spezifischer Code MUSS aus generischen Twenty-Core-Modulen entfernt werden, soweit er nicht Teil eines allgemeinen öffentlichen Contracts ist.
- LVAPP-ARCH-002: Der Native App Host DARF keine Imports aus einem Modul oder Package mit ListView-/RecordList-Fachlogik besitzen.
- LVAPP-ARCH-003: Das ListView-Package DARF öffentliche Host Contracts und freigegebene Twenty-Komponenten importieren, aber keine privaten Pfad-Aliase zu beliebigen Core-Interna.
- LVAPP-ARCH-004: Benötigt die App heute eine private Core-Funktion, MUSS entweder ein schmaler allgemeiner Public Contract geschaffen oder die Funktion in die App verschoben werden.
- LVAPP-ARCH-005: Alle Registrierungen MÜSSEN anhand des App-Installationsstatus aktiviert und beim Deaktivieren vollständig aus der Laufzeit entfernt werden.
- LVAPP-ARCH-006: Zirkuläre Abhängigkeiten zwischen App, Frontend, Server und SDK sind unzulässig.

### 7.3 Empfohlene Repository-Struktur

Die konkrete Package-Bezeichnung darf an die finalen Nx-Konventionen angepasst werden. Die Verantwortungsgrenzen sind verbindlich:

```text
packages/twenty-apps/public/list-view/
  application.config.ts
  package.json
  src/
    app/
    contracts/
    frontend/
    server/
    installation/
    tests/

packages/twenty-front/src/modules/app/native-extension-host/
packages/twenty-server/src/engine/core-modules/application/native-extension-host/
packages/twenty-sdk/src/native-extension-host-contracts/
```

Bis ein externer nativer App-Bundle-Loader verfügbar ist, KANN die App als First-Party-App im Monorepo gebaut werden. Diese Zwischenstufe gilt jedoch nur dann als architektonisch korrekt, wenn:

- ListView-Code ausschließlich über die generische Registry geladen wird;
- die App durch Installationsstatus ein- und ausgeschaltet wird;
- keine neuen direkten ListView-Imports in normale Core-Flows gelangen;
- der spätere Wechsel zu einem separat ausgelieferten Bundle ohne fachliche Neuentwicklung möglich ist.

## 8. Anforderungen an den Native App Host

### 8.1 Allgemein

- LVAPP-HOST-001: Der Host MUSS eine versionierte Capability bereitstellen, initial `native-app-host@1`.
- LVAPP-HOST-002: Eine App MUSS bei Installation einen kompatiblen Versionsbereich deklarieren können.
- LVAPP-HOST-003: Installation MUSS mit einer verständlichen Fehlermeldung abbrechen, wenn die Capability fehlt oder inkompatibel ist.
- LVAPP-HOST-004: Registrierungen MÜSSEN über stabile IDs erfolgen und idempotent sein.
- LVAPP-HOST-005: Ein Fehler in der App DARF nicht den gesamten Workspace-Router oder das Server-Bootstrapping unbrauchbar machen.
- LVAPP-HOST-006: Der Host MUSS Lazy Loading und getrennte Bundles unterstützen, damit eine nicht installierte App weder UI noch Server-Fachcode lädt.
- LVAPP-HOST-007: Die generischen Contracts MÜSSEN in einer kleinen, dokumentierten und semantisch versionierten API liegen.

### 8.2 Frontend Extension Registry

Der Host MUSS mindestens folgende Erweiterungspunkte bereitstellen:

| Extension Point | Erforderliches Verhalten |
| --- | --- |
| Workspace Route | Registrierung von `/lists/:recordListId` mit Lazy Component, Error Boundary und Installationsprüfung |
| Navigation Section | Native Sidebar-Sektion mit eigener Datenquelle, Aktionen, Sortierung und aktivem Pfad |
| Record Page Slot | Einhängen der List Memberships als nachgelagerter Inhalt auf People-/Company-Seiten |
| Command Renderer | Zuordnung eines App-Commands zu einer nativen Headless-Komponente und einem Modal |
| Record Index Policy | Deaktivierung der Record-Erstellung und Überschreiben von Ziel-URL sowie Open-Handler |
| Header Actions | Native Header-Aktionen in definierter Reihenfolge |
| Hotkey Scope | Registrierung und sauberes Entfernen app-spezifischer Hotkeys |

Zusätzliche Regeln:

- LVAPP-HOST-FE-001: Extension Points MÜSSEN typisiert sein; `any` und ungeprüfte Komponenten-Maps sind unzulässig.
- LVAPP-HOST-FE-002: Die Registry MUSS stabile Sortier-/Prioritätsregeln definieren.
- LVAPP-HOST-FE-003: Uninstall oder Deaktivierung MUSS alle Routen, Hotkeys, Commands und Slots ohne Browser-Reload-Leaks entfernen.
- LVAPP-HOST-FE-004: Die App MUSS offizielle native Komponenten verwenden können, die für diesen Host als Public API freigegeben sind.
- LVAPP-HOST-FE-005: Die existierenden Record-Index-Erweiterungen `isRecordCreationDisabled`, `indexIdentifierUrl` und `onOpenRecord` MÜSSEN als allgemeine Host-Policy erhalten bleiben.
- LVAPP-HOST-FE-006: Alle Stellen, die einen Record direkt erzeugen können, MÜSSEN dieselbe Creation-Policy beachten: Header, Empty State, Table Groups, Board Columns und Calendar.
- LVAPP-HOST-FE-007: Die Standardaktion „New <entry>“ DARF auf einer ListView-Seite weder sichtbar noch per Tastatur/Command ausführbar sein.

### 8.3 Server Extension Registry

Der Host MUSS mindestens ermöglichen:

- Registrierung eines App-Servermoduls mit Resolvern und Services;
- Registrierung app-eigener Core-Metadaten und Datenbankmigrationen;
- Zugriff auf die bestehenden öffentlichen Metadata-, Object-, Field-, View- und Workspace-Services;
- Prüfung des Installationsstatus vor jeder app-spezifischen Operation;
- Lifecycle Hooks für `install`, `upgrade`, `disable`, `enable` und `uninstall`;
- Schema-Invalidierung und Cache-Neuaufbau nach Installation oder Upgrade;
- reproduzierbares Bootstrapping in Multi-Workspace-Umgebungen.

Normative Regeln:

- LVAPP-HOST-BE-001: Der generische Host DARF ListView-spezifische DTOs, Resolver oder Services nicht kennen.
- LVAPP-HOST-BE-002: App-Resolver MÜSSEN nur verfügbar oder ausführbar sein, wenn die App im Workspace installiert und aktiviert ist.
- LVAPP-HOST-BE-003: Workspace-Isolation MUSS durch den Host und die App unverändert eingehalten werden.
- LVAPP-HOST-BE-004: Migrationen MÜSSEN eine stabile App-ID und App-Version als Eigentümer speichern.
- LVAPP-HOST-BE-005: Schema- und Registry-Fehler MÜSSEN mit App-ID, Version, Workspace-ID und Capability-Version beobachtbar sein, ohne sensible Record-Inhalte zu protokollieren.

## 9. Anforderungen an die ListView App

### 9.1 App-Manifest

Die App MUSS über `defineApplication` mindestens deklarieren:

- stabilen `universalIdentifier`;
- Anzeigenamen `Lists` beziehungsweise den final abgestimmten Produktnamen;
- Beschreibung und App-Version;
- benötigte Host-Capability `native-app-host@1`;
- ListView Frontend- und Server-Entrypoints;
- Lifecycle-Entrypoints;
- stabile IDs für Commands, Navigationseinträge und App-eigene Metadaten;
- eine minimale Default Role, soweit das App-System diese technisch verlangt.

Die App-ID und alle Universal IDs DÜRFEN nach einer Veröffentlichung nicht neu generiert werden.

### 9.2 Feature-Aktivierung

- LVAPP-APP-001: Installation aktiviert die ListView-Registrierungen für genau einen Workspace.
- LVAPP-APP-002: Deaktivierung blendet UI-Einstiegspunkte aus und blockiert ListView-Operationen, löscht aber keine Daten.
- LVAPP-APP-003: Reaktivierung stellt alle vorherigen Listen ohne Migration oder Datenverlust wieder her.
- LVAPP-APP-004: Die App MUSS ihre Installations- und Datenmodellversion getrennt von der Twenty-Version verfolgen.
- LVAPP-APP-005: Mehrfaches Ausführen desselben Installations- oder Upgrade-Schritts DARF keine Duplikate erzeugen.

## 10. Funktionale Anforderungen

### 10.1 Listen erstellen und verwalten

- LVAPP-F-001: Nutzer können über die Sidebar eine neue Liste erstellen.
- LVAPP-F-002: Der Create-Dialog bietet dieselben Blank- und Template-Optionen wie der aktuelle Stand.
- LVAPP-F-003: Als Basisobjekt sind ausschließlich People und Companies auswählbar.
- LVAPP-F-004: Name und Icon sind im selben Dialog und mit denselben Validierungen konfigurierbar.
- LVAPP-F-005: Neue Listen erhalten dieselben Systemfelder, Template-Felder, Views und Default-Werte wie bisher.
- LVAPP-F-006: Listen können umbenannt, mit einem anderen Icon versehen, sortiert und gelöscht werden.
- LVAPP-F-007: Sidebar-Reihenfolge funktioniert per Drag-and-drop und über die bestehenden barrierearmen Tastaturaktionen.
- LVAPP-F-008: Das Löschen einer Liste verwendet dieselben Bestätigungen und dieselbe Cleanup-Semantik wie der aktuelle Stand.

### 10.2 Listenseite

- LVAPP-F-009: Die kanonische URL bleibt `/lists/:recordListId`.
- LVAPP-F-010: Bestehende Deep Links und Links mit `viewId` bleiben gültig.
- LVAPP-F-011: Die Seite verwendet weiterhin `RecordIndexContainerGater` beziehungsweise dessen öffentliche Host-Abstraktion.
- LVAPP-F-012: Table- und Kanban-Views, View-Wechsel, Filter, Sorts und Options funktionieren unverändert.
- LVAPP-F-013: Der Default-View wird in der Reihenfolge URL-View, konfigurierte Default-View, Index-View, erste gültige View aufgelöst.
- LVAPP-F-014: Klick auf einen Eintrag öffnet den zugehörigen People-/Company-Record, nicht das technische Entry-Objekt.
- LVAPP-F-015: Die technische `sourceRecord`-Relation bleibt in allen notwendigen Queries verfügbar, wird aber nicht als normales Listenfeld angeboten.
- LVAPP-F-016: Auf der Listenseite existiert genau eine primäre Erstellaktion: `Add records`.
- LVAPP-F-017: Der Button `New <list name> entry` ist vollständig entfernt beziehungsweise durch die Creation-Policy deaktiviert.
- LVAPP-F-018: `e` öffnet den Add-Records-Dialog, sofern kein Eingabefeld fokussiert ist.

### 10.3 Records hinzufügen und entfernen

- LVAPP-F-019: Der Add-Records-Dialog lädt Records des Basisobjekts und unterstützt Suche sowie Mehrfachauswahl.
- LVAPP-F-020: Bereits enthaltene Records werden entsprechend dem aktuellen Verhalten erkannt und nicht erneut angelegt.
- LVAPP-F-021: Bulk Add gibt dieselbe Anzahl hinzugefügter und übersprungener Records zurück wie aktuell.
- LVAPP-F-022: Neue People-/Company-Records können aus dem Dialog angelegt und anschließend hinzugefügt werden.
- LVAPP-F-023: Einträge können aus der Liste entfernt werden, ohne den zugrunde liegenden People-/Company-Record zu löschen.
- LVAPP-F-024: Der bestehende Command „Add records to list“ für eine Record-Auswahl bleibt erhalten.
- LVAPP-F-025: Fehler und Teilerfolge verwenden dieselben Snackbars und Rückmeldungen wie der aktuelle Stand.

### 10.4 Listenfelder und Settings

- LVAPP-F-026: Settings unterstützen Name, Icon und Default-View.
- LVAPP-F-027: Benutzerdefinierte Felder können erstellt, umbenannt und gelöscht werden.
- LVAPP-F-028: Unterstützte Feldtypen bleiben `TEXT`, `NUMBER`, `DATE`, `DATE_TIME`, `BOOLEAN`, `SELECT`, `MULTI_SELECT` und `RATING`.
- LVAPP-F-029: Select- und Multi-Select-Optionen können erstellt, umbenannt, gelöscht und sortiert werden.
- LVAPP-F-030: Systemfelder und die technische Source-Record-Relation dürfen nicht gelöscht oder wie normale Custom Fields verändert werden.
- LVAPP-F-031: Änderungen werden ohne Inkonsistenz zwischen Metadata Cache, GraphQL-Schema und aktiver View sichtbar.

### 10.5 Mitgliedschaften auf Record-Seiten

- LVAPP-F-032: People- und Company-Seiten zeigen dieselbe Lists-/Memberships-Sektion wie aktuell.
- LVAPP-F-033: Die Sektion zeigt alle Listen, in denen der Record enthalten ist.
- LVAPP-F-034: App-eigene Feldwerte können dort inline bearbeitet werden.
- LVAPP-F-035: Von der Membership gelangt der Nutzer zur korrekten Liste und zum korrekten Eintrag.
- LVAPP-F-036: Hinzufügen zu und Entfernen aus einer Liste funktioniert aus der Record-Seite.
- LVAPP-F-037: Ist die App deaktiviert, darf die Sektion nicht gerendert werden.

## 11. Datenmodell und API-Vertrag

### 11.1 Datenmodell

Das bestehende Modell bleibt die Grundlage:

- eine `recordList`-Zeile pro Liste;
- ein dynamisches Entry-Object pro Liste;
- eine Many-to-one-Relation `sourceRecord` zu Person oder Company;
- echte Metadata Fields auf dem Entry-Object;
- normale Twenty Views, View Fields, Filters, Sorts und Groups;
- `defaultViewId` an der Liste und `recordListId` an zugehörigen Views.

Anforderungen:

- LVAPP-DATA-001: Bestehende IDs für Listen, Entry Objects, Fields, Views und Entries MÜSSEN erhalten bleiben.
- LVAPP-DATA-002: App-Eigentum MUSS über eine stabile Application-ID beziehungsweise einen generischen Application-Metadata-Link nachvollziehbar sein.
- LVAPP-DATA-003: Das Eigentumsmerkmal DARF bestehende Abfragen anderer Twenty-Komponenten nicht brechen.
- LVAPP-DATA-004: Datenmigrationen MÜSSEN für große Workspaces in Batches ausführbar sein und dürfen keinen vollständigen Record-Reload in den Prozessspeicher erzwingen.
- LVAPP-DATA-005: Fremdschlüssel, Indizes, Soft Deletes und Cascade-Verhalten müssen vor und nach der Extraktion äquivalent sein.
- LVAPP-DATA-006: Eine bestehende Liste darf nach der Migration kein neues Entry Object erhalten.

### 11.2 GraphQL-Vertrag

Die folgenden Operationen bleiben mindestens kompatibel:

**Queries**

- `recordLists`
- `recordList(id)`
- `recordListEntries(recordListId)`
- `recordListMemberships(sourceRecordId, parentObjectMetadataId)`

**Mutationen**

- `createRecordList`
- `updateRecordList`
- `reorderRecordLists`
- `deleteRecordList`
- `addRecordToList`
- `addRecordsToList`
- `removeRecordFromList`
- `createRecordListField`
- `updateRecordListField`
- `deleteRecordListField`

Anforderungen:

- LVAPP-API-001: Namen, Eingaben, Rückgabefelder und Fehlersemantik bleiben während der Migration rückwärtskompatibel.
- LVAPP-API-002: Der Wechsel der Resolver-Eigentümerschaft zur App DARF keine Änderung der generierten Client-Typen außerhalb erwartbarer Herkunftsmetadaten verursachen.
- LVAPP-API-003: Queries und Mutationen MÜSSEN den Workspace ausschließlich aus dem authentifizierten Kontext beziehen.
- LVAPP-API-004: Die App MUSS denselben Schutz gegen Zugriff auf Listen anderer Workspaces behalten.
- LVAPP-API-005: Das aktuelle Duplikatverhalten wird lediglich konserviert und in Regressionstests festgehalten; es wird nicht fachlich neu festgelegt.

## 12. Installation, Upgrade, Deaktivierung und Uninstall

### 12.1 Fresh Install

Die Installation MUSS:

1. Host-Capability und Version prüfen;
2. App-Installation für den Workspace registrieren;
3. erforderliche Core-/Application-Metadaten idempotent anlegen;
4. GraphQL-/Metadata-Caches invalidieren;
5. Frontend-Registrierungen aktivieren;
6. einen Smoke Test für Query, Route und Navigation ermöglichen;
7. bei Fehlern einen eindeutigen Installationsstatus hinterlassen und keine halb aktive UI anzeigen.

Eine Fresh Installation legt keine Beispiel- oder Template-Liste automatisch an, sofern dies der aktuelle Produktstand nicht tut.

### 12.2 Migration bestehender Installationen

Die Bestandsmigration SOLL die bestehenden Daten **in place** übernehmen statt sie zu kopieren:

1. aktuelle Schema- und Datenmodellversion erkennen;
2. Backup-/Rollback-Voraussetzungen prüfen und dokumentieren;
3. ListView App mit fixer App-ID als installiert registrieren;
4. bestehende `recordList`-Datensätze und abhängige Metadaten der App zuordnen;
5. fehlende `defaultViewId`-/`recordListId`-Verknüpfungen mit den bestehenden Upgrade-Regeln vervollständigen;
6. Commands und Navigation auf App-Registrierungen umstellen;
7. GraphQL-Schema und Metadata Cache neu aufbauen;
8. Datenintegritätsprüfung ausführen;
9. erst danach alte direkte Core-Registrierungen deaktivieren.

- LVAPP-MIG-001: Der Migrationsschritt MUSS idempotent sein.
- LVAPP-MIG-002: Er MUSS in `up` und, soweit ohne Datenverlust möglich, in `down` beschrieben werden.
- LVAPP-MIG-003: Ein Rollback DARF während einer fehlgeschlagenen Code-Deployment-Phase keine Listen löschen.
- LVAPP-MIG-004: Für jede Liste müssen vor und nach Migration Counts für Entries, Fields und Views übereinstimmen.
- LVAPP-MIG-005: Ein Dry-Run MUSS Konflikte und erwartete Änderungen ausgeben, ohne Daten zu verändern.

### 12.3 App Upgrade

- Jede App-Version mit Datenmodelländerung benötigt eine versionierte, genau einmal ausführbare Migration.
- Ein App Upgrade DARF keine Twenty-Core-Upgrade-Commands nachträglich verändern.
- Vorwärtskompatible additive Änderungen sind zu bevorzugen.
- Rollback-Unterstützung und Mindest-Host-Version müssen in den Release Notes stehen.

### 12.4 Deaktivierung und Uninstall

- Deaktivierung ist nicht destruktiv und behält alle Daten.
- Standard-Uninstall MUSS zunächst eine Auswirkungsübersicht zeigen beziehungsweise über die Installations-API liefern.
- Ein unbeabsichtigter Uninstall DARF nicht automatisch alle Listen und Entry-Daten vernichten.
- Destruktives Entfernen der App-Daten ist nur als separate, explizit bestätigte Aktion zulässig.
- Nach Deaktivierung/Uninstall dürfen keine toten Navigationseinträge, Routen, Commands oder Record-Page-Slots sichtbar bleiben.
- Bei erhaltenen Daten muss eine spätere Reinstallation dieselben Datensätze wieder anbinden können.

## 13. Updatefähigkeit und Upstream-Strategie

### 13.1 Anforderungen zur Vermeidung eines dauerhaften Forks

- LVAPP-UP-001: Core-Änderungen MÜSSEN als eigenständige generische Pull Requests strukturierbar sein.
- LVAPP-UP-002: Kein Core-PR darf fachliche Begriffe wie „Outreach tracker“ oder kundenspezifische Templates enthalten.
- LVAPP-UP-003: Der Host MUSS auch durch eine zweite kleine Test-App demonstriert werden, damit seine Allgemeingültigkeit belegt ist.
- LVAPP-UP-004: Direkte Änderungen an bestehenden Record-Index-Komponenten müssen auf kleine öffentliche Policies/Slots reduziert werden.
- LVAPP-UP-005: App-Code und App-Migrationen dürfen nicht bei jedem Twenty-Release in Core-Migrationsverzeichnisse kopiert werden müssen.
- LVAPP-UP-006: Für jede unterstützte Twenty-Version wird eine explizite Kombination aus Twenty-Version, Host-Capability-Version und ListView-App-Version veröffentlicht.
- LVAPP-UP-007: Ein automatisierter Test MUSS gegen den aktuellen Twenty-Hauptbranch und mindestens die produktiv eingesetzte Release-Linie laufen.

### 13.2 Kompatibilitätsmatrix

Jedes Release MUSS eine Matrix in dieser Form veröffentlichen:

| Twenty-Version | Native Host | ListView App | Status |
| --- | --- | --- | --- |
| definierte produktive Version | `1.x` | `1.x` | unterstützt |
| aktueller Upstream-Release | geprüft | geprüft | unterstützt / blockiert mit Grund |
| Upstream `main` | CI-Test | CI-Test | informativ |

Bei Inkompatibilität MUSS die Installation oder das Upgrade vor Änderungen abbrechen; stilles Laden mit teilweise fehlenden Funktionen ist unzulässig.

### 13.3 Update-Runbook für Partner

Für Partner MUSS ein kurzer, reproduzierbarer Ablauf dokumentiert werden:

1. Backup erstellen.
2. Kompatibilitätsmatrix prüfen.
3. Twenty aktualisieren.
4. Native-Host-Capability prüfen.
5. ListView App aktualisieren.
6. App-Migrationen ausführen.
7. automatisierten Smoke Test ausführen.
8. bei Fehlern Code-Rollback durchführen, Daten aber erhalten.

Zielwert: Ein reguläres kompatibles Twenty-Update erfordert keine manuelle Konfliktauflösung im ListView-Code.

## 14. Qualitätssicherung

### 14.1 Baseline vor der Extraktion

Vor dem ersten Code-Move MÜSSEN folgende Referenzen im aktuellen Stand erfasst werden:

- Screenshots aller primären Desktopzustände in Light und Dark Mode;
- Screenshots relevanter leerer, Lade- und Fehlerzustände;
- Videos oder Playwright-Traces der Kernabläufe;
- GraphQL-Schema-Snapshot;
- Beispieldatenexport mit Listen, Entries, Views, Fields und Memberships;
- Route-, Navigation- und Command-Inventar;
- aktueller Teststatus der betroffenen Pakete.

### 14.2 Unit Tests

Mindestens abzudecken:

- Template-Erzeugung;
- Entry-Object-Namen und Metadaten;
- People-/Company-Validierung;
- Positionsberechnung und Reorder;
- bestehendes Duplikatverhalten;
- Feldtypen und geschützte Systemfelder;
- Default-View-Auflösung;
- Extension-Registry, Sortierung und Cleanup;
- Capability- und Versionsprüfung.

### 14.3 Integrationstests

Mindestens abzudecken:

- Fresh Install in leerem Workspace;
- Migration eines Workspaces mit mehreren Listen;
- alle GraphQL-Operationen;
- Schema- und Cache-Neuaufbau;
- Deaktivieren und Reaktivieren;
- App Upgrade über mindestens zwei Datenmodellversionen;
- fehlende und inkompatible Host-Capability;
- Workspace-Isolation;
- nicht destruktiver Uninstall;
- Fehler und Wiederaufnahme eines unterbrochenen Installationsschritts.

### 14.4 End-to-End-Tests

Mindestens abzudecken:

1. Liste aus Blank Template erstellen.
2. Liste aus jedem bestehenden Template erstellen.
3. People- und Company-Liste erstellen.
4. Sidebar per Drag-and-drop und Tastatur sortieren.
5. Records suchen, auswählen und hinzufügen.
6. ausgewählte Records per Command zu einer bestehenden und zu einer neuen Liste hinzufügen.
7. Table-/Kanban-View wechseln, filtern und sortieren.
8. Entry anklicken und Quell-Record öffnen.
9. Felder und Select-Optionen verwalten.
10. Membership auf Record-Seite anzeigen und inline bearbeiten.
11. Record aus Liste entfernen.
12. Default-View setzen und Deep Link neu laden.
13. sicherstellen, dass kein `New <list> entry`-Button erscheint.
14. App deaktivieren und wieder aktivieren.
15. Twenty-Update in der unterstützten Matrix simulieren.

### 14.5 Visuelle Regression

- Kritische Screenshots müssen gegen die Baseline verglichen werden.
- Toleranzen sind nur für Rendering-Artefakte zulässig, nicht für Abstände, Positionen, fehlende Controls oder abweichende Texte.
- Die im aktuellen Stand sichtbare Headerreihenfolge MUSS erhalten bleiben: Listenname, Command-Menü, Settings, `Add records`.
- Tests müssen mindestens Desktop Light/Dark und die aktuell unterstützten responsiven Zustände abdecken.

### 14.6 Pflichtprüfungen pro Pull Request

- betroffene Unit- und Integrationstests;
- direkter Typecheck der geänderten Packages;
- diff-basierter Lint;
- App Build und Manifest-Validierung;
- GraphQL-Codegenerierung nach Schemaänderungen;
- E2E-Smoke-Test für Create List und Add Records;
- Kontrolle, dass keine Übersetzungskataloge versehentlich eingecheckt wurden.

## 15. Observability und Fehlerbehandlung

- Logs MÜSSEN App-ID, App-Version, Host-Version, Workspace-ID und Operation enthalten.
- Record-Inhalte, Suchtexte und vertrauliche Feldwerte DÜRFEN nicht standardmäßig geloggt werden.
- Installations- und Migrationsschritte benötigen eindeutige Statuswerte: `pending`, `running`, `completed`, `failed`.
- Fehler müssen einen stabilen Fehlercode und eine handlungsorientierte Meldung besitzen.
- Der Frontend Error Boundary muss eine erneute Ladeaktion bieten und darf die restliche Twenty-Navigation nicht blockieren.
- Metriken SOLLEN Installationsfehler, Migrationsdauer, GraphQL-Fehlerrate und Registry-Ladefehler erfassen.

## 16. Sicherheit und Berechtigungen

Ein neues granuläres Berechtigungsmodell ist ausdrücklich nicht Teil dieser Phase. Trotzdem gelten folgende Mindestanforderungen:

- Das bestehende Authentifizierungs- und Workspace-Isolationsverhalten MUSS erhalten bleiben.
- Die App DARF durch die Extraktion keine anonymen oder workspace-übergreifenden Endpunkte erzeugen.
- Aktuell eingesetzte Permission-Bypässe müssen als technische Schuld dokumentiert werden und dürfen nicht unbemerkt ausgeweitet werden.
- App-Installation und destruktiver Daten-Uninstall müssen auf die bereits dafür vorgesehenen administrativen Twenty-Rechte beschränkt sein.
- Ein späteres Berechtigungsprojekt muss ohne erneute Datenmodellmigration möglich bleiben.

## 17. Umsetzungsphasen

### Phase 0: Baseline und Freeze

- aktuellen Featureumfang und alle Diffs inventarisieren;
- Referenztests, Screenshots und Datenfixtures erstellen;
- stabile App-ID und Universal IDs festlegen;
- unterstützte Twenty-Ausgangsversion festhalten.

**Exit-Kriterium:** Die aktuelle Funktion kann automatisiert und visuell als Referenz geprüft werden.

### Phase 1: Generische Host Contracts

- Frontend- und Server-Registries spezifizieren;
- Capability-Versionierung implementieren;
- öffentliche Native-UI-/Record-Index-Contracts definieren;
- Host mit einer minimalen Test-App validieren;
- Core-PRs so schneiden, dass sie upstream reviewbar sind.

**Exit-Kriterium:** Eine Test-App kann Route, Sidebar-Slot, Record-Page-Slot, Command und Servermodul ohne fachlichen Core-Import registrieren.

### Phase 2: App Scaffold und serverseitige Extraktion

- ListView App anlegen;
- Manifest und Lifecycle implementieren;
- Entity, DTOs, Resolver, Service, Templates und Tests in die App-Verantwortung überführen;
- View-/Metadata-Abhängigkeiten über öffentliche Host Services anbinden;
- Installationsstatus erzwingen.

**Exit-Kriterium:** Fresh Install und vollständiger GraphQL-Vertrag funktionieren über die App.

### Phase 3: Frontend-Extraktion

- Route, Sidebar, Modals, Hooks, Settings, Memberships und Command in das App-Modul verschieben;
- Record-Index-Policies über den Host registrieren;
- direkte ListView-Imports aus Core-UI-Pfaden entfernen;
- 1:1 E2E- und Visual-Parity herstellen.

**Exit-Kriterium:** Alle funktionalen und visuellen Paritätstests bestehen.

### Phase 4: Bestandsmigration

- Eigentums-Backfill und App-Installation für bestehende Workspaces implementieren;
- Dry-Run, Datenintegritätsprüfung und Rollback-Prozedur bereitstellen;
- produktionsnahen Snapshot migrieren.

**Exit-Kriterium:** Vorher-/Nachher-Counts, IDs und Nutzerabläufe stimmen vollständig überein.

### Phase 5: Upgrade-Härtung und Partnerpilot

- CI-Kompatibilitätsmatrix aktivieren;
- mindestens ein echtes Twenty-Upgrade testen;
- Runbook mit einem Partner durchspielen;
- Fehlerbehandlung und Telemetrie prüfen.

**Exit-Kriterium:** Der Pilotpartner aktualisiert Twenty und ListView ohne manuelle Merge-Konflikte oder Datenreparatur.

### Phase 6: Upstream und Distribution

- generische Host-Erweiterungen upstream einreichen;
- nach Annahme Fork-spezifische Patches entfernen;
- App als separat versioniertes Installationsartefakt veröffentlichen.

**Exit-Kriterium:** Eine unterstützte Standard-Twenty-Version akzeptiert die App ohne kundenspezifischen Core-Patch.

## 18. Definition of Done

Die Extraktion ist erst abgeschlossen, wenn alle folgenden Punkte erfüllt sind:

- [ ] Die ListView App besitzt stabile Identität, Version und Capability-Anforderung.
- [ ] Alle ListView-spezifischen UI- und Serverregistrierungen werden ausschließlich bei installierter App aktiv.
- [ ] Der generische Twenty-Core importiert keine ListView-Fachmodule.
- [ ] Bestehende Listen wurden ohne Änderung ihrer IDs und Inhalte übernommen.
- [ ] People- und Company-Listen funktionieren vollständig.
- [ ] Alle in Abschnitt 10 beschriebenen Abläufe bestehen als automatisierte Tests.
- [ ] Kein technischer `New <list> entry`-Button oder gleichwertiger Command ist verfügbar.
- [ ] Visuelle Referenztests bestätigen die 1:1-Parität.
- [ ] Deaktivieren und Reaktivieren ist verlustfrei.
- [ ] Standard-Uninstall ist nicht destruktiv.
- [ ] Mindestens ein Upgrade von einer unterstützten Twenty-Version wurde erfolgreich getestet.
- [ ] Kompatibilitätsmatrix und Partner-Runbook sind veröffentlicht.
- [ ] Alle verbleibenden Core-Änderungen sind generisch und als Upstream-Patches isoliert.
- [ ] Die Einschränkungen „nur People/Companies“, „keine neue Entry-Semantik“ und „kein neues Berechtigungsmodell“ wurden nicht versehentlich erweitert.

## 19. Hauptrisiken und Gegenmaßnahmen

| Risiko | Auswirkung | Gegenmaßnahme |
| --- | --- | --- |
| App SDK unterstützt native Integration nicht | Keine echte 1:1-Parität | Generischer Native App Host als explizite Voraussetzung |
| Host bleibt dauerhaft im privaten Fork | Partnerupdates bleiben konfliktanfällig | Kleine allgemeine Contracts, zweite Test-App, frühe Upstream-PRs |
| Private Core-Imports in der App | Bruch bei jedem Twenty-Update | Public Contracts, Dependency-Lint und Compatibility CI |
| Datenverlust bei Ownership-Migration | Kritischer Produktionsschaden | In-place-Migration, Dry-Run, Backup, Count-/ID-Prüfung, nicht destruktiver Rollback |
| Doppelte UI-Registrierung während Rollout | Zwei Buttons/Sections/Commands | atomarer Umschaltpunkt und Tests auf exakt eine Registrierung |
| Schema-/Cache-Drift | UI sieht Felder oder Views nicht | standardisierter Cache-Rebuild und Integrationstests |
| Teilweise kompatible App-Version | schwer diagnostizierbare Laufzeitfehler | harte Capability-Prüfung vor Installation/Upgrade |
| „App“ bleibt nur ein Feature Flag im Core | keine echte Wartungsentkopplung | Definition of Done verlangt getrennte Verantwortung und keine Core-Fachimports |

## 20. Vor Umsetzungsstart festzulegende Produktentscheidungen

### 20.1 Entscheidung zur späteren Installation auf einer anderen Twenty-Instanz

Produktentscheidung vom 26. September 2026: Für die Installation der Lists-App auf einer anderen Twenty-Instanz müssen **nur die Funktionen und der App-Code** übertragen werden. Ein Transfer der Listen-, Entry-, Kontakt- oder sonstigen Workspace-Daten aus der Entwicklungsinstanz ist nicht erforderlich und kein Abnahmekriterium. Die App muss auf der Zielinstanz mit deren eigenen Daten nutzbar sein.

Diese Entscheidung betrifft den Wechsel zwischen Twenty-Instanzen. Die Anforderungen in §3 und §12.2 zur verlustfreien In-place-Übernahme bestehender ListView-Daten innerhalb derselben Workspace-/Datenbankinstallation bleiben bestehen, sofern eine solche Core-zu-App-Umstellung tatsächlich ausgeführt wird.

Diese Entscheidungen verändern nicht den funktionalen Umfang, müssen aber vor dem ersten veröffentlichbaren App-Release dokumentiert werden:

1. finaler App-Name und stabiler `universalIdentifier`;
2. initial unterstützte Twenty-Versionen;
3. Distributionskanal: zunächst `internal`, direkt `public` oder private Partner-Registry;
4. Verantwortlicher für Native-Host-Upstream-PRs;
5. Aufbewahrungsfrist für Daten nach einem nicht destruktiven Uninstall;
6. Support- und Rollback-Zeitraum pro App-Version.

Empfehlung: Entwicklung zunächst als First-Party-App im Monorepo, Distribution nach erfolgreichem Partnerpilot über eine private Partner-Registry und Veröffentlichung als `public` App erst nach Annahme oder stabiler Verfügbarkeit des Native App Hosts.

## 21. Referenzen

- [Twenty Apps Quick Start](https://docs.twenty.com/developers/extend/apps/getting-started/quick-start)
- [Twenty Apps Concepts](https://docs.twenty.com/developers/extend/apps/getting-started/concepts)
- [Front Components](https://docs.twenty.com/developers/extend/apps/layout/front-components)
- [Page Layouts](https://docs.twenty.com/developers/extend/apps/layout/page-layouts)
- [Navigation Menu Items](https://docs.twenty.com/developers/extend/apps/layout/navigation-menu-items)
- [Views](https://docs.twenty.com/developers/extend/apps/layout/views)
- [Logic Functions](https://docs.twenty.com/developers/extend/apps/logic/logic-functions)
- Aktuelle Implementierung unter `packages/twenty-front/src/modules/record-list/`
- Aktuelle Seite unter `packages/twenty-front/src/pages/record-list/RecordListPage.tsx`
- Aktuelle Serverdomäne unter `packages/twenty-server/src/engine/metadata-modules/record-list/`
