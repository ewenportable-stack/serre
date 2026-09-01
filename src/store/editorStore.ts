import { create } from "zustand";
import type {
  DeviceNode,
  DeviceType,
  Door,
  GridSettings,
  HypervisionConfig,
  MqttConfig,
  Pipe,
  Plant,
  PlantSpecies,
  Point,
  Selection,
  SelectableKind,
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
  snapToGrid: false,
  metersPerCell: 0.5,
};

type ClipboardItem =
  | { kind: "zone"; data: Zone }
  | { kind: "node"; data: DeviceNode }
  | { kind: "door"; data: Door }
  | { kind: "plant"; data: Plant }
  | { kind: "pipe"; data: Pipe };

interface GroupDragSnapshot {
  zones: Record<string, { x: number; y: number }>;
  nodes: Record<string, { x: number; y: number }>;
  plants: Record<string, { x: number; y: number }>;
}

interface EditorState {
  greenhouseName: string;
  grid: GridSettings;
  zones: Zone[];
  nodes: DeviceNode[];
  doors: Door[];
  plants: Plant[];
  pipes: Pipe[];
  /** Points déjà posés du tuyau en cours de tracé (null = pas de tracé en cours). */
  pipeDraft: Point[] | null;
  /** Sélection multiple : chaque élément est une zone, un nœud, une porte, une plante ou un tuyau. */
  selection: Selection[];
  clipboard: ClipboardItem[];
  groupDragSnapshot: GroupDragSnapshot | null;

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

  startPipeDraft: () => void;
  addPipeDraftPoint: (point: Point) => void;
  finishPipeDraft: () => void;
  cancelPipeDraft: () => void;
  updatePipe: (id: string, patch: Partial<Pipe>) => void;
  removePipe: (id: string) => void;

  select: (selection: Selection | null) => void;
  toggleSelection: (item: Selection) => void;
  setSelection: (items: Selection[]) => void;
  removeSelected: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  duplicateSelected: () => void;

  beginGroupDrag: () => void;
  applyGroupDragDelta: (deltaX: number, deltaY: number, excludeKind: SelectableKind, excludeId: string) => void;
  endGroupDrag: () => void;

  exportConfig: () => HypervisionConfig;
  loadConfig: (config: HypervisionConfig) => void;
  reset: () => void;
}

/** Décalage appliqué (en px, ou en mètres pour les portes) à chaque copier-coller, pour ne pas empiler la copie sur l'original. */
const PASTE_OFFSET_PX = 24;
const PASTE_OFFSET_METERS = 0.5;

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

