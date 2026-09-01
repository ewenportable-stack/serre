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

  if (!selection) {
    return (
      <aside className="inspector inspector-empty">
        <p>Sélectionnez une zone, une porte ou un équipement sur le plan pour l'éditer.</p>
        <p className="inspector-shortcut-hint">Ctrl/⌘+C puis Ctrl/⌘+V pour copier-coller un élément sélectionné.</p>
      </aside>
    );
  }

  if (selection.kind === "zone") {
    const zone = zones.find((z) => z.id === selection.id);
    if (!zone) return null;
    return (
      <aside className="inspector">
        <ZoneInspector zone={zone} />
      </aside>
    );
  }

  if (selection.kind === "door") {
    const door = doors.find((d) => d.id === selection.id);
    if (!door) return null;
    return (
      <aside className="inspector">
        <DoorInspector door={door} />
      </aside>
    );
  }

  if (selection.kind === "plant") {
    const plant = plants.find((p) => p.id === selection.id);
    if (!plant) return null;
    return (
      <aside className="inspector">
        <PlantInspector plant={plant} />
      </aside>
    );
  }

  if (selection.kind === "pipe") {
    const pipe = pipes.find((p) => p.id === selection.id);
    if (!pipe) return null;
    return (
      <aside className="inspector">
        <PipeInspector pipe={pipe} />
      </aside>
    );
  }

  const node = nodes.find((n) => n.id === selection.id);
  if (!node) return null;
  return (
    <aside className="inspector">
      <NodeInspector node={node} />
    </aside>
  );
}
