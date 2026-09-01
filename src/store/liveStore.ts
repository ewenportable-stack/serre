import { create } from "zustand";
import type { DeviceType } from "../types/hypervision";
import { createId } from "../utils/id";

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

/** 0 = dimanche ... 6 = samedi, comme Date.getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ActuatorSchedule {
  id: string;
  /** Heure de démarrage au format "HH:MM" (24h). */
  startTime: string;
  durationMinutes: number;
  days: Weekday[];
  enabled: boolean;
  label?: string;
}

interface LiveState {
  /** Marche/arrêt manuel (bouton dans la popup). */
  actuatorManualOn: Record<string, boolean>;
  /** Instant (epoch ms) de fin du minuteur en cours, ou absent si aucun minuteur actif. */
  actuatorTimerEndsAt: Record<string, number>;
  actuatorSchedules: Record<string, ActuatorSchedule[]>;
  /** Recalculé à chaque tick : une programmation est-elle active à l'instant présent ? */
  actuatorScheduleActive: Record<string, boolean>;

  history: Record<string, SensorReading[]>;

  setActuatorManual: (id: string, on: boolean) => void;
  startActuatorTimer: (id: string, minutes: number) => void;
  cancelActuatorTimer: (id: string) => void;

  addSchedule: (actuatorId: string, schedule: Omit<ActuatorSchedule, "id">) => void;
  updateSchedule: (actuatorId: string, scheduleId: string, patch: Partial<ActuatorSchedule>) => void;
  removeSchedule: (actuatorId: string, scheduleId: string) => void;

  tick: (sensorNodes: { id: string; type: DeviceType }[]) => void;
  tickActuators: (actuatorIds: string[]) => void;
  reset: () => void;
}

export const useLiveStore = create<LiveState>((set, get) => ({
  actuatorManualOn: {},
  actuatorTimerEndsAt: {},
  actuatorSchedules: {},
  actuatorScheduleActive: {},
  history: {},

  setActuatorManual: (id, on) => set((state) => ({ actuatorManualOn: { ...state.actuatorManualOn, [id]: on } })),

  startActuatorTimer: (id, minutes) =>
    set((state) => ({
      actuatorTimerEndsAt: { ...state.actuatorTimerEndsAt, [id]: Date.now() + minutes * 60_000 },
    })),

  cancelActuatorTimer: (id) =>
    set((state) => {
      const next = { ...state.actuatorTimerEndsAt };
      delete next[id];
      return { actuatorTimerEndsAt: next };
    }),

  addSchedule: (actuatorId, schedule) =>
    set((state) => ({
      actuatorSchedules: {
        ...state.actuatorSchedules,
        [actuatorId]: [...(state.actuatorSchedules[actuatorId] ?? []), { ...schedule, id: createId("schedule") }],
      },
    })),

  updateSchedule: (actuatorId, scheduleId, patch) =>
    set((state) => ({
      actuatorSchedules: {
        ...state.actuatorSchedules,
        [actuatorId]: (state.actuatorSchedules[actuatorId] ?? []).map((s) => (s.id === scheduleId ? { ...s, ...patch } : s)),
      },
    })),

  removeSchedule: (actuatorId, scheduleId) =>
    set((state) => ({
      actuatorSchedules: {
        ...state.actuatorSchedules,
        [actuatorId]: (state.actuatorSchedules[actuatorId] ?? []).filter((s) => s.id !== scheduleId),
      },
    })),

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

  tickActuators: (actuatorIds) => {
    const state = get();
    const now = Date.now();
    const nowDate = new Date(now);
    const nowMinutes = nowDate.getHours() * 60 + nowDate.getMinutes();
    const today = nowDate.getDay() as Weekday;

    const timerEndsAt = { ...state.actuatorTimerEndsAt };
    const scheduleActive: Record<string, boolean> = {};
    let timersChanged = false;

    for (const id of actuatorIds) {
      if (timerEndsAt[id] !== undefined && timerEndsAt[id] <= now) {
        delete timerEndsAt[id];
        timersChanged = true;
      }

      const schedules = state.actuatorSchedules[id] ?? [];
      scheduleActive[id] = schedules.some((s) => {
        if (!s.enabled || !s.days.includes(today)) return false;
        const [h, m] = s.startTime.split(":").map(Number);
        const startMin = h * 60 + m;
        return nowMinutes >= startMin && nowMinutes < startMin + s.durationMinutes;
      });
    }

    set({ actuatorScheduleActive: scheduleActive, ...(timersChanged ? { actuatorTimerEndsAt: timerEndsAt } : {}) });
  },

  reset: () =>
    set({
      actuatorManualOn: {},
      actuatorTimerEndsAt: {},
      actuatorSchedules: {},
      actuatorScheduleActive: {},
      history: {},
    }),
}));

/** Un actionneur est actif si activé manuellement, par un minuteur en cours, ou par une programmation active. */
export function useIsActuatorOn(id: string): boolean {
  return useLiveStore(
    (s) => !!s.actuatorManualOn[id] || s.actuatorTimerEndsAt[id] !== undefined || !!s.actuatorScheduleActive[id],
  );
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: "Lun",
  2: "Mar",
  3: "Mer",
  4: "Jeu",
  5: "Ven",
  6: "Sam",
  0: "Dim",
};

export const ALL_WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 0];
