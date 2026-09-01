import type { Door, Wall } from "../../types/hypervision";
import { useEditorStore } from "../../store/editorStore";

interface DoorInspectorProps {
  door: Door;
}

const WALLS: Wall[] = ["north", "south", "east", "west"];
const WALL_LABELS: Record<Wall, string> = { north: "Nord", south: "Sud", east: "Est", west: "Ouest" };

export function DoorInspector({ door }: DoorInspectorProps) {
  const updateDoor = useEditorStore((s) => s.updateDoor);
  const removeDoor = useEditorStore((s) => s.removeDoor);

  return (
    <div className="inspector-form">
      <h3>Porte</h3>

      <label className="field">
        <span>Mur</span>
        <select value={door.wall} onChange={(e) => updateDoor(door.id, { wall: e.target.value as Wall })}>
          {WALLS.map((w) => (
            <option key={w} value={w}>
              {WALL_LABELS[w]}
            </option>
          ))}
        </select>
      </label>

      <div className="field-row">
        <label className="field">
          <span>Position (m)</span>
          <input
            type="number"
            step={0.1}
            value={Math.round(door.offsetMeters * 10) / 10}
            onChange={(e) => updateDoor(door.id, { offsetMeters: Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Largeur (m)</span>
          <input
            type="number"
            step={0.1}
            min={0.4}
            value={door.widthMeters}
            onChange={(e) => updateDoor(door.id, { widthMeters: Math.max(0.4, Number(e.target.value)) })}
          />
        </label>
      </div>

      <label className="field">
        <span>Libellé (optionnel)</span>
        <input
          value={door.label ?? ""}
          onChange={(e) => updateDoor(door.id, { label: e.target.value || undefined })}
          placeholder="Ex: Entrée principale"
        />
      </label>

      <button type="button" className="danger-button" onClick={() => removeDoor(door.id)}>
        Supprimer la porte
      </button>
    </div>
  );
}
