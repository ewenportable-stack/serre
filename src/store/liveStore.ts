import { create } from "zustand";
import type { DeviceType } from "../types/hypervision";

export interface SensorReading {
  t: number;
  value: number;
  /** Seconde valeur pour les capteurs combinés (ex: humidité du capteur température/humidité). */
  value2?: number;
}

interface SensorRange {
  min: number;
  max: number;
  step: number;
  start: number;
}

const SENSOR_RANGES: Partial<Record<DeviceType, SensorRange>> = {
  sensor_soil_moisture: { min: 15, max: 85, step: 3, start: 45 },
  sensor_ds18b20: { min: 8, max: 32, step: 0.6, start: 19 },
  sensor_light: { min: 0, max: 100, step: 6, start: 55 },
};

const TEMP_HUMIDITY_RANGES = {
  temp: { min: 10, max: 34, step: 0.6, start: 21 },
  humidity: { min: 35, max: 90, step: 3, start: 60 },
};

const HISTORY_LENGTH = 40;

function nextValue(prev: number, range: SensorRange): number {
  const next = prev + (Math.random() - 0.5) * 2 * range.step;
  return Math.min(range.max, Math.max(range.min, next));
}

interface LiveState {
  actuatorOn: Record<string, boolean>;
  history: Record<string, SensorReading[]>;

  toggleActuator: (id: string) => void;
  tick: (sensorNodes: { id: string; type: DeviceType }[]) => void;
  reset: () => void;
}

export const useLiveStore = create<LiveState>((set, get) => ({
  actuatorOn: {},
  history: {},

  toggleActuator: (id) =>
    set((state) => ({ actuatorOn: { ...state.actuatorOn, [id]: !state.actuatorOn[id] } })),

  tick: (sensorNodes) => {
    const state = get();
    const nextHistory: Record<string, SensorReading[]> = { ...state.history };
    const now = Date.now();

    for (const node of sensorNodes) {
      const existing = nextHistory[node.id] ?? [];
      const last = existing[existing.length - 1];

      let reading: SensorReading;
      if (node.type === "sensor_temp_humidity") {
        const prevTemp = last?.value ?? TEMP_HUMIDITY_RANGES.temp.start;
        const prevHumidity = last?.value2 ?? TEMP_HUMIDITY_RANGES.humidity.start;
        reading = {
          t: now,
          value: nextValue(prevTemp, TEMP_HUMIDITY_RANGES.temp),
          value2: nextValue(prevHumidity, TEMP_HUMIDITY_RANGES.humidity),
        };
      } else {
        const range = SENSOR_RANGES[node.type];
        if (!range) continue;
        reading = { t: now, value: nextValue(last?.value ?? range.start, range) };
      }

      nextHistory[node.id] = [...existing, reading].slice(-HISTORY_LENGTH);
    }

    set({ history: nextHistory });
  },

  reset: () => set({ actuatorOn: {}, history: {} }),
}));
