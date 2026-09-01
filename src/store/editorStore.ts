import { create } from "zustand";
import type {
  DeviceNode,
  DeviceType,
  Door,
  GridSettings,
  HypervisionConfig,
  MqttConfig,
  Plant,
  PlantSpecies,
  Selection,
  Wall,
  Zone,
  ZoneKind,
} from "../types/hypervision";
import {
  DEFAULT_DOOR_WIDTH_METERS,
  getDeviceCatalogEntry,
  ZONE_DEFAULT_COLORS,
} from "../constants/deviceCatalog";
import { createId } from "../utils/id";

const DEFAULT_GRID: GridSettings = {
  cellSize: 40,
  columns: 24,
  rows: 16,
  snapToGrid: true,
  metersPerCell: 0.5,
};

interface EditorState {
  greenhouseName: string;
  grid: GridSettings;
  zones: Zone[];
  nodes: DeviceNode[];
  doors: Door[];
  plants: Plant[];
  selection: Selection | null;

  setGreenhouseName: (name: string) => void;
  setGrid: (grid: Partial<GridSettings>) => void;
  setStructureDimensions: (widthMeters: number, heightMeters: number) => void;

  addZone: (kind: ZoneKind, position?: { x: number; y: number }) => string;
  updateZone: (id: string, patch: Partial<Zone>) => void;
  removeZone: (id: string) => void;

  addNode: (type: DeviceType, position: { x: number; y: number }) => string;
  updateNode: (id: string, patch: Partial<DeviceNode>) => void;
  updateNodeMqtt: (id: string, patch: Partial<MqttConfig>) => void;
  removeNode: (id: string) => void;

  addDoor: (wall: Wall) => string;
  updateDoor: (id: string, patch: Partial<Door>) => void;
  removeDoor: (id: string) => void;

  addPlant: (species: PlantSpecies, position: { x: number; y: number }) => string;
  updatePlant: (id: string, patch: Partial<Plant>) => void;
  removePlant: (id: string) => void;

  select: (selection: Selection | null) => void;
  removeSelected: () => void;

  exportConfig: () => HypervisionConfig;
  loadConfig: (config: HypervisionConfig) => void;
  reset: () => void;
}

let zoneCounter = 0;
let nodeCounters: Partial<Record<DeviceType, number>> = {};
let doorCounter = 0;

function nextZoneName(kind: ZoneKind): string {
  zoneCounter += 1;
  const labels: Record<ZoneKind, string> = {
    culture_bed: "Butte",
    walkway: "Allée",
    technical_area: "Zone technique",
  };
  return `${labels[kind]} ${zoneCounter}`;
}

function nextNodeLabel(type: DeviceType): string {
  const entry = getDeviceCatalogEntry(type);
  const count = (nodeCounters[type] ?? 0) + 1;
  nodeCounters[type] = count;
  return `${entry.label} ${count}`;
}

function buildDefaultMqtt(type: DeviceType, greenhouseName: string, zoneId: string | null, zones: Zone[]): MqttConfig {
  const entry = getDeviceCatalogEntry(type);
  const zone = zoneId ? zones.find((z) => z.id === zoneId) : undefined;
  const zoneSegment = zone ? slugify(zone.name) : "zone";
  const rootSegment = slugify(greenhouseName || "serre");
  return {
    topic: `${rootSegment}/${zoneSegment}/${entry.defaultTopicSuffix}`,
    qos: 0,
    retain: entry.category === "actuator",
    payloadType: entry.defaultPayloadType,
  };
}

function slugify(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 24) || "zone"
  );
}

/** Trouve la zone qui contient le point (x, y), la dernière ajoutée en priorité. */
function findZoneAtPoint(zones: Zone[], x: number, y: number): Zone | undefined {
  for (let i = zones.length - 1; i >= 0; i -= 1) {
    const z = zones[i];
    if (x >= z.x && x <= z.x + z.width && y >= z.y && y <= z.y + z.height) {
      return z;
    }
  }
  return undefined;
}

