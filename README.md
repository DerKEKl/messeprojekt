# Projekt "Messestand"
11B391 LF7+8

# Raspberry Pi Sensor-Monitoring-System

## Beschreibung
Implementierung eines Sensor-Monitoring-Systems für den Raspberry Pi zur Erfassung und Überwachung von:
- Temperatur und Luftfeuchtigkeit (DHT22)
- RGB-Farbwerten (Kamera)
- Sichere Datenübertragung via OPC UA und TCP/IP

## Hardware
- Raspberry Pi (3B+ oder neuer)
- DHT22 Sensor
- Raspberry Pi Kamera / USB-Webcam

## Installation

1. System-Pakete installieren:

```bash
sudo apt-get update sudo apt-get install -y python3-pip python3-picamera2 libglib2.0-0
```

2. Python-Pakete installieren:

```bash
pip3 install -r requirements.txt
```

## Verkabelung
DHT22 Sensor:
- VCC → 3.3V (Pin 1)
- DATA → GPIO4 (Pin 7)
- GND → Ground (Pin 6)

## Start
```bash 
python3 main.py
```

## Funktionen
- Kontinuierliche Temperatur- und Feuchtigkeitsmessung
- RGB-Farbwerterkennung via Kamera
- OPC UA Server mit Zertifikaten
- TCP/IP-Schnittstelle für externe Kommunikation

## Sicherheit
- Verschlüsselte OPC UA Kommunikation
- Zertifikatsbasierte Authentifizierung
- Sichere TCP/IP-Verbindung
