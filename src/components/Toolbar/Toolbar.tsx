import { useEffect, useRef, useState } from "react";
import { useEditorStore } from "../../store/editorStore";
import { downloadConfig, parseConfigFile } from "../../utils/export";

interface ToolbarProps {
  onBackToLive: () => void;
}

export function Toolbar({ onBackToLive }: ToolbarProps) {
  const greenhouseName = useEditorStore((s) => s.greenhouseName);
  const setGreenhouseName = useEditorStore((s) => s.setGreenhouseName);
  const grid = useEditorStore((s) => s.grid);
  const setGrid = useEditorStore((s) => s.setGrid);
  const setStructureDimensions = useEditorStore((s) => s.setStructureDimensions);
  const exportConfig = useEditorStore((s) => s.exportConfig);
  const loadConfig = useEditorStore((s) => s.loadConfig);
  const zoneCount = useEditorStore((s) => s.zones.length);
  const nodeCount = useEditorStore((s) => s.nodes.length);
  const plantCount = useEditorStore((s) => s.plants.length);
  const doorCount = useEditorStore((s) => s.doors.length);
  const pipeCount = useEditorStore((s) => s.pipes.length);

  const widthMeters = Math.round(grid.columns * grid.metersPerCell * 10) / 10;
  const heightMeters = Math.round(grid.rows * grid.metersPerCell * 10) / 10;

  const [widthInput, setWidthInput] = useState(String(widthMeters));
  const [heightInput, setHeightInput] = useState(String(heightMeters));

  useEffect(() => setWidthInput(String(widthMeters)), [widthMeters]);
  useEffect(() => setHeightInput(String(heightMeters)), [heightMeters]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const commitDimensions = (nextWidth: string, nextHeight: string) => {
    const w = Number(nextWidth);
    const h = Number(nextHeight);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      setStructureDimensions(w, h);
    }
  };

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

      <div className="dimensions-group">
        <label className="field-inline">
          <span>Largeur</span>
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={widthInput}
            onChange={(e) => setWidthInput(e.target.value)}
            onBlur={() => commitDimensions(widthInput, heightInput)}
          />
          <span className="unit">m</span>
        </label>
        <span className="dimensions-x">×</span>
        <label className="field-inline">
          <input
            type="number"
            min={0.5}
            step={0.5}
            value={heightInput}
            onChange={(e) => setHeightInput(e.target.value)}
            onBlur={() => commitDimensions(widthInput, heightInput)}
          />
          <span className="unit">m</span>
        </label>
      </div>

      <div className="toolbar-stats">
        <span>{zoneCount} zone(s)</span>
        <span>{plantCount} plante(s)</span>
        <span>{nodeCount} équipement(s)</span>
        <span>{doorCount} porte(s)</span>
        <span>{pipeCount} tuyau(x)</span>
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

        <button type="button" className="live-view-button" onClick={onBackToLive}>
          📡 Vue live
        </button>
      </div>
    </header>
  );
}
