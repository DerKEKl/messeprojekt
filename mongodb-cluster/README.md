# MongoDB sharded Cluster mit Docker fork von [yasasdy](https://github.com/yasasdy/mongodb-sharding/tree/main)

## Cluster Komponenten
Das Cluster besteht aus mehreren Komponenten
* Konfigurationsserver
* Shard-Server
* Mongo-Router
  <br>
![mongodb-cluster](https://github.com/DerKEKl/messeprojekt/blob/3bf634d2ba132c40ab50c67a56795ea6710bc7b4/mongodb-cluster.jpg)


## Voraussetzungen
1. [Docker](https://docs.docker.com/engine/install/) & [Docker Compose](https://docs.docker.com/compose/install/) müssen installiert sein
2. Der MongoDB Server muss bereits installiert sein [Anleitung](https://github.com/DerKEKl/messeprojekt/blob/9f876e6d1f50d796155ae4e295d76284436ae293/mongodb-cluster/mongodb.md)
3. Die `<ip>` Felder müsen durch die eigene IP ersetzt werden

## Repository klonen
```
git clone https://github.com/DerKEKl/messeprojekt
cd messeprojekt/mongodb-cluster
```

## Konfigurationsserver
Folgender Docker-Befehl startet den Konfigurationsserver
```
docker-compose -f config_server/docker-compose.yaml up -d
```
Sobald die Instanzen laufen, kann man sich mit dem Container verbinden
```
mongosh mongodb://localhost:10001
```
Innerhalb des Containers können die Mitglieder konfiguriert werden
```
rs.initiate({
  _id: "config_rs",
  configsvr: true,
  members: [
    { _id: 0, host: "<ip>:10001" },
    { _id: 1, host: "<ip>:10002" },
    { _id: 2, host: "<ip>:10003" }
  ]
})
```
Der Status der Replikasets kann mit dem Befehl `rs.status()` überprüft werden

## Shard-Server
Die gleiche Vorgehensweise auch für die beiden `Shard-Server`

```
docker-compose -f shard_server1/docker-compose.yaml up -d
docker-compose -f shard_server2/docker-compose.yaml up -d
```
`Shard1`
```
mongosh mongodb://localhost:20001

rs.initiate({
  _id: "shard1_rs",
  members: [
    { _id: 0, host: "<ip>:20001" },
    { _id: 1, host: "<ip>:20002" },
    { _id: 2, host: "<ip>:20003" }
  ]
})
```
`Shard2`
```
mongosh mongodb://localhost:20004

rs.initiate({
  _id: "shard2_rs",
  members: [
    { _id: 0, host: "<ip>:20004" },
    { _id: 1, host: "<ip>:20005" },
    { _id: 2, host: "<ip>:20006" }
  ]
})
```
## Mongo-Router
In der [`docker-compose.yaml`](https://github.com/DerKEKl/messeprojekt/blob/master/mongodb-cluster/mongo_router/docker-compose.yaml) muss die IP geändert werden <br>

Mongo-Router starten
```
docker-compose -f mongo_router/docker-compose.yaml up -d
```
Shards zum Cluster hinzufügen
```
mongosh mongodb://localhost:30000

sh.addShard("shard1_rs/<ip>:20001,<ip>:20002,<ip>:20003")
sh.addShard("shard2_rs/<ip>:20004,<ip>:20005,<ip>:20006")
```

## Sharding einer Collection
Datenbank erstellen
```
use daten
```
Collection sharden
```
sh.shardCollection("daten.parts", { partNumber: "hashed" })
```
Sharded die Collection `parts` in der Datenbank `daten`, anhand des Shard-Key-Feldes `partNumber` und nutzt hier die Funktion `hashed`<br>
Wir haben uns für die Funktion `hashed` entschieden, weil diese einen Hashwert berechnet und anhand diesem die Daten gleichmäßig auf die beiden Shards aufteilt. So benötigen wir kein Loadbalancing.
## Statusabfragen
Sharding-Status anzeigen
```
sh.status()
```
Datenverteilung anzeigen
```
db.parts.getShardDistribution()
```
