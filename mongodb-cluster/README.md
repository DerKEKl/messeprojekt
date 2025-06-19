# MongoDB sharded Cluster mit Docker fork von [yasasdy](https://github.com/yasasdy/mongodb-sharding/tree/main)

## Cluster Komponenten
Das Cluster besteht aus mehreren Komponenten
* Konfigurationsserver
* Shard-Server
* Mongo-Router


## Voraussetzungen
1. [Docker](https://docs.docker.com/engine/install/) & [Docker Compose](https://docs.docker.com/compose/install/) müssen installiert sein
2. Der MongoDB Server muss bereits installiert sein [Anleitung](https://github.com/DerKEKl/messeprojekt/blob/9f876e6d1f50d796155ae4e295d76284436ae293/mongodb-cluster/mongodb.md)

## Repo klonen
```
git clone https://github.com/DerKEKl/messeprojekt/tree/master/mongodb-cluster
cd /mongodb-cluster

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
Die gleiche Vorgehensweise auch für die `Shard-Server 1&2`

```
docker-compose -f shard_server1/docker-compose.yaml up -d
docker-compose -f shard_server2/docker-compose.yaml up -d

```
