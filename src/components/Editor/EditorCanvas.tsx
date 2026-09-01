import { useRef } from "react";
import { Layer, Stage } from "react-konva";
import type Konva from "konva";
import { useEditorStore } from "../../store/editorStore";
import { GridLayer } from "./GridLayer";
import { ZoneShape } from "./ZoneShape";
import { NodeShape } from "./NodeShape";
import { DoorShape } from "./DoorShape";
import { PlantShape } from "./PlantShape";
import type { DeviceType, PlantSpecies } from "../../types/hypervision";
import { DEVICE_DRAG_MIME, PLANT_DRAG_MIME } from "../Palette/DevicePalette";

export function EditorCanvas() {
  const grid = useEditorStore((s) => s.grid);
  const zones = useEditorStore((s) => s.zones);
  const nodes = useEditorStore((s) => s.nodes);
  const doors = useEditorStore((s) => s.doors);
  const plants = useEditorStore((s) => s.plants);
  const selection = useEditorStore((s) => s.selection);
  const select = useEditorStore((s) => s.select);
  const addNode = useEditorStore((s) => s.addNode);
  const addPlant = useEditorStore((s) => s.addPlant);

  const containerRef = useRef<HTMLDivElement>(null);

  const canvasWidth = grid.columns * grid.cellSize;
  const canvasHeight = grid.rows * grid.cellSize;
  const pixelsPerMeter = grid.cellSize / grid.metersPerCell;

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) {
      select(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes(DEVICE_DRAG_MIME) || e.dataTransfer.types.includes(PLANT_DRAG_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const deviceType = e.dataTransfer.getData(DEVICE_DRAG_MIME) as DeviceType;
    const plantSpecies = e.dataTransfer.getData(PLANT_DRAG_MIME) as PlantSpecies;
    if (!deviceType && !plantSpecies) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const y = e.clientY - rect.top + containerRef.current.scrollTop;
    if (deviceType) addNode(deviceType, { x, y });
    else addPlant(plantSpecies, { x, y });
  };

  return (
    <div className="editor-canvas-wrapper" ref={containerRef} onDragOver={handleDragOver} onDrop={handleDrop}>
      <Stage width={canvasWidth} height={canvasHeight} onMouseDown={handleStageMouseDown} onTouchStart={handleStageMouseDown}>
        <GridLayer grid={grid} doors={doors} />
        <Layer>
          {zones.map((zone) => (
            <ZoneShape
              key={zone.id}
              zone={zone}
              isSelected={selection?.kind === "zone" && selection.id === zone.id}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          ))}
        </Layer>
        <Layer>
          {plants.map((plant) => (
            <PlantShape
              key={plant.id}
              plant={plant}
              isSelected={selection?.kind === "plant" && selection.id === plant.id}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          ))}
        </Layer>
        <Layer>
          {nodes.map((node) => (
            <NodeShape
              key={node.id}
              node={node}
              isSelected={selection?.kind === "node" && selection.id === node.id}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          ))}
        </Layer>
        <Layer>
          {doors.map((door) => (
            <DoorShape
              key={door.id}
              door={door}
              isSelected={selection?.kind === "door" && selection.id === door.id}
              pixelsPerMeter={pixelsPerMeter}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
}
