import { useEditorStore } from "../../store/editorStore";
import { ZoneInspector } from "./ZoneInspector";
import { NodeInspector } from "./NodeInspector";
import { DoorInspector } from "./DoorInspector";
import { PlantInspector } from "./PlantInspector";
import { PipeInspector } from "./PipeInspector";

export function InspectorPanel() {
  const selection = useEditorStore((s) => s.selection);
  const zones = useEditorStore((s) => s.zones);
  const nodes = useEditorStore((s) => s.nodes);
  const doors = useEditorStore((s) => s.doors);
  const plants = useEditorStore((s) => s.plants);
  const pipes = useEditorStore((s) => s.pipes);
  const duplicateSelected = useEditorStore((s) => s.duplicateSelected);
  const removeSelected = useEditorStore((s) => s.removeSelected);

  if (selection.length === 0) {
    return (
      <aside className="inspector inspector-empty">
        <p>Sélectionnez une zone, une porte ou un équipement sur le plan pour l'éditer.</p>
        <p className="inspector-shortcut-hint">
          Maj/Ctrl+clic pour ajouter à la sélection, ou glisser sur le plan vide pour un cadre de sélection.
        </p>
        <p className="inspector-shortcut-hint">Ctrl/⌘+C puis Ctrl/⌘+V pour copier-coller.</p>
      </aside>
    );
  }

  if (selection.length > 1) {
    return (
      <aside className="inspector">
        <div className="inspector-form">
          <h3>{selection.length} éléments sélectionnés</h3>
          <p className="inspector-subtitle">Zones, capteurs, portes, plantes ou tuyaux confondus</p>
          <div className="inspector-actions">
            <button type="button" className="secondary-button" onClick={() => duplicateSelected()}>
              Dupliquer
            </button>
            <button type="button" className="danger-button" onClick={() => removeSelected()}>
              Supprimer la sélection
            </button>
          </div>
        </div>
      </aside>
    );
  }

  const current = selection[0];

  if (current.kind === "zone") {
    const zone = zones.find((z) => z.id === current.id);
    if (!zone) return null;
    return (
      <aside className="inspector">
        <ZoneInspector zone={zone} />
      </aside>
    );
  }

  if (current.kind === "door") {
    const door = doors.find((d) => d.id === current.id);
    if (!door) return null;
    return (
      <aside className="inspector">
        <DoorInspector door={door} />
      </aside>
    );
  }

  if (current.kind === "plant") {
    const plant = plants.find((p) => p.id === current.id);
    if (!plant) return null;
    return (
      <aside className="inspector">
        <PlantInspector plant={plant} />
      </aside>
    );
  }

  if (current.kind === "pipe") {
    const pipe = pipes.find((p) => p.id === current.id);
    if (!pipe) return null;
    return (
      <aside className="inspector">
        <PipeInspector pipe={pipe} />
      </aside>
    );
  }

  const node = nodes.find((n) => n.id === current.id);
  if (!node) return null;
  return (
    <aside className="inspector">
      <NodeInspector node={node} />
    </aside>
  );
}
