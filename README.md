# Projekt "Messestand" 11B381
Das Projekt „Messestand“ ist Teil unserer Lernfelder 7 und 8 und soll die im Unterricht vermittelten Technologien in einem praxisnahen Projekt anwenden.
Ziel ist es, Themen wie Industrie 4.0, NoSQL oder auch Scrum in diesem Projekt praktisch umzusetzen.

## Architektur
* `Datenbank:` Ein MongoDB-Cluster dient der Speicherung der Daten, durch das Cluster mit den einzelnen Replikasets kann eine hohe Verfügbarkeit erreicht werden
* `Backend:` Node.js zur Authentifizerung, Datenverwaltung & Kommunikation
* `Hardware-Controller` Python dient zur Steuerung des Roboters
* `Kommunikation` Für die Kommunikation nutzen wir verschiedene Protokolle, OPC UA, MQTT, TCP/IP & REST API
* `Web-Interface` Das Web-Interface dient sowohl zur Steuerung als auch zur Darstellung einzelner Daten, verwendet werden Tailwind CSS & Angular

## Setup
1. MongoDB Cluster [installieren](https://github.com/DerKEKl/messeprojekt/tree/127c5def0599ca07f45cda321155378ab021de59/mongodb-cluster) mittels Docker Compose
2. [OPCUA](https://github.com/DerKEKl/messeprojekt/tree/127c5def0599ca07f45cda321155378ab021de59/opcua)
3. Das [Backend](https://github.com/DerKEKl/messeprojekt/tree/127c5def0599ca07f45cda321155378ab021de59/backend) lässt sich ganz einfach installieren, benötigte Tools sind `git`, `nodejs`, `npm`
```
git clone https://github.com/DerKEKl/messeprojekt.git
cd messeprojekt/backend

npm install
node index.js
```
4. [MQTT](https://github.com/DerKEKl/messeprojekt/blob/f6bc465223dd4ce032be659f889f0c4bc36a275f/mqtt.md)

5. Folgen Sie der Anleitung oder laden Sie das NGINX-Archiv direkt aus dem Release-Bereich herunter:
[Frontend](https://github.com/DerKEKl/messeprojekt/blob/master/frontend/README.md)

Wenn du magst, kann ich den Stil noch weiter an dein restliches README anpassen (z. B. formeller, technischer oder moderner).


## Komponentenbeschreibung

**Backend (Node.js)**

`index.js:` Einstiegspunkt, konfiguriert Middleware, Datenbankverbindung und startet den HTTP-Server

`controllers/authController.js:`   JWT-basierte Authentifizierung und Nutzermanagement

`controllers/costsController.js:`  Kostenberechnung

`controllers/partsController.js:`  CRUD-Endpunkte für Bauteile

`controllers/robotController.js:`  Steuerungs für den Roboter

## Hardware-Controller (Python)

`controllers/fan_controller.py:` Ansteuerung der Lüfter per GPIO

`controllers/led_controller.py:` Steuerung der LED

`sensors/temperature_sensor.py:` Abfrage und Kalibrierung des Temperatursensors

`sensors/image_processor.py:` Farberkennung

`servers/opcua_server.py:` Veröffentlicht Sensordaten über OPC UA

`servers/tcp_server.py:` Bietet ein einfaches TCP-Protokoll für Kommandos an
