import { useEffect } from "react";
import { useEditorStore } from "../../store/editorStore";
import { useLiveStore } from "../../store/liveStore";
import { getDeviceCatalogEntry } from "../../constants/deviceCatalog";
import { SensorChart } from "./SensorChart";
import { HUMIDITY_COLOR, SENSOR_CHART_RANGE, TEMPERATURE_COLOR, formatSensorValue, sensorUnit } from "../../utils/sensorFormat";
import type { DeviceNode } from "../../types/hypervision";

interface SensorDetailModalProps {
  node: DeviceNode;
  onClose: () => void;
}

export function SensorDetailModal({ node, onClose }: SensorDetailModalProps) {
  const history = useLiveStore((s) => s.history[node.id]) ?? [];
  const zones = useEditorStore((s) => s.zones);
  const entry = getDeviceCatalogEntry(node.type);
  const zone = zones.find((z) => z.id === node.zoneId);
  const latest = history[history.length - 1];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{node.label}</h3>
            <p className="inspector-subtitle">
              {entry.label}
              {zone ? ` · ${zone.name}` : ""}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>

        {latest && <div className="modal-current-value">{formatSensorValue(node.type, latest)}</div>}

        {node.type === "sensor_temp_humidity" ? (
          <>
            <p className="chart-caption">Température</p>
            <SensorChart data={history.map((h) => ({ t: h.t, value: h.value }))} color={TEMPERATURE_COLOR} unit="°C" min={0} max={40} />
            <p className="chart-caption">Humidité</p>
            <SensorChart
              data={history.map((h) => ({ t: h.t, value: h.value2 ?? 0 }))}
              color={HUMIDITY_COLOR}
              unit="%"
              min={0}
              max={100}
            />
          </>
        ) : (
          <SensorChart
            data={history.map((h) => ({ t: h.t, value: h.value }))}
            color={entry.color}
            unit={sensorUnit(node.type)}
            min={SENSOR_CHART_RANGE[node.type]?.min ?? 0}
            max={SENSOR_CHART_RANGE[node.type]?.max ?? 100}
          />
        )}

        <dl className="modal-meta">
          <div>
            <dt>Topic MQTT</dt>
            <dd>{node.mqtt.topic}</dd>
          </div>
          <div>
            <dt>QoS</dt>
            <dd>{node.mqtt.qos}</dd>
          </div>
        </dl>
        <p className="modal-note">
          Données simulées à des fins de démonstration — le backend MQTT/InfluxDB n'est pas encore branché.
        </p>
      </div>
    </div>
  );
}
