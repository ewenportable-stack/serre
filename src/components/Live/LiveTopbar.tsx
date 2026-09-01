import { useEditorStore } from "../../store/editorStore";

export function LiveTopbar() {
  const greenhouseName = useEditorStore((s) => s.greenhouseName);
  const zoneCount = useEditorStore((s) => s.zones.length);
  const nodeCount = useEditorStore((s) => s.nodes.length);

  return (
    <header className="toolbar">
      <div className="toolbar-title">
        <span className="toolbar-logo">📡</span>
        <span className="live-title">{greenhouseName}</span>
      </div>
      <div className="toolbar-stats">
        <span>{zoneCount} zone(s)</span>
        <span>{nodeCount} équipement(s)</span>
      </div>
      <div className="toolbar-actions">
        <span className="live-hint">Cliquez un actionneur pour l'activer · cliquez un capteur pour son détail</span>
      </div>
    </header>
  );
}
