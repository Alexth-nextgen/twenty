# Home Dashboard – Requirements

## 1. Zweck und Zielbild

Die Home-Funktion ist die persönliche Arbeits- und Steuerungszentrale im CRM. Sie soll jedem Teammitglied morgens und während der Woche sofort beantworten:

- Was ist heute wichtig?
- Welche Aufgaben, Termine und Follow-ups stehen an?
- Wie entwickelt sich meine Arbeit im gewählten Zeitraum?
- Welche Opportunities, Kampagnen oder Datensätze brauchen Aufmerksamkeit?
- Welchen Beitrag leiste ich zu den vereinbarten Zielen?

Für Partner und Führungskräfte soll die Home-Funktion zusätzlich eine faire Teamübersicht liefern:

- Wer arbeitet gerade woran?
- Wo gibt es Überlastung oder Blockaden?
- Welche Pipeline- oder Kampagnenrisiken gibt es?
- Wie entwickelt sich die operative Leistung des Teams?
- Wo ist ein Gespräch, eine Entscheidung oder Unterstützung notwendig?

Das Dashboard ist kein Ersatz für die CRM-Datenstruktur. Es ist eine konfigurierbare Auswertungs- und Aktionsschicht über den vorhandenen CRM-Objekten, Feldern, Beziehungen und Berechtigungen.

## 2. Nutzerrollen

### 2.1 Teammitglied

Ein Teammitglied kann:

- die persönliche Startansicht verwenden;
- persönliche Widgets hinzufügen, bearbeiten, ausblenden, löschen und sortieren;
- eigene Targets für persönliche Kennzahlen hinterlegen;
- zwischen persönlicher und – sofern berechtigt – Teamansicht wechseln;
- auf zugrunde liegende CRM-Datensätze klicken und direkt weiterarbeiten;
- den Zeitraum der Auswertung wählen;
- die Home-Funktion als Standard-Startseite oder die Inbox verwenden.

### 2.2 Partner / Führungskraft

Ein Partner oder eine Führungskraft kann zusätzlich:

- die Teamansicht öffnen;
- Team-Widgets konfigurieren;
- festlegen, welche Teamkennzahlen standardmäßig sichtbar sind;
- Teammitglieder, Owner, Stages, Status und Zeiträume vergleichen;
- operative Risiken und Unterstützungsbedarf erkennen;
- eine gemeinsame Teamansicht als Standard für berechtigte Nutzer definieren, sofern das Berechtigungsmodell dies erlaubt.

### 2.3 Administrator

Ein Administrator kann:

- Dashboard-Berechtigungen verwalten;
- zulässige Objekte und Felder über die normalen CRM-Berechtigungen steuern;
- globale Standard-Widgets oder Vorlagen definieren;
- Integrationen und Datenquellen konfigurieren;
- die spätere Persistenz der Benutzer- und Teampräferenzen verwalten.

## 3. Grundprinzipien

### 3.1 CRM als einzige Datenquelle

Das Home Dashboard verwendet die vorhandenen CRM-Daten. Es darf keine parallele lokale CRM-Datenstruktur für Opportunities, Tasks, Meetings, Kampagnen, Personen oder ähnliche Kernobjekte anlegen.

Für die lokale Entwicklungsphase dürfen Einstellungen im Browser gespeichert werden. Das Format muss jedoch so gestaltet sein, dass es später als persönliche oder teamweite CRM-Präferenz persistiert werden kann.

### 3.2 Metadatengetriebene Konfiguration

Objekte, Felder, Labels, Feldtypen, Select-Optionen, Beziehungen und Berechtigungen werden aus den aktuellen CRM-Metadaten gelesen.

Wenn im echten CRM ein Feld umbenannt, hinzugefügt, deaktiviert oder gelöscht wird, muss das Dashboard die Auswahl und Darstellung entsprechend aktualisieren.

### 3.3 Keine erfundenen Kennzahlen

Das Dashboard darf nur Kennzahlen anzeigen, deren Quelle, Berechnung und Population nachvollziehbar sind.

