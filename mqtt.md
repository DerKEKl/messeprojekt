# Installation Mosquitto MQTT

## Paketliste aktualisieren & Pakete installieren
```
sudo apt-get update
sudo apt-get install curl gnupg2 wget git apt-transport-https ca-certificates -y
```
## Mosquitto Repository hinzufügen
```
sudo add-apt-repository ppa:mosquitto-dev/mosquitto-ppa -y
```
## Mosquitto und Clients installieren
```
sudo apt install mosquitto mosquitto-clients -y
```
## Status von Mosquitto überprüfen
```
sudo systemctl status mosquitto
```
