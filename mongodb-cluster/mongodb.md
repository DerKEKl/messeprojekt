# Installation MongoDB Ubuntu 20.04

Detaillierte Anleitung auf der offiziellen [MongoDB Website](https://www.mongodb.com/docs/manual/administration/install-on-linux/)<br>


## 1. Dependencies installieren

```
sudo apt install gnupg curl
```

## 2. MongoDB GPG Key importieren

```
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg \
   --dearmor
```

## 3. Repository hinzufügen

```
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/8.0 multiverse" | \
sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
```

## 4. Paketliste updaten

```
sudo apt update
```

## 5. Install MongoDB Community Server

```
sudo apt install -y mongodb-org
```

## 6.  BindIP ändern

MongoDB Konfiguration öffnen:

```
sudo nano /etc/mongod.conf
```

Unter network interfaces lässt sich die bindIp einstellen. `(0.0.0.0)` erlaubt zugriff von jeder IP:

```
net:
  port: 27017
  bindIp: 0.0.0.0
```

## 7. MongoDB Service Starten

```
sudo systemctl start mongod
```

## 8. MongoDB Status anzeigen

```
sudo systemctl status mongod
```

## 9. MongoDB beim Start der VM starten 

```
sudo systemctl enable mongod
```

