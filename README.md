# Éditeur d'hypervision — Serre connectée

Première brique de la plateforme d'hypervision / jumeau numérique de la serre :
un éditeur visuel permettant de dessiner le plan de la serre, d'y placer des
zones de culture et des équipements (capteurs / actionneurs), puis d'exporter
la configuration en JSON pour l'API FastAPI à venir.

## Stack

- **React 19 + TypeScript**, bundlé avec **Vite**
- **react-konva / Konva** pour le canvas 2D interactif (drag, resize, transform)
- **Zustand** pour l'état de l'éditeur (source de vérité unique)

## Démarrage

```bash
npm install
npm run dev       # serveur de dev (http://localhost:5173)
npm run build      # build de production + vérification TypeScript
npm run lint        # oxlint
```

## Arborescence

```
src/
├── types/hypervision.ts       # Modèle de données (Zone, DeviceNode, MqttConfig, HypervisionConfig...)
├── constants/deviceCatalog.ts # Catalogue des capteurs/actionneurs disponibles dans la palette
├── store/editorStore.ts       # Store Zustand : zones, nœuds, sélection, grille, export/import
├── utils/
│   ├── id.ts                  # Génération d'identifiants uniques
│   ├── snap.ts                # Alignement sur la grille (snapping)
│   └── export.ts              # Sérialisation JSON + téléchargement / import de fichier
├── hooks/
│   └── useKeyboardShortcuts.ts# Suppression (Delete/Backspace), désélection (Échap)
├── components/
│   ├── Layout/AppLayout.tsx        # Disposition générale (toolbar + palette + canvas + inspecteur)
│   ├── Toolbar/Toolbar.tsx         # Nom de la serre, grille, import, bouton "Sauvegarder"
│   ├── Palette/DevicePalette.tsx   # Zones (clic à ajouter) + capteurs/actionneurs (glisser-déposer)
│   ├── Editor/
│   │   ├── EditorCanvas.tsx    # Stage Konva, gestion du drop, sélection/désélection
│   │   ├── GridLayer.tsx       # Grille de fond
│   │   ├── ZoneShape.tsx       # Zone déplaçable/redimensionnable (Transformer Konva)
│   │   └── NodeShape.tsx       # Nœud capteur/actionneur déplaçable
│   └── Inspector/
│       ├── InspectorPanel.tsx  # Bascule zone / nœud selon la sélection
│       ├── ZoneInspector.tsx   # Édition nom, type, position, taille, notes
│       └── NodeInspector.tsx   # Édition libellé, position, id matériel, topic MQTT, QoS, retain, payload
└── App.tsx
```

## Fonctionnalités

- **Plan 2D interactif** avec grille configurable (taille de cellule, alignement automatique).
- **Zones/buttes** : ajout via la palette, déplacement et redimensionnement (poignées de transformation).
- **Capteurs & actionneurs** : palette latérale (humidité sol, sonde DS18B20, relais chauffage, vanne
  d'arrosage), placés par glisser-déposer sur le plan. Un nœud déposé dans une zone y est automatiquement
  rattaché.
- **Panneau de configuration MQTT** : en sélectionnant un nœud, un panneau latéral permet d'éditer son
  topic MQTT, son QoS, le flag `retain` et le type de payload. Un topic par défaut est proposé
  (`<serre>/<zone>/<mesure>`), éditable librement.
- **Export / Import JSON** : le bouton "Sauvegarder" télécharge la configuration complète (zones, nœuds,
  coordonnées, topics MQTT) au format JSON ; "Importer" recharge un fichier existant dans l'éditeur.

## Schéma de configuration exporté

```jsonc
{
  "version": 1,
  "greenhouse": {
    "name": "Ma serre",
    "grid": { "cellSize": 40, "columns": 24, "rows": 16, "snapToGrid": true }
  },
  "zones": [
    {
      "id": "zone-...",
      "name": "Butte pommes de terre",
      "kind": "culture_bed", // culture_bed | walkway | technical_area
      "x": 80, "y": 80, "width": 160, "height": 120,
      "rotation": 0,
      "color": "#84cc1633",
      "notes": ""
    }
  ],
  "nodes": [
    {
      "id": "node-...",
      "type": "sensor_soil_moisture", // sensor_soil_moisture | sensor_ds18b20 | actuator_relay_heating | actuator_valve_watering
      "category": "sensor", // sensor | actuator
      "label": "Capteur humidité sol 1",
      "x": 150, "y": 130,
      "rotation": 0,
      "zoneId": "zone-...", // ou null si hors zone
      "deviceId": "esp32-c3-A1B2C3", // optionnel
      "mqtt": {
        "topic": "maserre/buttepommesdeterre/sol/humidite",
        "qos": 0,
        "retain": false,
        "payloadType": "float" // float | int | bool | json | string
      }
    }
  ]
}
```

Cette structure est prévue pour être envoyée telle quelle à une future route
`POST /api/hypervision/config` côté FastAPI.

## Prochaines étapes (hors périmètre de cette brique)

- Backend FastAPI + SQLite pour persister/valider la configuration.
- Pont MQTT (Mosquitto) pour relier les topics configurés aux ESP32.
- Historisation InfluxDB des mesures pour le futur volet Machine Learning.