/** Longueur du mur en mètres (nord/sud suivent la largeur, est/ouest la hauteur). */
function wallLengthMeters(wall: Wall, grid: GridSettings): number {
  return wall === "north" || wall === "south"
    ? grid.columns * grid.metersPerCell
    : grid.rows * grid.metersPerCell;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  greenhouseName: "Ma serre",
  grid: DEFAULT_GRID,
  zones: [],
  nodes: [],
  doors: [],
  plants: [],
  selection: null,

  setGreenhouseName: (name) => set({ greenhouseName: name }),
  setGrid: (grid) => set((state) => ({ grid: { ...state.grid, ...grid } })),

  setStructureDimensions: (widthMeters, heightMeters) =>
    set((state) => {
      const metersPerCell = state.grid.metersPerCell;
      const columns = Math.max(1, Math.round(widthMeters / metersPerCell));
      const rows = Math.max(1, Math.round(heightMeters / metersPerCell));
      const grid = { ...state.grid, columns, rows };
      const doors = state.doors.map((d) => {
        const length = wallLengthMeters(d.wall, grid);
        const half = d.widthMeters / 2;
        const offsetMeters = Math.min(Math.max(d.offsetMeters, half), Math.max(half, length - half));
        return { ...d, offsetMeters };
      });
      return { grid, doors };
    }),

  addZone: (kind, position) => {
    const id = createId("zone");
    const cell = get().grid.cellSize;
    const x = position?.x ?? cell * 2;
    const y = position?.y ?? cell * 2;
    const zone: Zone = {
      id,
      name: nextZoneName(kind),
      kind,
      x,
      y,
      width: cell * 4,
      height: cell * 3,
      rotation: 0,
      color: ZONE_DEFAULT_COLORS[kind] ?? "#84cc1633",
    };
    set((state) => ({ zones: [...state.zones, zone], selection: { kind: "zone", id } }));
    return id;
  },

  updateZone: (id, patch) =>
    set((state) => ({
      zones: state.zones.map((z) => (z.id === id ? { ...z, ...patch } : z)),
    })),

  removeZone: (id) =>
    set((state) => ({
      zones: state.zones.filter((z) => z.id !== id),
      nodes: state.nodes.map((n) => (n.zoneId === id ? { ...n, zoneId: null } : n)),
      plants: state.plants.map((p) => (p.zoneId === id ? { ...p, zoneId: null } : p)),
      selection: state.selection?.kind === "zone" && state.selection.id === id ? null : state.selection,
    })),

  addNode: (type, position) => {
    const id = createId("node");
    const entry = getDeviceCatalogEntry(type);
    const state = get();
    const zone = findZoneAtPoint(state.zones, position.x, position.y);
    const node: DeviceNode = {
      id,
      type,
      category: entry.category,
      label: nextNodeLabel(type),
      x: position.x,
      y: position.y,
      rotation: 0,
      zoneId: zone?.id ?? null,
      mqtt: buildDefaultMqtt(type, state.greenhouseName, zone?.id ?? null, state.zones),
    };
    set((s) => ({ nodes: [...s.nodes, node], selection: { kind: "node", id } }));
    return id;
  },

  updateNode: (id, patch) =>
    set((state) => {
      const nodes = state.nodes.map((n) => {
        if (n.id !== id) return n;
        const updated = { ...n, ...patch };
        if (patch.x !== undefined || patch.y !== undefined) {
          const zone = findZoneAtPoint(state.zones, updated.x, updated.y);
          updated.zoneId = zone?.id ?? null;
        }
        return updated;
      });
      return { nodes };
    }),

  updateNodeMqtt: (id, patch) =>
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, mqtt: { ...n.mqtt, ...patch } } : n)),
    })),

  removeNode: (id) =>
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      selection: state.selection?.kind === "node" && state.selection.id === id ? null : state.selection,
    })),

  addDoor: (wall) => {
    const id = createId("door");
    doorCounter += 1;
    const state = get();
    const length = wallLengthMeters(wall, state.grid);
    const widthMeters = Math.min(DEFAULT_DOOR_WIDTH_METERS, Math.max(0.4, length - 0.2));
    const door: Door = {
      id,
      wall,
      offsetMeters: length / 2,
      widthMeters,
      label: `Porte ${doorCounter}`,
    };
    set((s) => ({ doors: [...s.doors, door], selection: { kind: "door", id } }));
    return id;
  },

  updateDoor: (id, patch) =>
    set((state) => ({
      doors: state.doors.map((d) => {
        if (d.id !== id) return d;
        const updated = { ...d, ...patch };
        const length = wallLengthMeters(updated.wall, state.grid);
        const half = updated.widthMeters / 2;
        updated.offsetMeters = Math.min(Math.max(updated.offsetMeters, half), Math.max(half, length - half));
        return updated;
      }),
    })),

  removeDoor: (id) =>
    set((state) => ({
      doors: state.doors.filter((d) => d.id !== id),
      selection: state.selection?.kind === "door" && state.selection.id === id ? null : state.selection,
    })),

  addPlant: (species, position) => {
    const id = createId("plant");
    const state = get();
    const zone = findZoneAtPoint(state.zones, position.x, position.y);
    const plant: Plant = {
      id,
      species,
      x: position.x,
      y: position.y,
      zoneId: zone?.id ?? null,
    };
    set((s) => ({ plants: [...s.plants, plant], selection: { kind: "plant", id } }));
    return id;
  },

  updatePlant: (id, patch) =>
    set((state) => {
      const plants = state.plants.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...patch };
        if (patch.x !== undefined || patch.y !== undefined) {
          const zone = findZoneAtPoint(state.zones, updated.x, updated.y);
          updated.zoneId = zone?.id ?? null;
        }
        return updated;
      });
      return { plants };
    }),

  removePlant: (id) =>
    set((state) => ({
      plants: state.plants.filter((p) => p.id !== id),
      selection: state.selection?.kind === "plant" && state.selection.id === id ? null : state.selection,
    })),

  select: (selection) => set({ selection }),

  removeSelected: () => {
    const selection = get().selection;
    if (!selection) return;
    if (selection.kind === "zone") get().removeZone(selection.id);
    else if (selection.kind === "node") get().removeNode(selection.id);
    else if (selection.kind === "door") get().removeDoor(selection.id);
    else get().removePlant(selection.id);
  },

  exportConfig: () => {
    const state = get();
    const config: HypervisionConfig = {
      version: 1,
      greenhouse: {
        name: state.greenhouseName,
        grid: state.grid,
      },
      zones: state.zones,
      nodes: state.nodes,
      doors: state.doors,
      plants: state.plants,
    };
    return config;
  },

  loadConfig: (config) => {
    zoneCounter = 0;
    nodeCounters = {};
    doorCounter = config.doors?.length ?? 0;
    set({
      greenhouseName: config.greenhouse.name,
      grid: { ...DEFAULT_GRID, ...config.greenhouse.grid },
      zones: config.zones,
      nodes: config.nodes,
      doors: config.doors ?? [],
      plants: config.plants ?? [],
      selection: null,
    });
  },

  reset: () => {
    zoneCounter = 0;
    nodeCounters = {};
    doorCounter = 0;
    set({
      greenhouseName: "Ma serre",
      grid: DEFAULT_GRID,
      zones: [],
      nodes: [],
      doors: [],
      plants: [],
      selection: null,
    });
  },
}));
