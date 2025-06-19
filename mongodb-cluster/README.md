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
