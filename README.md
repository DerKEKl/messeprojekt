# Projekt "Messestand" - Frontend Dokumentation

**11B381 LF7+8**

## Projektübersicht

Das Messeprojekt ist ein modernes Angular Dashboard für die Visualisierung und Verwaltung von Produktionsdaten mit Live-MQTT-Integration, Energiekosten-Tracking und Robotersteuerung. Das Frontend wurde mit Angular CLI Version 20.0.3 entwickelt und bietet eine vollständige Benutzeroberfläche für industrielle Messeanwendungen.

## Technologie-Stack

### Frontend-Technologien
- **Angular 20** - Moderne Standalone Components Architektur
- **Tailwind CSS** - Utility-First CSS Framework für responsives Design
- **FontAwesome Icons** - Umfangreiche Icon-Bibliothek für bessere UX
- **TypeScript** - Typsichere Entwicklung
- **RxJS** - Reactive Programming für Datenstreams

### Zusätzliche Bibliotheken
- **ngx-mqtt** - MQTT Client für Live-Datenübertragung
- **Angular Reactive Forms** - Formular-Validierung und -Verwaltung
- **Angular Router** - Navigation und Routing
- **Angular HTTP Client** - API-Kommunikation

## Projektstruktur

```
src/
├── app/
│   ├── components/           # Angular Komponenten
│   │   ├── dashboard/        # Haupt-Dashboard
│   │   ├── login/           # Authentifizierung
│   │   ├── navigation/      # Navigation
│   │   ├── messdaten-liste/ # Messdaten-Verwaltung
│   │   ├── energiekosten/   # Energiekosten-Tracking
│   │   ├── statistics/      # Statistiken & Reports
│   │   └── parts-management/ # Bauteile-Verwaltung
│   ├── services/            # Angular Services
│   │   ├── auth.service.ts  # Authentifizierung
│   │   ├── mqtt-client.service.ts # MQTT Integration
│   │   ├── parts.service.ts # Bauteile-API
│   │   ├── robot.service.ts # Robotersteuerung
│   │   └── theme.service.ts # Dark/Light Mode
│   ├── models/              # TypeScript Interfaces
│   ├── guards/              # Route Guards
│   └── interceptors/        # HTTP Interceptors
├── environments/            # Umgebungskonfiguration
└── assets/                 # Statische Ressourcen
```

## Installation und Setup

### Voraussetzungen
- **Node.js** Version v24.2.0 (LTS empfohlen)
- **npm** Package Manager v11.3.0
- **Angular CLI** Global installiert

### Installation


```bash
# Repository klonen
git clone https://github.com/DerKEKl/messeprojekt
git checkout frontend
cd messeprojekt

# Dependencies installieren
npm install

# Zusätzliche Pakete für optimale Performance
npm install --save-dev msgpackr lmdb
```

### Umgebungskonfiguration
**Wichtig:** Navigieren Sie zu `src/environments` und benennen Sie die Datei von `environment_template.ts` zu `environment.ts` um und tragen Sie die korrekten Daten ein!

### Entwicklungsserver starten

```bash
npm run server
```

Der Entwicklungsserver startet auf `http://localhost:4200/`. Die Anwendung lädt automatisch neu, wenn Quelldateien geändert werden.

### Alternative Entwicklungscommands
```bash
# Standard Angular CLI
ng serve

# Mit spezifischem Port
ng serve --port 4200

# Mit Netzwerkzugriff
ng serve --host 0.0.0.0

# Mit SSL
ng serve --ssl
```

## Build und Deployment

### Production Build
```bash
npm run build
# oder
ng build --configuration production
```

Die Build-Artefakte werden im `dist/` Verzeichnis gespeichert. Der Production Build optimiert die Anwendung für Performance und Geschwindigkeit.

