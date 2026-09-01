import { useEditorStore } from "../../store/editorStore";
import { ZoneInspector } from "./ZoneInspector";
import { NodeInspector } from "./NodeInspector";

export function InspectorPanel() {
  const selection = useEditorStore((s) => s.selection);
  const zones = useEditorStore((s) => s.zones);
  const nodes = useEditorStore((s) => s.nodes);

  if (!selection) {
    return (
      <aside className="inspector inspector-empty">
        <p>Sélectionnez une zone ou un équipement sur le plan pour l'éditer.</p>
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

  const node = nodes.find((n) => n.id === selection.id);
  if (!node) return null;
  return (
    <aside className="inspector">
      <NodeInspector node={node} />
    </aside>
  );
}
