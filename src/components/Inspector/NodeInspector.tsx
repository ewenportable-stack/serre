import type { DeviceNode, MqttPayloadType } from "../../types/hypervision";
import { useEditorStore } from "../../store/editorStore";
import { DEFAULT_NODE_SIZE, MAX_NODE_SIZE, MIN_NODE_SIZE, getDeviceCatalogEntry } from "../../constants/deviceCatalog";

interface NodeInspectorProps {
  node: DeviceNode;
}

const PAYLOAD_TYPES: MqttPayloadType[] = ["float", "int", "bool", "json", "string"];

export function NodeInspector({ node }: NodeInspectorProps) {
  const updateNode = useEditorStore((s) => s.updateNode);
  const updateNodeMqtt = useEditorStore((s) => s.updateNodeMqtt);
  const removeNode = useEditorStore((s) => s.removeNode);
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected);
  const zones = useEditorStore((s) => s.zones);
  const entry = getDeviceCatalogEntry(node.type);

  const zone = zones.find((z) => z.id === node.zoneId);
  const topicLooksValid = /^[a-z0-9/_-]+$/i.test(node.mqtt.topic) && !node.mqtt.topic.includes("//");

  return (
    <div className="inspector-form">
      <h3>{entry.category === "sensor" ? "Capteur" : "Actionneur"}</h3>
      <p className="inspector-subtitle">{entry.label}</p>

      <label className="field">
        <span>Libellé</span>
        <input value={node.label} onChange={(e) => updateNode(node.id, { label: e.target.value })} />
      </label>

      <div className="field-row">
        <label className="field">
          <span>X</span>
          <input type="number" value={Math.round(node.x)} onChange={(e) => updateNode(node.id, { x: Number(e.target.value) })} />
        </label>
        <label className="field">
          <span>Y</span>
          <input type="number" value={Math.round(node.y)} onChange={(e) => updateNode(node.id, { y: Number(e.target.value) })} />
        </label>
      </div>

      <label className="field">
        <span>Taille (px)</span>
        <input
          type="number"
          min={MIN_NODE_SIZE}
          max={MAX_NODE_SIZE}
          value={node.size ?? DEFAULT_NODE_SIZE}
          onChange={(e) =>
            updateNode(node.id, { size: Math.min(MAX_NODE_SIZE, Math.max(MIN_NODE_SIZE, Number(e.target.value))) })
          }
        />
      </label>

      <div className="field readonly-field">
        <span>Zone rattachée</span>
        <div>{zone ? zone.name : "Aucune (hors zone)"}</div>
      </div>

      <label className="field">
        <span>Identifiant matériel (optionnel)</span>
        <input
          value={node.deviceId ?? ""}
          onChange={(e) => updateNode(node.id, { deviceId: e.target.value || undefined })}
          placeholder="Ex: esp32-c3-A1B2C3"
        />
      </label>

      <hr />
      <h4>Configuration MQTT</h4>

      <label className="field">
        <span>Topic</span>
        <input
          value={node.mqtt.topic}
          onChange={(e) => updateNodeMqtt(node.id, { topic: e.target.value })}
          className={topicLooksValid ? "" : "field-invalid"}
          placeholder="serre/zone1/sol/humidite"
        />
      </label>
      {!topicLooksValid && <p className="field-error">Le topic ne doit contenir que lettres, chiffres, "-", "_" et "/".</p>}

      <div className="field-row">
        <label className="field">
          <span>QoS</span>
          <select
            value={node.mqtt.qos}
            onChange={(e) => updateNodeMqtt(node.id, { qos: Number(e.target.value) as 0 | 1 | 2 })}
          >
            <option value={0}>0</option>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
        <label className="field">
          <span>Type de payload</span>
          <select
            value={node.mqtt.payloadType}
            onChange={(e) => updateNodeMqtt(node.id, { payloadType: e.target.value as MqttPayloadType })}
          >
            {PAYLOAD_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="field field-checkbox">
        <input
          type="checkbox"
          checked={node.mqtt.retain}
          onChange={(e) => updateNodeMqtt(node.id, { retain: e.target.checked })}
        />
        <span>Retain</span>
      </label>

      <div className="inspector-actions">
        <button type="button" className="secondary-button" onClick={() => duplicateSelected()}>
          Dupliquer
        </button>
        <button type="button" className="danger-button" onClick={() => removeNode(node.id)}>
          Supprimer le nœud
        </button>
      </div>
    </div>
  );
}