### Build-Optimierungen
- **Tree Shaking** - Entfernung ungenutzten Codes
- **Minification** - Code-Komprimierung
- **Bundle Splitting** - Optimierte Lade-Performance
- **AOT Compilation** - Ahead-of-Time Kompilierung

## Hauptfunktionen

### 1. Dashboard
- **Live-Datenvisualisierung** mit MQTT-Integration
- **Roboterstatus-Monitoring** in Echtzeit
- **Temperatur- und Produktionsdaten** Live-Anzeige
- **Responsive Design** für alle Geräte

### 2. Authentifizierung
- **JWT Bearer Token** basierte Authentifizierung
- **Route Guards** für geschützte Bereiche
- **Automatische Token-Erneuerung**
- **Sichere Logout-Funktionalität**

### 3. Messdaten-Verwaltung
- **Such- und Filteroptionen** für effiziente Datensuche
- **Sortierbare Tabellen** mit Pagination
- **Export-Funktionalitäten** für Berichte
- **Real-time Updates** über MQTT

### 4. Energiekosten-Tracking
- **Tages-, Wochen- und Monatsberichte**
- **Kostenvorhersage-Rechner** für Produktionsplanung
- **Energieverbrauch-Optimierung** mit Empfehlungen
- **Grafische Auswertungen** der Verbrauchsdaten

### 5. Bauteile-Management
- **CRUD-Operationen** für Produktionsbauteile
- **Farbkategorisierung** (Rot, Grün, Blau, Gelb)
- **Energieverbrauch-Tracking** pro Bauteil
- **Suchfunktionen** und Filter

### 6. Statistiken & Reports
- **Detaillierte Tagesberichte** mit Produktionsmetriken
- **Wochenübersichten** für Trend-Analysen
- **Farbverteilungs-Statistiken** der produzierten Teile
- **Export-Funktionen** für externe Auswertungen

## API-Integration

### Authentifizierung
```typescript
POST /api/auth/login
Body: { "username": "admin", "password": "password123" }
Response: { "token": "jwt-token" }
```

### Hauptendpunkte
- **GET /api/parts** - Alle Bauteile abrufen
- **POST /api/parts** - Neues Bauteil erstellen
- **GET /api/robot/start** - Roboter starten
- **GET /api/statistics/report/:date** - Tagesbericht
- **GET /api/costs/:date** - Energiekosten

### MQTT-Integration
- **Live-Temperatur**: `sensor/temperature`
- **Produktionsstatus**: `production/status`
- **Sensor-Daten**: `sensor/+` (Wildcard)

### Theme-Konfiguration
- **Dark/Light Mode** automatische Erkennung
- **Benutzer-Präferenzen** in localStorage
- **Smooth Transitions** zwischen Themes

### Linting
```bash
ng lint
ng lint --fix
```

## Performance-Optimierungen

### Build-Performance
- **Incremental Builds** für schnellere Entwicklung
- **JavaScript Cache** mit msgpackr/lmdb
- **Lazy Loading** für Feature-Module
- **OnPush Change Detection** für bessere Performance

### Runtime-Performance
- **Standalone Components** für kleinere Bundle-Größen
- **Signal-basierte Reaktivität** (Angular 20)
- **Optimized Images** und Assets
- **Service Worker** für Offline-Funktionalität (optional)

## Troubleshooting

### Häufige Probleme

#### MQTT Verbindungsprobleme
- **Firewall-Einstellungen** prüfen
- **MQTT Broker** Erreichbarkeit testen
- **WebSocket-Unterstützung** im Browser

#### Build-Fehler
```bash
# Cache leeren
ng build --delete-output-path
npm run build
```

## Lizenz und Mitwirkung

Das Projekt ist Teil des Lernfelds 7+8 (11B381) und dient als Demonstrationsprojekt für moderne Angular-Entwicklung mit industriellen IoT-Anwendungen. Weitere Informationen zur Angular CLI findest du in der offiziellen Dokumentation.

 https://github.com/angular/angular-cli
