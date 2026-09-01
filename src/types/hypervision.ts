/**
 * Modèle de données de l'éditeur d'hypervision.
 * Ce schéma est la structure exportée en JSON, destinée à être
 * consommée par le futur backend FastAPI.
 */

export type DeviceCategory = "sensor" | "actuator";

/** Types de nœuds supportés par la palette (capteurs & actionneurs). */
export type DeviceType =
  | "sensor_soil_moisture"
  | "sensor_ds18b20"
  | "actuator_relay_heating"
  | "actuator_valve_watering";

export type MqttPayloadType = "float" | "int" | "bool" | "json" | "string";

export interface MqttConfig {
  /** Ex: serre/zone1/sol/humidite */
  topic: string;
  qos: 0 | 1 | 2;
  retain: boolean;
  payloadType: MqttPayloadType;
}

export interface Point {
  x: number;
  y: number;
}

export type ZoneKind = "culture_bed" | "walkway" | "technical_area";

/** Une zone / butte de culture dessinée sur le plan. */
export interface Zone {
  id: string;
  name: string;
  kind: ZoneKind;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  color: string;
  notes?: string;
}

/** Un capteur ou actionneur posé sur le plan. */
export interface DeviceNode {
  id: string;
  type: DeviceType;
  category: DeviceCategory;
  label: string;
  x: number;
  y: number;
  rotation: number;
  /** Zone à laquelle le nœud est rattaché (rattachement logique, pas seulement visuel). */
  zoneId: string | null;
  mqtt: MqttConfig;
  /** Identifiant matériel optionnel (ex: MAC ESP32) pour lier au provisioning. */
  deviceId?: string;
}

export interface GridSettings {
  cellSize: number;
  columns: number;
  rows: number;
  snapToGrid: boolean;
  /** Taille réelle d'une cellule, en mètres (permet de fixer les dimensions de la serre). */
  metersPerCell: number;
}

export interface GreenhouseMeta {
  name: string;
  grid: GridSettings;
}

/** Un mur du contour de la serre (rectangle défini par la grille). */
export type Wall = "north" | "south" | "east" | "west";

/** Une porte/ouverture placée sur un mur du contour. */
export interface Door {
  id: string;
  wall: Wall;
  /** Distance en mètres depuis le coin de départ du mur (nord/sud: depuis l'ouest ; est/ouest: depuis le nord) jusqu'au centre de la porte. */
  offsetMeters: number;
  widthMeters: number;
  label?: string;
}

export type PlantSpecies =
  | "tomato"
  | "pepper"
  | "eggplant"
  | "cucumber"
  | "zucchini"
  | "potato"
  | "bean";

/** Un plant individuel posé sur le plan (ex: un pied de tomate). */
export interface Plant {
  id: string;
  species: PlantSpecies;
  variety?: string;
  x: number;
  y: number;
  zoneId: string | null;
  plantedAt?: string;
  notes?: string;
}

/** Structure racine exportée par le bouton "Sauvegarder". */
export interface HypervisionConfig {
  version: 1;
  greenhouse: GreenhouseMeta;
  zones: Zone[];
  nodes: DeviceNode[];
  doors: Door[];
  plants: Plant[];
}

export type SelectableKind = "zone" | "node" | "door" | "plant";

export interface Selection {
  kind: SelectableKind;
  id: string;
}