Jede Kennzahl muss klar unterscheiden zwischen:

- Ist-Wert;
- Zielwert;
- Vergleichswert;
- abgeleitetem Signal;
- fehlenden oder nicht verfügbaren Daten.

### 3.4 Keine ungerechte Rangliste

Die Teamansicht ist keine einfache Bestenliste. Unterschiede zwischen Rollen, Verantwortungsbereichen, Arbeitsvolumen und Datenabdeckung müssen berücksichtigt werden.

Standardmäßig werden operative Signale wie „überfällige Tasks“, „überlastet“, „keine Aktivität“ oder „Abschlussdatum überschritten“ gezeigt. Eine Rangfolge darf nur verwendet werden, wenn sie für die konkrete Kennzahl sinnvoll und fair ist.

## 4. Seitenstruktur

Die Home-Seite besteht aus folgenden Bereichen:

1. Kopfbereich mit Begrüßung und Schnellaktionen
2. KI-Chat als optionaler Arbeitsbereich
3. Bereich „Wichtig heute“
4. Dashboard-Kopf mit Zeitraum- und Ansichtssteuerung
5. Konfigurierbare persönliche oder teamweite Widgets
6. Standardbereiche wie Tasks, Meetings, Kampagnen und Pipeline
7. Optionale Schnellzugriffe und zuletzt verwendete Ansichten
8. Einstellungsbereich für Dashboard, Widgets und Targets

Die Bereiche müssen unabhängig voneinander leer, geladen oder fehlerhaft sein können. Ein fehlender Datenbereich darf nicht die gesamte Home-Seite unbrauchbar machen.

## 5. Kopfbereich

### 5.1 Begrüßung

Der Kopfbereich zeigt den Namen des aktuell angemeldeten Teammitglieds.

Zusätzlich werden kurze, aktuelle Hinweise angezeigt, zum Beispiel:

- Anzahl überfälliger Tasks;
- Anzahl Meetings am heutigen Tag;
- optional Anzahl kritischer Pipeline- oder Kampagnensignale.

Die Hinweise müssen aus den aktuell geladenen Daten stammen und dürfen nicht als statischer Beispieltext erscheinen.

### 5.2 Schnellaktionen

Der Kopfbereich kann Schnellaktionen enthalten für:

- neuen Datensatz anlegen;
- neue Task anlegen;
- Workflow öffnen;
- KI-Chat öffnen;
- Dashboard-Einstellungen öffnen.

## 6. Bereich „Wichtig heute“

Der Bereich zeigt eine priorisierte, klickbare Aktionsliste.

### 6.1 Zulässige Signale

Mindestens folgende Signale müssen unterstützt werden:

- überfällige Tasks;
- heute fällige Tasks;
- heutige Meetings;
- Kampagnen mit Fehlern, Bounces oder Beschwerden;
- Opportunities mit überschrittenem Close Date;
- Opportunities ohne Aktualisierung über dem konfigurierten Schwellenwert;
- fehlende Owner oder fehlende Pflichtinformationen, sofern die Datenquelle dies unterstützt.

### 6.2 Priorisierung

Die Priorisierung erfolgt nachvollziehbar. Kritische oder zeitlich überfällige Signale stehen vor rein informativen Hinweisen.

Jede Zeile enthält:

- Symbol oder Statusfarbe;
- verständlichen Titel;
- kurze Begründung;
- direkten Link zum CRM-Datensatz.

### 6.3 Leerzustand

Wenn keine Signale vorliegen, wird ein positiver, aber sachlicher Leerzustand angezeigt, zum Beispiel „Alles Wichtige ist auf Kurs.“

## 7. Dashboard-Steuerung

### 7.1 Ansichten

Das Dashboard unterstützt mindestens:

- „Für mich“: persönliche Kennzahlen und persönliche Arbeitslast;
- „Team“: Teamkennzahlen und Teamarbeitslast.

Die Teamansicht ist nur sichtbar, wenn der Nutzer die erforderliche Berechtigung besitzt.

### 7.2 Zeiträume

Mindestens folgende Zeiträume werden unterstützt:

- aktuelle Woche;
- aktueller Monat.

Die Architektur muss später erweiterbar sein für:

- aktuelles Quartal;
- letzte 7, 30 oder 90 Tage;
- frei definierte Zeiträume;
- Vergleich mit vorherigem gleich langen Zeitraum.

Beim Wechsel des Zeitraums müssen alle betroffenen KPIs, Widgets, Zielwerte, Vergleiche und Tabellen konsistent neu berechnet werden.

### 7.3 Datenstatus

Das Dashboard zeigt:

- ob Daten aktuell geladen werden;
- aus welcher Quelle die Daten stammen;
- welchen Zeitraum die Zahlen abdecken;
- ob Daten fehlen oder nur keine Datensätze vorhanden sind.

## 8. Konfigurierbare Widgets

### 8.1 Widget hinzufügen

Im Bereich „Dashboard settings“ gibt es eine Aktion „Widget hinzufügen“.

Beim Anlegen werden nacheinander ausgewählt:

1. CRM-Objekt;
2. Feld oder Kennzahlbasis;
3. Auswertungsart;
4. Zeitraum oder Datumsfeld;
5. Filter und Scope;
6. Anzeigename;
7. optionaler Zielwert;
8. Darstellungsform.

### 8.2 Objekt-Auswahl

Die Objekt-Auswahl wird aus den lesbaren, aktiven CRM-Objekten erzeugt.

Objekte ohne Leseberechtigung dürfen nicht angeboten werden. Gelöschte oder deaktivierte Objekte müssen aus bestehenden Widget-Konfigurationen als „nicht verfügbar“ markiert werden, statt stillschweigend auf ein anderes Objekt zu zeigen.

### 8.3 Feld-Auswahl

Die Feld-Auswahl wird aus den Feldern des ausgewählten Objekts erzeugt.

Die Auswahl berücksichtigt:

- Feldtyp;
- Leseberechtigung;
- Aktivierungsstatus;
- Aggregierbarkeit;
- Beziehungstyp;
- vorhandene Select-Optionen;
- Verwendbarkeit als Datums-, Owner- oder Gruppierungsfeld.

Freitextfelder dürfen nicht automatisch als Summe oder Durchschnitt angeboten werden. Sie können jedoch für Tabellen, Filter oder Gruppierungen relevant sein.

### 8.4 Auswertungsarten

Die unterstützten Auswertungsarten richten sich nach dem Feldtyp.

#### Allgemein

- Anzahl Datensätze;
- Anzahl Datensätze mit befülltem Feld;
- Anteil befüllter Datensätze;
- Anzahl nach Filter.

#### Zahlen- und Währungsfelder

- Summe;
- Durchschnitt;
- Minimum;
- Maximum.

Währungen mit unterschiedlichen Currency Codes dürfen nicht ungeprüft addiert werden. Sie müssen getrennt dargestellt oder sauber umgerechnet werden, sofern eine autorisierte Wechselkursquelle vorhanden ist.

#### Select- und Statusfelder

- Verteilung nach Option;
- Anzahl je Stage oder Status;
- Anteil je Option.

#### Datumsfelder

- Anzahl im Zeitraum;
- überfällige Datensätze;
- Datensätze ohne Datum;
- Zeitverlauf nach Tag, Woche oder Monat.

#### Boolean-Felder

- Anzahl wahr;
- Anzahl falsch;
- Anteil wahr.

### 8.5 Scope und Filter

Jedes Widget besitzt einen klaren Scope:

- eigene Datensätze;
- alle Teamdatensätze;
- bestimmter Owner;
- bestimmte Stage oder Status;
- frei konfigurierter CRM-Filter, soweit das vorhandene CRM dies unterstützt.

Filter müssen mit der Kennzahl, der Visualisierung und den zugrunde liegenden Datensätzen übereinstimmen.

### 8.6 Widget-Darstellungen

Mindestens folgende Darstellungen werden unterstützt:

- KPI-Karte;
- Liste der wichtigsten Datensätze;
- horizontale Balkenverteilung;
- Zeitverlauf;
- Pipeline- oder Stage-Verteilung;
- kompakte Tabelle.

