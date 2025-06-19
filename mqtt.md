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
sudo apt update
sudo apt install mosquitto mosquitto-clients -y
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```
## Status von Mosquitto überprüfen
```
sudo systemctl status mosquitto
```
## Verzeichnisse anlegen
```
sudo mkdir -p /etc/mosquitto/log /etc/mosquitto/config
sudo touch /etc/mosquitto/log/mosquitto.log
```
## Benutzername & Passwort vergeben
```
sudo mosquitto_passwd -c /etc/mosquitto/config/pwfile <mqtt-benutzername>
```
## Berechtigungen ändern
```
chown mosquitto:mosquitto /etc/mosquitto/config/pwfile
```
## Mosquitto.conf öffnen & folgende Parameter ändern
```
nano /etc/mosquitto/mosquitto.conf
```
```
# nano /etc/mosquitto/mosquitto.conf

# Listen on port 1883
listener 1883 0.0.0.0

# Listen on port 9001 for WebSocket connections
listener 9001 0.0.0.0
protocol websockets

# Enable logging
log_dest file /etc/mosquitto/log/mosquitto.log

# Allow anonymous connections (set to false if you want to enforce authentication)
allow_anonymous false

# Password file for authentication
password_file /etc/mosquitto/config/pwfile

max_packet_size 268435455

```
## Mosquitto neu starten
```
sudo systemctl restart mosquitto
```
