import { useState } from "react";
import { DEVICE_CATALOG, PLANT_CATALOG } from "../../constants/deviceCatalog";
import type { DeviceType, PlantSpecies, Wall, ZoneKind } from "../../types/hypervision";
import { useEditorStore } from "../../store/editorStore";

export const DEVICE_DRAG_MIME = "application/x-hypervision-device";
export const PLANT_DRAG_MIME = "application/x-hypervision-plant";

const ZONE_TOOLS: { kind: ZoneKind; label: string; hint: string }[] = [
  { kind: "culture_bed", label: "Butte de culture", hint: "Zone de culture (pommes de terre, haricots...)" },
  { kind: "walkway", label: "Allée", hint: "Zone de passage" },
  { kind: "technical_area", label: "Zone technique", hint: "Réservoir, armoire électrique..." },
];

const WALL_OPTIONS: { wall: Wall; label: string }[] = [
  { wall: "north", label: "Nord" },
  { wall: "south", label: "Sud" },
  { wall: "east", label: "Est" },
  { wall: "west", label: "Ouest" },
];

export function DevicePalette() {
  const addZone = useEditorStore((s) => s.addZone);
  const addDoor = useEditorStore((s) => s.addDoor);
  const [doorWall, setDoorWall] = useState<Wall>("south");

  const handleDeviceDragStart = (event: React.DragEvent<HTMLDivElement>, type: DeviceType) => {
    event.dataTransfer.setData(DEVICE_DRAG_MIME, type);
    event.dataTransfer.effectAllowed = "copy";
  };

  const handlePlantDragStart = (event: React.DragEvent<HTMLDivElement>, species: PlantSpecies) => {
    event.dataTransfer.setData(PLANT_DRAG_MIME, species);
    event.dataTransfer.effectAllowed = "copy";
  };

  const sensors = DEVICE_CATALOG.filter((d) => d.category === "sensor");
  const actuators = DEVICE_CATALOG.filter((d) => d.category === "actuator");

  return (
    <aside className="palette">
      <section className="palette-section">
        <h3>Zones</h3>
        <p className="palette-hint">Cliquer pour ajouter au plan</p>
        <div className="palette-list">
          {ZONE_TOOLS.map((tool) => (
            <button key={tool.kind} type="button" className="palette-item palette-zone" onClick={() => addZone(tool.kind)} title={tool.hint}>
              <span className="palette-swatch zone-swatch" data-kind={tool.kind} />
              {tool.label}
            </button>
          ))}
        </div>
      </section>

      <section className="palette-section">
        <h3>Contour de la serre</h3>
        <p className="palette-hint">Ajouter une porte sur un mur</p>
        <div className="door-picker">
          <select value={doorWall} onChange={(e) => setDoorWall(e.target.value as Wall)}>
            {WALL_OPTIONS.map((w) => (
              <option key={w.wall} value={w.wall}>
                Mur {w.label}
              </option>
            ))}
          </select>
          <button type="button" onClick={() => addDoor(doorWall)}>
            + Porte
          </button>
        </div>
        <p className="palette-hint">Glisser une porte le long de son mur une fois posée</p>
      </section>

      <section className="palette-section">
        <h3>Plantes</h3>
        <p className="palette-hint">Glisser-déposer sur le plan</p>
        <div className="palette-list">
          {PLANT_CATALOG.map((entry) => (
            <div
              key={entry.species}
              className="palette-item palette-device"
              draggable
              onDragStart={(e) => handlePlantDragStart(e, entry.species)}
              title={entry.label}
            >
              <span className="palette-swatch" style={{ background: entry.color, borderRadius: "50%" }} />
              {entry.label}
            </div>
          ))}
        </div>
      </section>

      <section className="palette-section">
        <h3>Capteurs</h3>
        <p className="palette-hint">Glisser-déposer sur le plan</p>
        <div className="palette-list">
          {sensors.map((entry) => (
            <div
              key={entry.type}
              className="palette-item palette-device"
              draggable
              onDragStart={(e) => handleDeviceDragStart(e, entry.type)}
              title={entry.description}
            >
              <span className="palette-swatch" style={{ background: entry.color, borderRadius: "50%" }} />
              {entry.label}
            </div>
          ))}
        </div>
      </section>

      <section className="palette-section">
        <h3>Actionneurs</h3>
        <p className="palette-hint">Glisser-déposer sur le plan</p>
        <div className="palette-list">
          {actuators.map((entry) => (
            <div
              key={entry.type}
              className="palette-item palette-device"
              draggable
              onDragStart={(e) => handleDeviceDragStart(e, entry.type)}
              title={entry.description}
            >
              <span className="palette-swatch" style={{ background: entry.color, borderRadius: 3 }} />
              {entry.label}
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}
