import { useRef } from "react";
import { useEditorStore } from "../../store/editorStore";
import { downloadConfig, parseConfigFile } from "../../utils/export";

export function Toolbar() {
  const greenhouseName = useEditorStore((s) => s.greenhouseName);
  const setGreenhouseName = useEditorStore((s) => s.setGreenhouseName);
  const grid = useEditorStore((s) => s.grid);
  const setGrid = useEditorStore((s) => s.setGrid);
  const exportConfig = useEditorStore((s) => s.exportConfig);
  const loadConfig = useEditorStore((s) => s.loadConfig);
  const zoneCount = useEditorStore((s) => s.zones.length);
  const nodeCount = useEditorStore((s) => s.nodes.length);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    downloadConfig(exportConfig());
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      loadConfig(parseConfigFile(text));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impossible de lire ce fichier.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <header className="toolbar">
      <div className="toolbar-title">
        <span className="toolbar-logo">🌱</span>
        <input
          className="greenhouse-name-input"
          value={greenhouseName}
          onChange={(e) => setGreenhouseName(e.target.value)}
        />
      </div>

      <div className="toolbar-stats">
        <span>{zoneCount} zone(s)</span>
        <span>{nodeCount} équipement(s)</span>
      </div>

      <div className="toolbar-actions">
        <label className="toolbar-toggle">
          <input
            type="checkbox"
            checked={grid.snapToGrid}
            onChange={(e) => setGrid({ snapToGrid: e.target.checked })}
          />
          Aligner sur la grille
        </label>

        <button type="button" onClick={handleImportClick}>
          Importer
        </button>
        <input ref={fileInputRef} type="file" accept="application/json" hidden onChange={handleFileChange} />

        <button type="button" className="primary-button" onClick={handleSave}>
          Sauvegarder
        </button>
      </div>
    </header>
  );
}
