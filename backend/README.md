# Backend — API hypervision de la serre

API FastAPI qui fait le lien entre l'éditeur/la Vue live du frontend et les
équipements réels de la serre : persistance de la configuration (SQLite),
pont MQTT (Mosquitto) vers les ESP32, et historique des mesures (InfluxDB).

## Architecture

```
ESP32 (capteurs/actionneurs)
        │  MQTT
        ▼
   Mosquitto (broker)
        │
        ▼
  ┌─────────────────┐
  │  backend FastAPI │──── SQLite (config : zones, nœuds, topics...)
  │  (ce dossier)     │──── InfluxDB (historique des lectures capteurs)
  └─────────────────┘
        │  HTTP/JSON
        ▼
     Frontend (React)
```

## Démarrage rapide (développement local)

Nécessite un broker MQTT et une instance InfluxDB accessibles. Le plus simple :

```bash
docker compose up -d mosquitto influxdb
```

Puis, dans un environnement Python 3.11+ :

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # ajuster les valeurs (notamment INFLUX_TOKEN)
uvicorn app.main:app --reload
```

L'API est servie sur `http://localhost:8000`. Documentation interactive
auto-générée : `http://localhost:8000/docs`.

### Sans Docker (broker/Influx installés en local)

```bash
sudo apt install mosquitto mosquitto-clients
mosquitto -d -p 1883    # démarre le broker en arrière-plan
```

Pour InfluxDB, suivre la [documentation officielle](https://docs.influxdata.com/influxdb/v2/install/)
(le tarball serveur OSS 2.x n'est plus distribué directement par `apt` sur Ubuntu 24.04).

## Endpoints

| Méthode | Route | Description |
|---|---|---|
| GET | `/api/health` | Vérification de disponibilité |
| GET | `/api/config` | Récupère la configuration de la serre (404 si aucune n'a encore été sauvegardée) |
| PUT | `/api/config` | Sauvegarde la configuration (remplace l'export/import JSON manuel de l'éditeur) — déclenche le ré-abonnement MQTT aux nouveaux topics |
| GET | `/api/live/sensors/{node_id}/latest` | Dernière valeur connue d'un capteur (cache mémoire, alimenté par MQTT) |
| GET | `/api/live/sensors/{node_id}/history?minutes=60` | Historique depuis InfluxDB |
| GET | `/api/live/actuators/{node_id}/state` | État courant (marche/arrêt) d'un actionneur |
| POST | `/api/live/actuators/{node_id}/command` | Envoie une commande (`{"on": true}`) — publie sur le topic MQTT de l'actionneur |

Le schéma JSON de `/api/config` est un miroir exact de la structure exportée
par l'éditeur frontend (`src/types/hypervision.ts`) — voir `app/schemas.py`.

## Format des messages MQTT

- **Capteurs** : le payload est interprété selon le `payloadType` défini pour
  le nœud dans l'éditeur.
  - `float`/`int`/`string` : valeur brute (`21.5`)
  - `bool` : `"1"`/`"0"`, `"true"`/`"false"`, `"on"`/`"off"`
  - `json` : `{"value": 21.5}` pour un capteur simple, ou
    `{"value": 21.5, "value2": 63}` pour un capteur combiné (ex: température +
    humidité) — les clés `temperature`/`humidity` sont aussi acceptées en repli.
- **Actionneurs** : le backend publie dans le même format sur le topic
  configuré, avec le flag `retain` défini dans l'éditeur.

## Tests

```bash
pip install -r requirements.txt   # inclut pytest, httpx, pytest-asyncio
pytest -v
```

- `test_config_api.py` — persistance SQLite, entièrement autonome.
- `test_influx_client.py` — logique de requête/validation, avec un client
  InfluxDB simulé (aucune instance réelle nécessaire).
- `test_mqtt_bridge.py` — logique de parsing/formatage autonome, plus un test
  d'intégration bout-en-bout qui s'exécute automatiquement contre un vrai
  broker s'il en détecte un sur `localhost:1883`, et se saute sinon
  (`mosquitto -d -p 1883` avant de lancer `pytest` pour l'inclure).

## Déploiement

`docker-compose.yml` fournit une stack complète (Mosquitto + InfluxDB +
backend) prête pour un serveur domestique / Raspberry Pi. Penser à changer les
mots de passe/tokens par défaut avant toute exposition au-delà du réseau local.

## Ce qui reste à brancher côté frontend

Le frontend (`src/`) utilise encore l'export/import JSON manuel et une
simulation client-side (`src/store/liveStore.ts`) pour les valeurs capteurs et
l'état des actionneurs. Prochaine étape logique : remplacer ces deux points
par des appels à cette API (`PUT/GET /api/config` pour la sauvegarde,
`GET .../latest` et `.../history` + `POST .../command` pour la Vue live).
