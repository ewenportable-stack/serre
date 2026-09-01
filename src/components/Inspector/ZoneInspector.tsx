import type { Zone, ZoneKind } from "../../types/hypervision";
import { useEditorStore } from "../../store/editorStore";
import { ZONE_KIND_LABELS } from "../../constants/deviceCatalog";

interface ZoneInspectorProps {
  zone: Zone;
}

const ZONE_KINDS: ZoneKind[] = ["culture_bed", "walkway", "technical_area"];

export function ZoneInspector({ zone }: ZoneInspectorProps) {
  const updateZone = useEditorStore((s) => s.updateZone);
  const removeZone = useEditorStore((s) => s.removeZone);

  return (
    <div className="inspector-form">
      <h3>Zone</h3>

      <label className="field">
        <span>Nom</span>
        <input value={zone.name} onChange={(e) => updateZone(zone.id, { name: e.target.value })} />
      </label>

      <label className="field">
        <span>Type</span>
        <select value={zone.kind} onChange={(e) => updateZone(zone.id, { kind: e.target.value as ZoneKind })}>
          {ZONE_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {ZONE_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </label>

      <div className="field-row">
        <label className="field">
          <span>X</span>
          <input type="number" value={Math.round(zone.x)} onChange={(e) => updateZone(zone.id, { x: Number(e.target.value) })} />
        </label>
        <label className="field">
          <span>Y</span>
          <input type="number" value={Math.round(zone.y)} onChange={(e) => updateZone(zone.id, { y: Number(e.target.value) })} />
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Largeur</span>
          <input
            type="number"
            value={Math.round(zone.width)}
            onChange={(e) => updateZone(zone.id, { width: Math.max(1, Number(e.target.value)) })}
          />
        </label>
        <label className="field">
          <span>Hauteur</span>
          <input
            type="number"
            value={Math.round(zone.height)}
            onChange={(e) => updateZone(zone.id, { height: Math.max(1, Number(e.target.value)) })}
          />
        </label>
      </div>

      <label className="field">
        <span>Notes</span>
        <textarea
          rows={3}
          value={zone.notes ?? ""}
          onChange={(e) => updateZone(zone.id, { notes: e.target.value })}
          placeholder="Ex: culture de pommes de terre, exposition sud..."
        />
      </label>

      <button type="button" className="danger-button" onClick={() => removeZone(zone.id)}>
        Supprimer la zone
      </button>
    </div>
  );
}
