import { useRef } from "react";
import { Circle, Layer, Line, Stage } from "react-konva";
import type Konva from "konva";
import { useEditorStore } from "../../store/editorStore";
import { GridLayer } from "./GridLayer";
import { ZoneShape } from "./ZoneShape";
import { NodeShape } from "./NodeShape";
import { DoorShape } from "./DoorShape";
import { PlantShape } from "./PlantShape";
import { PipeShape } from "./PipeShape";
import type { DeviceType, PlantSpecies } from "../../types/hypervision";
import { DEVICE_DRAG_MIME, PLANT_DRAG_MIME } from "../Palette/DevicePalette";

export function EditorCanvas() {
  const grid = useEditorStore((s) => s.grid);
  const zones = useEditorStore((s) => s.zones);
  const nodes = useEditorStore((s) => s.nodes);
  const doors = useEditorStore((s) => s.doors);
  const plants = useEditorStore((s) => s.plants);
  const pipes = useEditorStore((s) => s.pipes);
  const pipeDraft = useEditorStore((s) => s.pipeDraft);
  const selection = useEditorStore((s) => s.selection);
  const select = useEditorStore((s) => s.select);
  const addNode = useEditorStore((s) => s.addNode);
  const addPlant = useEditorStore((s) => s.addPlant);
  const addPipeDraftPoint = useEditorStore((s) => s.addPipeDraftPoint);
  const finishPipeDraft = useEditorStore((s) => s.finishPipeDraft);
  const cancelPipeDraft = useEditorStore((s) => s.cancelPipeDraft);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingPipe = pipeDraft !== null;

  const canvasWidth = grid.columns * grid.cellSize;
  const canvasHeight = grid.rows * grid.cellSize;
  const pixelsPerMeter = grid.cellSize / grid.metersPerCell;

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isDrawingPipe) {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (pos) addPipeDraftPoint({ x: pos.x, y: pos.y });
      return;
    }
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

  const draftFlatPoints = pipeDraft?.flatMap((p) => [p.x, p.y]) ?? [];

  return (
    <div className="editor-canvas-wrapper" ref={containerRef} onDragOver={handleDragOver} onDrop={handleDrop}>
      {isDrawingPipe && (
        <div className="pipe-draw-overlay">
          <span>Tuyau : cliquez sur le plan pour ajouter des points ({pipeDraft.length} posé{pipeDraft.length > 1 ? "s" : ""})</span>
          <button type="button" onClick={() => finishPipeDraft()} disabled={pipeDraft.length < 2}>
            Terminer
          </button>
          <button type="button" onClick={() => cancelPipeDraft()}>
            Annuler
          </button>
        </div>
      )}
      <Stage width={canvasWidth} height={canvasHeight} onMouseDown={handleStageMouseDown} onTouchStart={handleStageMouseDown}>
        <GridLayer grid={grid} doors={doors} />
        <Layer listening={!isDrawingPipe}>
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
        <Layer listening={!isDrawingPipe}>
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
        <Layer listening={!isDrawingPipe}>
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
        <Layer listening={!isDrawingPipe}>
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
        <Layer listening={!isDrawingPipe}>
          {pipes.map((pipe) => (
            <PipeShape key={pipe.id} pipe={pipe} isSelected={selection?.kind === "pipe" && selection.id === pipe.id} />
          ))}
        </Layer>
        {isDrawingPipe && (
          <Layer listening={false}>
            {draftFlatPoints.length >= 4 && (
              <Line points={draftFlatPoints} stroke="#2563eb" strokeWidth={3} dash={[6, 4]} lineCap="round" lineJoin="round" />
            )}
            {pipeDraft.map((p, i) => (
              <Circle key={i} x={p.x} y={p.y} radius={5} fill="#2563eb" stroke="#f8fafc" strokeWidth={1} />
            ))}
          </Layer>
        )}
      </Stage>
    </div>
  );
}