function isSameSelection(a: Selection, b: Selection): boolean {
  return a.kind === b.kind && a.id === b.id;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  greenhouseName: "Ma serre",
  grid: DEFAULT_GRID,
  zones: [],
  nodes: [],
  doors: [],
  plants: [],
  pipes: [],
  pipeDraft: null,
  selection: [],
  clipboard: [],
  groupDragSnapshot: null,

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
    set((state) => ({ zones: [...state.zones, zone], selection: [{ kind: "zone", id }] }));
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
      selection: state.selection.filter((s) => !(s.kind === "zone" && s.id === id)),
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
    set((s) => ({ nodes: [...s.nodes, node], selection: [{ kind: "node", id }] }));
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
      selection: state.selection.filter((s) => !(s.kind === "node" && s.id === id)),
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
    set((s) => ({ doors: [...s.doors, door], selection: [{ kind: "door", id }] }));
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
      selection: state.selection.filter((s) => !(s.kind === "door" && s.id === id)),
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
    set((s) => ({ plants: [...s.plants, plant], selection: [{ kind: "plant", id }] }));
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
      selection: state.selection.filter((s) => !(s.kind === "plant" && s.id === id)),
    })),

  startPipeDraft: () => set({ pipeDraft: [], selection: [] }),

  addPipeDraftPoint: (point) =>
    set((state) => (state.pipeDraft ? { pipeDraft: [...state.pipeDraft, point] } : state)),

  finishPipeDraft: () =>
    set((state) => {
      const draft = state.pipeDraft;
      if (!draft || draft.length < 2) return { pipeDraft: null };
      const id = createId("pipe");
      const pipe: Pipe = { id, points: draft };
      return { pipes: [...state.pipes, pipe], pipeDraft: null, selection: [{ kind: "pipe", id }] };
    }),

  cancelPipeDraft: () => set({ pipeDraft: null }),

  updatePipe: (id, patch) =>
    set((state) => ({
      pipes: state.pipes.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    })),

  removePipe: (id) =>
    set((state) => ({
      pipes: state.pipes.filter((p) => p.id !== id),
      selection: state.selection.filter((s) => !(s.kind === "pipe" && s.id === id)),
    })),

  select: (item) => set({ selection: item ? [item] : [] }),

  toggleSelection: (item) =>
    set((state) => ({
      selection: state.selection.some((s) => isSameSelection(s, item))
        ? state.selection.filter((s) => !isSameSelection(s, item))
        : [...state.selection, item],
    })),

  setSelection: (items) => set({ selection: items }),

  removeSelected: () => {
    const selection = get().selection;
    if (selection.length === 0) return;
    const zoneIds = new Set(selection.filter((s) => s.kind === "zone").map((s) => s.id));
    const nodeIds = new Set(selection.filter((s) => s.kind === "node").map((s) => s.id));
    const doorIds = new Set(selection.filter((s) => s.kind === "door").map((s) => s.id));
    const plantIds = new Set(selection.filter((s) => s.kind === "plant").map((s) => s.id));
    const pipeIds = new Set(selection.filter((s) => s.kind === "pipe").map((s) => s.id));

    set((state) => ({
      zones: state.zones.filter((z) => !zoneIds.has(z.id)),
      nodes: state.nodes
        .filter((n) => !nodeIds.has(n.id))
        .map((n) => (n.zoneId && zoneIds.has(n.zoneId) ? { ...n, zoneId: null } : n)),
      doors: state.doors.filter((d) => !doorIds.has(d.id)),
      plants: state.plants
        .filter((p) => !plantIds.has(p.id))
        .map((p) => (p.zoneId && zoneIds.has(p.zoneId) ? { ...p, zoneId: null } : p)),
      pipes: state.pipes.filter((p) => !pipeIds.has(p.id)),
      selection: [],
    }));
  },

  copySelected: () => {
    const state = get();
    const items: ClipboardItem[] = [];
    for (const sel of state.selection) {
      if (sel.kind === "zone") {
        const zone = state.zones.find((z) => z.id === sel.id);
        if (zone) items.push({ kind: "zone", data: zone });
      } else if (sel.kind === "node") {
        const node = state.nodes.find((n) => n.id === sel.id);
        if (node) items.push({ kind: "node", data: node });
      } else if (sel.kind === "door") {
        const door = state.doors.find((d) => d.id === sel.id);
        if (door) items.push({ kind: "door", data: door });
      } else if (sel.kind === "plant") {
        const plant = state.plants.find((p) => p.id === sel.id);
        if (plant) items.push({ kind: "plant", data: plant });
      } else {
        const pipe = state.pipes.find((p) => p.id === sel.id);
        if (pipe) items.push({ kind: "pipe", data: pipe });
      }
    }
    if (items.length > 0) set({ clipboard: items });
  },

  pasteClipboard: () => {
    const clipboard = get().clipboard;
    if (clipboard.length === 0) return;
    const state = get();

    const newSelection: Selection[] = [];
    const newClipboard: ClipboardItem[] = [];
    const zonesToAdd: Zone[] = [];
    const nodesToAdd: DeviceNode[] = [];
    const doorsToAdd: Door[] = [];
    const plantsToAdd: Plant[] = [];
    const pipesToAdd: Pipe[] = [];

    for (const item of clipboard) {
      if (item.kind === "zone") {
        const id = createId("zone");
        const src = item.data;
        const zone: Zone = {
          ...src,
          id,
          x: src.x + PASTE_OFFSET_PX,
          y: src.y + PASTE_OFFSET_PX,
          name: `${src.name} (copie)`,
        };
        zonesToAdd.push(zone);
        newSelection.push({ kind: "zone", id });
        newClipboard.push({ kind: "zone", data: zone });
      } else if (item.kind === "node") {
        const id = createId("node");
        const src = item.data;
        const x = src.x + PASTE_OFFSET_PX;
        const y = src.y + PASTE_OFFSET_PX;
        const zone = findZoneAtPoint(state.zones, x, y);
        const node: DeviceNode = { ...src, id, x, y, zoneId: zone?.id ?? null, label: `${src.label} (copie)`, mqtt: { ...src.mqtt } };
        nodesToAdd.push(node);
        newSelection.push({ kind: "node", id });
        newClipboard.push({ kind: "node", data: node });
      } else if (item.kind === "plant") {
        const id = createId("plant");
        const src = item.data;
        const x = src.x + PASTE_OFFSET_PX;
        const y = src.y + PASTE_OFFSET_PX;
        const zone = findZoneAtPoint(state.zones, x, y);
        const plant: Plant = { ...src, id, x, y, zoneId: zone?.id ?? null };
        plantsToAdd.push(plant);
        newSelection.push({ kind: "plant", id });
        newClipboard.push({ kind: "plant", data: plant });
      } else if (item.kind === "door") {
        const id = createId("door");
        const src = item.data;
        const length = wallLengthMeters(src.wall, state.grid);
        const half = src.widthMeters / 2;
        const offsetMeters = Math.min(Math.max(src.offsetMeters + PASTE_OFFSET_METERS, half), Math.max(half, length - half));
        doorCounter += 1;
        const door: Door = { ...src, id, offsetMeters, label: src.label ? `${src.label} (copie)` : `Porte ${doorCounter}` };
        doorsToAdd.push(door);
        newSelection.push({ kind: "door", id });
        newClipboard.push({ kind: "door", data: door });
      } else {
        const id = createId("pipe");
        const src = item.data;
        const points = src.points.map((p) => ({ x: p.x + PASTE_OFFSET_PX, y: p.y + PASTE_OFFSET_PX }));
        const pipe: Pipe = { ...src, id, points, label: src.label ? `${src.label} (copie)` : undefined };
        pipesToAdd.push(pipe);
        newSelection.push({ kind: "pipe", id });
        newClipboard.push({ kind: "pipe", data: pipe });
      }
    }

    set((s) => ({
      zones: [...s.zones, ...zonesToAdd],
      nodes: [...s.nodes, ...nodesToAdd],
      doors: [...s.doors, ...doorsToAdd],
      plants: [...s.plants, ...plantsToAdd],
      pipes: [...s.pipes, ...pipesToAdd],
      selection: newSelection,
      clipboard: newClipboard,
    }));
  },

  duplicateSelected: () => {
    get().copySelected();
    get().pasteClipboard();
  },

  beginGroupDrag: () => {
    const state = get();
    if (state.selection.length < 2) return;
    const zones: Record<string, { x: number; y: number }> = {};
    const nodes: Record<string, { x: number; y: number }> = {};
    const plants: Record<string, { x: number; y: number }> = {};
    for (const sel of state.selection) {
      if (sel.kind === "zone") {
        const z = state.zones.find((zz) => zz.id === sel.id);
        if (z) zones[z.id] = { x: z.x, y: z.y };
      } else if (sel.kind === "node") {
        const n = state.nodes.find((nn) => nn.id === sel.id);
        if (n) nodes[n.id] = { x: n.x, y: n.y };
      } else if (sel.kind === "plant") {
        const p = state.plants.find((pp) => pp.id === sel.id);
        if (p) plants[p.id] = { x: p.x, y: p.y };
      }
    }
    set({ groupDragSnapshot: { zones, nodes, plants } });
  },

  applyGroupDragDelta: (deltaX, deltaY, excludeKind, excludeId) => {
    const snapshot = get().groupDragSnapshot;
    if (!snapshot) return;
    set((state) => ({
      zones: state.zones.map((z) => {
        if (excludeKind === "zone" && z.id === excludeId) return z;
        const base = snapshot.zones[z.id];
        return base ? { ...z, x: base.x + deltaX, y: base.y + deltaY } : z;
      }),
      nodes: state.nodes.map((n) => {
        if (excludeKind === "node" && n.id === excludeId) return n;
        const base = snapshot.nodes[n.id];
        return base ? { ...n, x: base.x + deltaX, y: base.y + deltaY } : n;
      }),
      plants: state.plants.map((p) => {
        if (excludeKind === "plant" && p.id === excludeId) return p;
        const base = snapshot.plants[p.id];
        return base ? { ...p, x: base.x + deltaX, y: base.y + deltaY } : p;
      }),
    }));
  },

  endGroupDrag: () =>
    set((state) => {
      const snapshot = state.groupDragSnapshot;
      if (!snapshot) return { groupDragSnapshot: null };
      const nodes = state.nodes.map((n) =>
        snapshot.nodes[n.id] ? { ...n, zoneId: findZoneAtPoint(state.zones, n.x, n.y)?.id ?? null } : n,
      );
      const plants = state.plants.map((p) =>
        snapshot.plants[p.id] ? { ...p, zoneId: findZoneAtPoint(state.zones, p.x, p.y)?.id ?? null } : p,
      );
      return { nodes, plants, groupDragSnapshot: null };
    }),

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
      pipes: state.pipes,
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
      pipes: config.pipes ?? [],
      pipeDraft: null,
      selection: [],
      clipboard: [],
      groupDragSnapshot: null,
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
      pipes: [],
      pipeDraft: null,
      selection: [],
      clipboard: [],
      groupDragSnapshot: null,
    });
  },
}));
