# Project "Messestand"
11B391 LF7+8

# Raspberry Pi Sensor-Monitoring-System

## Description
Implementation of a sensor monitoring system on a Raspberry Pi for:
- Temperature and humidity (DHT22)
- RGB color values (camera)
- Secure data transfer via OPC UA and TCP/IP

## Hardware
- Raspberry Pi (3B+ or newer)
- DHT22 sensor
- Raspberry Pi camera or USB webcam

## Prerequisites
- Python 3.11.7 recommended

## Installation

1. System packages:

```bash 
sudo apt-get update 
sudo apt-get install -y python3-pip python3-picamera2 python3-rpi.gpio 
sudo apt-get install -y libgpiod2 
sudo apt-get install -y libpcap-dev
```

2. Python environment and requirements:

```bash 
python -m venv venv 
source venv/bin/activate 
pip install --upgrade pip 
pip install -r requirements.txt
```

3. Wiring for DHT22:
- VCC → 3.3V (Pin 1)
- DATA → GPIO4 (Pin 7)
- GND → Ground (Pin 6)

## Usage
```bash 
python SensorDataIntegrationApp.py
```

## Features
- Continuous measurement of temperature and humidity
- RGB color detection via camera
- OPC UA server with certificates
- TCP/IP interface for color data

## Security
- Encrypted OPC UA communication
- Certificate-based authentication
- Secure TCP/IP connection

## Notes
- The code is split into separate classes for temperature/humidity sensing, image processing, TCP color server, and OPC UA server.
- Certificates for OPC UA can be generated with OpenSSL or created automatically when missing.
- Ensure correct permissions and camera settings on the Raspberry Pi for the camera module or USB webcam.