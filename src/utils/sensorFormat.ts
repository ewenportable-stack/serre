import type { DeviceType } from "../types/hypervision";
import type { SensorReading } from "../store/liveStore";

export function formatSensorValue(type: DeviceType, reading: SensorReading): string {
  switch (type) {
    case "sensor_soil_moisture":
      return `${reading.value.toFixed(0)} %`;
    case "sensor_ds18b20":
      return `${reading.value.toFixed(1)} °C`;
    case "sensor_light":
      return `${reading.value.toFixed(0)} %`;
    case "sensor_temp_humidity":
      return `${reading.value.toFixed(1)} °C · ${(reading.value2 ?? 0).toFixed(0)} %`;
    default:
      return `${reading.value}`;
  }
}

export function sensorUnit(type: DeviceType): string {
  switch (type) {
    case "sensor_soil_moisture":
    case "sensor_light":
      return "%";
    case "sensor_ds18b20":
      return "°C";
    default:
      return "";
  }
}

export const SENSOR_CHART_RANGE: Partial<Record<DeviceType, { min: number; max: number }>> = {
  sensor_soil_moisture: { min: 0, max: 100 },
  sensor_ds18b20: { min: 0, max: 40 },
  sensor_light: { min: 0, max: 100 },
};

/** Températures/humidités en couleurs sémantiques cohérentes avec le reste de l'app (orange = température, bleu = humidité). */
export const TEMPERATURE_COLOR = "#f97316";
export const HUMIDITY_COLOR = "#2563eb";