Die Darstellung wird abhängig von Kennzahl und Feldtyp vorgeschlagen. Nutzer können nur Darstellungen auswählen, die für die Kennzahl sinnvoll sind.

### 8.7 Widget-Bearbeitung

Ein bestehendes Widget kann geändert werden in:

- Name;
- Objekt;
- Feld;
- Auswertungsart;
- Scope;
- Filter;
- Zeitraum;
- Zielwert;
- Darstellung.

Wenn eine gespeicherte Konfiguration nach einer CRM-Änderung nicht mehr gültig ist, wird sie sichtbar als „Konfiguration benötigt Aktualisierung“ markiert.

### 8.8 Widget-Reihenfolge und Sichtbarkeit

Nutzer können Widgets:

- verschieben;
- ausblenden;
- wieder einblenden;
- löschen;
- auf Standard zurücksetzen.

Die Reihenfolge ist je Nutzer und Ansicht getrennt speicherbar. Persönliche Änderungen dürfen nicht ungefragt die gemeinsame Teamansicht verändern.

## 9. Targets und Zielwerte

### 9.1 Persönliche Targets

Persönliche Targets können mindestens für folgende Kennzahlen gesetzt werden:

- Meetings pro Woche oder Monat;
- maximale Anzahl offener Tasks;
- Kampagnen-Zustellrate;
- frei konfigurierbare Widget-Kennzahlen, sofern die Einheit kompatibel ist.

### 9.2 Team-Targets

Partner können für Team-Widgets eigene Zielwerte setzen. Ein Teamziel muss klar gekennzeichnet sein und darf nicht automatisch als individuelles Mitarbeiterziel interpretiert werden.

### 9.3 Zielwert-Darstellung

Ein Zielwert zeigt:

- aktuellen Ist-Wert;
- Zielwert;
- Fortschritt oder Abstand;
- semantischen Status.

Ziele ohne belastbare historische Basis werden als vorläufige Arbeitsziele behandelt. Das Dashboard darf keine scheinbar objektiven Benchmarks erfinden.

### 9.4 Zielwert-Validierung

- Zahlen müssen positiv und plausibel sein;
- Prozentwerte liegen zwischen 0 und 100;
- Währungsziele benötigen einen Currency Code;
- bei inkompatiblen Einheiten darf kein Fortschrittsbalken angezeigt werden.

## 10. Persönliche Standardbereiche

### 10.1 Aufgaben

Der Aufgabenbereich zeigt:

- offene persönliche Tasks;
- Fälligkeit;
- Status;
- Überfälligkeit;
- Link zum Datensatz;
- „Alle anzeigen“.

### 10.2 Meetings

Der Meetingbereich zeigt:

- heutige Meetings;
- Startzeit und Endzeit, sofern vorhanden;
- ganztägige Termine;
- abgesagte Termine nicht als aktive Meetings;
- Teilnehmerbezug zum aktuellen Teammitglied.

Meeting-Kategorien dürfen in der lokalen Version nicht durch eine neue eigene CRM-Datenstruktur erzwungen werden. Solange das echte CRM keine saubere Kategorie liefert, muss eine titelbasierte Erkennung als vorläufig und fehleranfällig behandelt werden.

### 10.3 Pipeline

Die persönliche Pipeline zeigt mindestens:

- offene Opportunities des aktuellen Owners;
- Pipeline-Wert je Currency Code;
- Stage-Verteilung;
- Opportunities mit Close Date im Zeitraum;
- Opportunities ohne aktuelle Aktivität;
- Opportunities mit überschrittenem Close Date;
- direkte Links zu den Opportunities.

Die Stage-Liste wird aus der CRM-Metadatenkonfiguration erzeugt. Zusätzliche oder umbenannte Stages müssen ohne Codeänderung erscheinen.

### 10.4 Kampagnen

Die persönliche Kampagnenansicht zeigt, sofern Daten vorhanden sind:

