import type { Pipe } from "../../types/hypervision";
import { useEditorStore } from "../../store/editorStore";

interface PipeInspectorProps {
  pipe: Pipe;
}

export function PipeInspector({ pipe }: PipeInspectorProps) {
  const updatePipe = useEditorStore((s) => s.updatePipe);
  const removePipe = useEditorStore((s) => s.removePipe);

  return (
    <div className="inspector-form">
      <h3>Tuyau d'arrosage</h3>
      <p className="inspector-subtitle">{pipe.points.length} points · glissez les points sur le plan pour ajuster le tracé</p>

      <label className="field">
        <span>Libellé (optionnel)</span>
        <input
          value={pipe.label ?? ""}
          onChange={(e) => updatePipe(pipe.id, { label: e.target.value || undefined })}
          placeholder="Ex: Ligne principale"
        />
      </label>

      <label className="field">
        <span>Diamètre (mm, optionnel)</span>
        <input
          type="number"
          min={1}
          value={pipe.diameterMm ?? ""}
          onChange={(e) => updatePipe(pipe.id, { diameterMm: e.target.value ? Number(e.target.value) : undefined })}
          placeholder="Ex: 16"
        />
      </label>

      <label className="field">
        <span>Notes</span>
        <textarea rows={3} value={pipe.notes ?? ""} onChange={(e) => updatePipe(pipe.id, { notes: e.target.value })} />
      </label>

      <button type="button" className="danger-button" onClick={() => removePipe(pipe.id)}>
        Supprimer le tuyau
      </button>
    </div>
  );
}
