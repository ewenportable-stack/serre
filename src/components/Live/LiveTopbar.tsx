import { useEditorStore } from "../../store/editorStore";

interface LiveTopbarProps {
  onEdit: () => void;
}

export function LiveTopbar({ onEdit }: LiveTopbarProps) {
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
        <button type="button" className="live-view-button" onClick={onEdit}>
          ✏️ Modifier la serre
        </button>
      </div>
    </header>
  );
}