- Status;
- gesendete Anzahl;
- zugestellte Anzahl;
- fehlgeschlagene Anzahl;
- Bounces;
- Beschwerden;
- übersprungene Empfänger;
- berechnete Zustellrate.

Raten werden aus Zählerwerten berechnet und nicht als Durchschnitt einzelner Raten aggregiert.

## 11. Teamansicht „Team Pulse“

### 11.1 Vollständigkeit

Die Teamansicht berücksichtigt alle aktiven Teammitglieder mit entsprechender Berechtigung, auch wenn sie aktuell keine offenen Tasks oder Opportunities haben.

### 11.2 Standardspalten

Die Standardansicht kann folgende Spalten enthalten:

- Teammitglied und Rolle;
- offene Tasks;
- überfällige Tasks;
- Meetings im gewählten Zeitraum;
- offene Pipeline und Pipeline-Wert;
- Opportunities mit überschrittenem Close Date;
- Opportunities ohne aktuelle Aktivität;
- laufende Kampagnen, sofern Owner-Daten verfügbar sind;
- Status „Auf Kurs“, „Aufmerksamkeit nötig“ oder „Überlastet“.

### 11.3 Aufmerksamkeitssignale

Der Status wird aus sichtbaren Signalen abgeleitet. Beispielsweise:

- mindestens ein überfälliger Task;
- offene Opportunities mit überschrittenem Close Date;
- Opportunities ohne Aktualisierung über dem Schwellenwert;
- offene Tasks über dem persönlichen oder teamweiten Belastungslimit.

Die Begründung muss im Detail sichtbar sein. Ein einzelner undurchsichtiger Performance-Score reicht nicht aus.

### 11.4 Teamkennzahlen

Die Team-KPI-Zeile kann enthalten:

- Anzahl aktiver Teammitglieder;
- Anzahl Personen mit Aufmerksamkeitssignal;
- offene Team-Pipeline;
- offene Opportunities;
- Teamaufgaben;
- laufende Kampagnen;
- aggregierte Kampagnenzustellrate.

Kennzahlen müssen ihre Population und ihren Zeitraum erklären.

### 11.5 Drill-down

Von jeder Teamkennzahl muss ein sinnvoller nächster Schritt möglich sein:

- CRM-Datensatz öffnen;
- passende Aufgabenliste öffnen;
- Opportunities nach Owner öffnen;
- Kampagnen mit Fehlern öffnen;
- Teammitglied im CRM öffnen, sofern dafür ein zulässiger Link existiert.

## 12. KI-Chat auf der Home-Seite

Der KI-Chat wird als eigener optionaler Bereich oberhalb des Dashboards angezeigt.

Er soll kontextbezogene Fragen ermöglichen, zum Beispiel:

- „Was ist heute für mich wichtig?“
- „Welche Opportunities brauchen ein Update?“
- „Wie steht das Team diese Woche da?“
- „Welche Kampagnen haben Fehler?“

Der Chat darf nur Daten verwenden, die der aktuelle Nutzer aufgrund seiner Berechtigungen sehen darf. Wenn keine KI-Konfiguration vorhanden ist, wird ein klarer Zustand angezeigt und das restliche Dashboard bleibt funktionsfähig.

## 13. Einstellungen und Persistenz

### 13.1 Lokale Entwicklungsphase

In der lokalen Version dürfen folgende Einstellungen in der Browser-Persistenz gespeichert werden:

- persönliche Widget-Konfiguration;
- Widget-Reihenfolge;
- Sichtbarkeit;
- persönliche Targets;
- Standardansicht;
- Standardzeitraum;
- Startseite.

Die lokale Speicherung darf keine CRM-Datensätze duplizieren.

### 13.2 Anbindung an das echte CRM

Für die spätere produktive Version wird ein persistentes Präferenzmodell benötigt, zum Beispiel als Benutzer- oder Workspace-Präferenz.

Die Konfiguration sollte mindestens enthalten:

