import type { Plant } from "../../types/hypervision";
import { useEditorStore } from "../../store/editorStore";
import { getPlantCatalogEntry } from "../../constants/deviceCatalog";

interface PlantInspectorProps {
  plant: Plant;
}

export function PlantInspector({ plant }: PlantInspectorProps) {
  const updatePlant = useEditorStore((s) => s.updatePlant);
  const removePlant = useEditorStore((s) => s.removePlant);
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected);
  const zones = useEditorStore((s) => s.zones);
  const entry = getPlantCatalogEntry(plant.species);
  const zone = zones.find((z) => z.id === plant.zoneId);

  return (
    <div className="inspector-form">
      <h3>Plante</h3>
      <p className="inspector-subtitle">{entry.label}</p>

      <label className="field">
        <span>Variété (optionnel)</span>
        <input
          value={plant.variety ?? ""}
          onChange={(e) => updatePlant(plant.id, { variety: e.target.value || undefined })}
          placeholder="Ex: Cœur de bœuf"
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>X</span>
          <input type="number" value={Math.round(plant.x)} onChange={(e) => updatePlant(plant.id, { x: Number(e.target.value) })} />
        </label>
        <label className="field">
          <span>Y</span>
          <input type="number" value={Math.round(plant.y)} onChange={(e) => updatePlant(plant.id, { y: Number(e.target.value) })} />
        </label>
      </div>

      <div className="field readonly-field">
        <span>Zone rattachée</span>
        <div>{zone ? zone.name : "Aucune (hors zone)"}</div>
      </div>

      <label className="field">
        <span>Date de plantation (optionnel)</span>
        <input
          type="date"
          value={plant.plantedAt ?? ""}
          onChange={(e) => updatePlant(plant.id, { plantedAt: e.target.value || undefined })}
        />
      </label>

      <label className="field">
        <span>Notes</span>
        <textarea rows={3} value={plant.notes ?? ""} onChange={(e) => updatePlant(plant.id, { notes: e.target.value })} />
      </label>

      <div className="inspector-actions">
        <button type="button" className="secondary-button" onClick={() => duplicateSelected()}>
          Dupliquer
        </button>
        <button type="button" className="danger-button" onClick={() => removePlant(plant.id)}>
          Supprimer la plante
        </button>
      </div>
    </div>
  );
}
