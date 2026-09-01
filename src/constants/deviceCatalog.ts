import type { DeviceCategory, DeviceType, MqttPayloadType, PlantSpecies } from "../types/hypervision";

export interface DeviceCatalogEntry {
  type: DeviceType;
  category: DeviceCategory;
  label: string;
  /** Courte description affichée dans la palette. */
  description: string;
  /** Couleur d'accent utilisée pour le pictogramme sur le plan. */
  color: string;
  /** Segment de topic MQTT suggéré, complété par l'utilisateur dans l'inspecteur. */
  defaultTopicSuffix: string;
  defaultPayloadType: MqttPayloadType;
}

export const DEVICE_CATALOG: DeviceCatalogEntry[] = [
  {
    type: "sensor_soil_moisture",
    category: "sensor",
    label: "Capteur humidité sol",
    description: "Capteur capacitif d'humidité du sol",
    color: "#2563eb",
    defaultTopicSuffix: "sol/humidite",
    defaultPayloadType: "float",
  },
  {
    type: "sensor_ds18b20",
    category: "sensor",
    label: "Sonde température DS18B20",
    description: "Sonde de température numérique",
    color: "#f97316",
    defaultTopicSuffix: "sol/temperature",
    defaultPayloadType: "float",
  },
  {
    type: "actuator_relay_heating",
    category: "actuator",
    label: "Relais chauffage",
    description: "Relais / MOSFET pilotant le chauffage localisé",
    color: "#dc2626",
    defaultTopicSuffix: "chauffage/commande",
    defaultPayloadType: "bool",
  },
  {
    type: "actuator_valve_watering",
    category: "actuator",
    label: "Vanne arrosage",
    description: "Électrovanne d'arrosage",
    color: "#0891b2",
    defaultTopicSuffix: "arrosage/commande",
    defaultPayloadType: "bool",
  },
];

export function getDeviceCatalogEntry(type: DeviceType): DeviceCatalogEntry {
  const entry = DEVICE_CATALOG.find((d) => d.type === type);
  if (!entry) {
    throw new Error(`Type de nœud inconnu dans le catalogue: ${type}`);
  }
  return entry;
}

export const ZONE_KIND_LABELS: Record<string, string> = {
  culture_bed: "Butte de culture",
  walkway: "Allée",
  technical_area: "Zone technique",
};

export const ZONE_DEFAULT_COLORS: Record<string, string> = {
  culture_bed: "#84cc1633",
  walkway: "#94a3b833",
  technical_area: "#a855f733",
};

export interface PlantCatalogEntry {
  species: PlantSpecies;
  label: string;
  color: string;
}

export const PLANT_CATALOG: PlantCatalogEntry[] = [
  { species: "tomato", label: "Tomate", color: "#dc2626" },
  { species: "pepper", label: "Poivron", color: "#f59e0b" },
  { species: "eggplant", label: "Aubergine", color: "#7c3aed" },
  { species: "cucumber", label: "Concombre", color: "#16a34a" },
  { species: "zucchini", label: "Courgette", color: "#65a30d" },
  { species: "potato", label: "Pomme de terre", color: "#a16207" },
  { species: "bean", label: "Haricot", color: "#059669" },
];

export function getPlantCatalogEntry(species: PlantSpecies): PlantCatalogEntry {
  const entry = PLANT_CATALOG.find((p) => p.species === species);
  if (!entry) {
    throw new Error(`Espèce de plante inconnue dans le catalogue: ${species}`);
  }
  return entry;
}

export const DEFAULT_DOOR_WIDTH_METERS = 0.9;