```json
{
  "view": "personal",
  "period": "week",
  "widgets": [
    {
      "id": "widget-1",
      "objectNameSingular": "opportunity",
      "fieldName": "amount",
      "aggregation": "sum",
      "scope": "owned",
      "filters": [],
      "dateFieldName": "closeDate",
      "title": "Meine Pipeline",
      "target": null,
      "displayType": "kpi"
    }
  ]
}
```

Das konkrete Backend-Feld oder der konkrete API-Endpunkt wird erst mit der echten CRM-Datenstruktur festgelegt.

### 13.3 Gemeinsame Teamkonfiguration

Persönliche und gemeinsame Teamkonfigurationen müssen getrennt gespeichert werden. Die Berechtigungslogik muss verhindern, dass ein Nutzer ohne Partner- oder Admin-Rechte die Standard-Teamansicht verändert.

## 14. Berechtigungen und Datenschutz

- Objektberechtigungen werden vor jeder Widget-Auswahl geprüft.
- Feldberechtigungen werden auch bei dynamischer Konfiguration geprüft.
- Teamkennzahlen dürfen keine Daten aus nicht sichtbaren Datensätzen ableiten.
- Persönliche Daten werden nicht über URLs oder ungeschützte lokale Quellen geteilt.
- Der KI-Chat erhält denselben Berechtigungsumfang wie der Nutzer.
- Nicht verfügbare Daten werden als nicht verfügbar angezeigt, nicht als Null oder als erfundener Wert.

## 15. Lade-, Fehler- und Leerzustände

Jedes Widget benötigt mindestens folgende Zustände:

- lädt;
- erfolgreich mit Daten;
- erfolgreich mit null Datensätzen;
- Datenquelle nicht verfügbar;
- Berechtigung fehlt;
- Konfiguration ungültig;
- Fehler beim Laden.

Die Zustände müssen visuell und textlich unterscheidbar sein.

## 16. Performance und technische Anforderungen

- Widgets sollen gemeinsame Datenabfragen wiederverwenden.
- Identische Abfragen sollen innerhalb eines Dashboards nicht mehrfach ausgeführt werden.
- Große Teamtabellen benötigen Pagination, Virtualisierung oder eine begrenzte Darstellung mit „Mehr anzeigen“.
- Filter und Zeitraumänderungen dürfen nur betroffene Abfragen neu ausführen.
- Die Home-Seite muss auch bei leerer Kampagnen- oder Meeting-Datenlage schnell nutzbar bleiben.
- Benutzerkonfigurationen müssen gegen veraltete oder ungültige CRM-Metadaten validiert werden.
- Die Implementierung muss mit dem vorhandenen React-, Jotai-, Linaria- und Twenty-UI-Muster übereinstimmen.

## 17. Responsive Verhalten

### Desktop

- mehrspaltige KPI- und Widget-Anordnung;
- Team Pulse mit mehreren Kennzahlspalten;
- Pipeline-Karte mit sichtbaren Fokuszeilen;
- interne Scrollbereiche für lange Stage- oder Tabellenlisten.

### Mobile

- einspaltige Widget-Anordnung;
- horizontales Scrollen nur für wirklich breite Tabellen;
- keine abgeschnittenen Werte oder Statuslabels;
- wichtige Aktionen und Drill-downs bleiben erreichbar;
- KI-Chat und „Wichtig heute“ bleiben früh auf der Seite sichtbar.

## 18. Akzeptanzkriterien

### Persönliche Nutzung

- Ein Nutzer sieht seine persönlichen Tasks, Meetings, Pipeline- und Kampagnensignale.
- Ein Nutzer kann den Zeitraum zwischen Woche und Monat wechseln.
- Ein Nutzer kann persönliche Targets setzen und ändern.
- Ein Nutzer kann eigene Widgets hinzufügen und löschen.
- Ein Nutzer kann Objekt, Feld, Auswertung, Name und Target eines Widgets ändern.
- Widget-Konfigurationen bleiben nach einem Reload erhalten.
- Jede Widget-Karte zeigt Quelle, Kennzahl und Zeitraum verständlich an.

### Teamnutzung

