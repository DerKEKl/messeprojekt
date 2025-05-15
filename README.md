# Project "Messestand"
11B391 LF7+8

## Raspberry Pi Sensor-Monitoring-System

### Beschreibung

Ein Sensorüberwachungssystem auf dem Raspberry Pi zur Erfassung und Bereitstellung folgender Daten:

* Temperatur und Luftfeuchtigkeit (DHT22)
* RGB-Farbwerte per Kamera
* Lüftersteuerung (automatisch und manuell)
* Sichere Datenübertragung via OPC UA und TCP/IP

### Hardware

* Raspberry Pi (3B+ oder neuer empfohlen)
* DHT22-Temperatur- und Feuchtigkeitssensor
* Raspberry Pi Kamera oder USB-Webcam
* Optional: Lüfter (z. B. 5V PWM) am GPIO

### Voraussetzungen

* Raspberry Pi OS mit Python 3.11.7 empfohlen
* Abhängigkeiten (z. B. `picamera2`, `adafruit_dht`, `RPi.GPIO`, `opcua`, `numpy`, `Pillow`)

### Installation

1. Systempakete installieren:

```bash
chmod a+x systempackets-install.sh
sudo sh systempackets-install.sh
```

2. Python-Umgebung und Abhängigkeiten:

```bash
python -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

2.1 Zertifikate erzeugen (optional, wenn nicht automatisch erzeugt):

```bash
mkdir certificates
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout certificates/server_key.pem \
  -out certificates/server_cert.pem \
  -days 1000
```

3. Verkabelung des DHT22:

* VCC → 3.3V (Pin 1)
* DATA → GPIO4 (Pin 7)
* GND → GND (Pin 6)

4. Optional: Lüfter an GPIO18 anschließen:

* * (VCC) → extern oder 5V
* Steuerleitung → GPIO18 (Pin 12)
* GND → Masse

## Nutzung

Starten des Servers:

```bash
python server.py
```

### Features

* **Sensorik**

  * Kontinuierliche Erfassung von Temperatur und Luftfeuchtigkeit
  * Farbwerterkennung (RGB + dominante Farbe) per Kamera oder simuliert
* **Lüftersteuerung**

  * Automatische Temperaturregelung (ab 27 °C)
  * Manueller Modus über OPC UA steuerbar
* **Kommunikation**

  * OPC UA Server mit sicherer Zertifikatsauthentifizierung
  * TCP/IP-Farbserver für externe Farbdatenabfragen (siehe Quellcode)
* **Sicherheit**

  * Verschlüsselte OPC UA-Verbindung (Basic256Sha256\_SignAndEncrypt)
  * Zertifikat- und schlüsselbasierte Authentifizierung

### Hinweise

* Kamera: `picamera2` wird bevorzugt genutzt, `Pillow` als Fallback.
* Die Farberkennung basiert auf HSV-Werten und erkennt: **Rot**, **Grün**, **Blau**, **Gelb**.
* Der Code ist modular aufgebaut (Sensor, Kamera, Lüfter, OPC UA, TCP).
* Zertifikate werden bei Bedarf automatisch erzeugt, wenn sie fehlen.
* Sicherstellen, dass Kamera- und GPIO-Zugriff im OS aktiviert sind (`raspi-config`).