- Ein berechtigter Partner kann die Teamansicht öffnen.
- Die Teamansicht enthält auch Teammitglieder ohne offene Tasks.
- Überfällige Tasks, überlastete Arbeitslast und Pipeline-Risiken sind sichtbar.
- Die Teamansicht zeigt keine undurchsichtige Gesamtbewertung ohne Begründung.
- Teammitglieder können nach relevanten Signalen verglichen werden.
- Datensätze und Listen sind per Drill-down erreichbar.

### Metadaten und CRM-Anbindung

- Neue lesbare CRM-Felder können für passende Widget-Typen angeboten werden.
- Stage- und Statusoptionen werden nicht hartcodiert.
- Deaktivierte oder nicht berechtigte Felder erscheinen nicht als gültige Auswahl.
- Unterschiedliche Währungen werden nicht unzulässig addiert.
- Die Home-Funktion legt keine lokalen CRM-Duplikate an.

### Qualität

- Lade-, Leer- und Fehlerzustände sind unterscheidbar.
- Es gibt keine Laufzeitfehler bei leerer Datenlage.
- Typprüfung und Linting sind erfolgreich.
- Persönliche, Team- und Einstellungsinteraktionen sind im Browser geprüft.
- Desktop- und schmale Darstellung sind auf Überläufe und abgeschnittene Inhalte geprüft.

## 19. Nicht Bestandteil der lokalen ersten Version

Folgende Themen bleiben bewusst für die produktive CRM-Anbindung oder eine spätere Phase offen:

- eine neue lokale CRM-Datenbank oder parallele Datenstruktur;
- vollständige historische Stage-Wechsel und Conversion-Raten, sofern das CRM keine Historie liefert;
- automatische Meeting-Klassifikation ohne belastbare CRM-Kategorie;
- globale Zielvorgaben ohne abgestimmte historische Basis;
- Team-Rankings oder Vergütungslogik;
- Notion-Anbindung;
- neue CRM-Objekte oder Felder, die noch nicht im echten CRM existieren;
- externe Wechselkurs- oder Marketingdatenquellen ohne autorisierte Integration.

## 20. Empfohlene Umsetzungsphasen

### Phase 1 – Lokale Grundlage

- persönliche und Teamansicht;
- vorhandene Standarddatenquellen;
- persönliche Targets;
- konfigurierbare Widgets für unterstützte Feldtypen;
- lokale Persistenz;
- Lade-, Fehler- und Leerzustände.

### Phase 2 – Dynamische CRM-Felder

- vollständige Metadaten-Auswahl;
- dynamische Record-Abfragen;
- Feldtyp- und Aggregationsregeln;
- dynamische Filter und Datumsfelder;
- Invalidierungs- und Migrationslogik für alte Widget-Konfigurationen.

### Phase 3 – Produktive Persistenz

- Speicherung in Benutzerpräferenzen des echten CRM;
- gemeinsame Teamkonfiguration;
- Rollen- und Berechtigungsschutz;
- Synchronisierung über Geräte und Browser.

### Phase 4 – Erweiterte Analyse

- historische Vergleiche;
- Stage- und Statusverläufe;
- Drill-down in zugrunde liegende Datensätze;
- gespeicherte Ansichten und Dashboard-Vorlagen;
- optional Notion- und weitere Datenquellen.

## 21. Offene Entscheidungen vor der produktiven Anbindung

Vor dem Anschluss an das echte CRM müssen folgende Punkte abgestimmt werden:

- Wo werden persönliche Dashboard-Präferenzen gespeichert?
- Wo wird eine gemeinsame Teamkonfiguration gespeichert?
- Welche Rollen dürfen Team-Dashboards bearbeiten?
- Welche CRM-Objekte und Felder dürfen als KPI verwendet werden?
- Welche Felder gelten als sensible oder nicht teamweit sichtbare Daten?
- Welche historischen Daten sind tatsächlich verfügbar?
- Welche Ziele sind verbindlich und welche nur persönliche Arbeitsziele?
- Wie werden Währungen behandelt?
- Welche Kennzahlen sollen als Standard ausgeliefert werden?
- Welche Notion-Daten sollen später ergänzt werden?

