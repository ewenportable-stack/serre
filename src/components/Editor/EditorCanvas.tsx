import { useRef, useState } from "react";
import { Circle, Layer, Line, Rect as KonvaRect, Stage } from "react-konva";
import type Konva from "konva";
import { useEditorStore } from "../../store/editorStore";
import { GridLayer } from "./GridLayer";
import { ZoneShape } from "./ZoneShape";
import { NodeShape } from "./NodeShape";
import { DoorShape } from "./DoorShape";
import { PlantShape } from "./PlantShape";
import { PipeShape } from "./PipeShape";
import type { DeviceType, PlantSpecies, Selection } from "../../types/hypervision";
import { DEVICE_DRAG_MIME, PLANT_DRAG_MIME } from "../Palette/DevicePalette";
import { pointInRect, rectsIntersect, type Rect } from "../../utils/geometry";

const MARQUEE_THRESHOLD = 4;

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
  const setSelection = useEditorStore((s) => s.setSelection);
  const addNode = useEditorStore((s) => s.addNode);
  const addPlant = useEditorStore((s) => s.addPlant);
  const addPipeDraftPoint = useEditorStore((s) => s.addPipeDraftPoint);
  const finishPipeDraft = useEditorStore((s) => s.finishPipeDraft);
  const cancelPipeDraft = useEditorStore((s) => s.cancelPipeDraft);

  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const [marqueeRect, setMarqueeRect] = useState<Rect | null>(null);
  const isDrawingPipe = pipeDraft !== null;

  const canvasWidth = grid.columns * grid.cellSize;
  const canvasHeight = grid.rows * grid.cellSize;
  const pixelsPerMeter = grid.cellSize / grid.metersPerCell;

  const isSelected = (kind: Selection["kind"], id: string) => selection.some((s) => s.kind === kind && s.id === id);

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (isDrawingPipe) {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (pos) addPipeDraftPoint({ x: pos.x, y: pos.y });
      return;
    }
    if (e.target === e.target.getStage()) {
      const stage = e.target.getStage();
      const pos = stage?.getPointerPosition();
      if (pos) marqueeStartRef.current = pos;
    }
  };

  const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const start = marqueeStartRef.current;
    if (!start) return;
    const stage = e.target.getStage();
    const pos = stage?.getPointerPosition();
    if (!pos) return;
    const dx = pos.x - start.x;
    const dy = pos.y - start.y;
    if (!marqueeRect && Math.abs(dx) < MARQUEE_THRESHOLD && Math.abs(dy) < MARQUEE_THRESHOLD) return;
    setMarqueeRect({
      x: Math.min(start.x, pos.x),
      y: Math.min(start.y, pos.y),
      width: Math.abs(dx),
      height: Math.abs(dy),
    });
  };

  const handleStageMouseUp = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (!marqueeStartRef.current) return;
    const rect = marqueeRect;
    if (rect) {
      const hits: Selection[] = [
        ...zones.filter((z) => rectsIntersect(rect, { x: z.x, y: z.y, width: z.width, height: z.height })).map((z) => ({ kind: "zone" as const, id: z.id })),
        ...nodes.filter((n) => pointInRect(rect, n.x, n.y)).map((n) => ({ kind: "node" as const, id: n.id })),
        ...plants.filter((p) => pointInRect(rect, p.x, p.y)).map((p) => ({ kind: "plant" as const, id: p.id })),
        ...pipes.filter((p) => p.points.some((pt) => pointInRect(rect, pt.x, pt.y))).map((p) => ({ kind: "pipe" as const, id: p.id })),
      ];
      const shiftHeld = e.evt.shiftKey;
      if (shiftHeld) {
        const merged = [...selection];
        for (const hit of hits) {
          if (!merged.some((s) => s.kind === hit.kind && s.id === hit.id)) merged.push(hit);
        }
        setSelection(merged);
      } else {
        setSelection(hits);
      }
    } else if (e.target === e.target.getStage()) {
      select(null);
    }
    marqueeStartRef.current = null;
    setMarqueeRect(null);
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
      {!isDrawingPipe && selection.length > 1 && (
        <div className="pipe-draw-overlay">
          <span>{selection.length} éléments sélectionnés</span>
        </div>
      )}
      <Stage
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={handleStageMouseDown}
        onMouseMove={handleStageMouseMove}
        onMouseUp={handleStageMouseUp}
        onTouchStart={handleStageMouseDown}
        onTouchMove={handleStageMouseMove}
        onTouchEnd={handleStageMouseUp}
      >
        <GridLayer grid={grid} doors={doors} />
        <Layer listening={!isDrawingPipe}>
          {zones.map((zone) => (
            <ZoneShape
              key={zone.id}
              zone={zone}
              isSelected={isSelected("zone", zone.id)}
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
              isSelected={isSelected("plant", plant.id)}
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
              isSelected={isSelected("node", node.id)}
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
              isSelected={isSelected("door", door.id)}
              pixelsPerMeter={pixelsPerMeter}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
            />
          ))}
        </Layer>
        <Layer listening={!isDrawingPipe}>
          {pipes.map((pipe) => (
            <PipeShape key={pipe.id} pipe={pipe} isSelected={isSelected("pipe", pipe.id)} />
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
        {marqueeRect && (
          <Layer listening={false}>
            <KonvaRect
              x={marqueeRect.x}
              y={marqueeRect.y}
              width={marqueeRect.width}
              height={marqueeRect.height}
              fill="rgba(37, 99, 235, 0.08)"
              stroke="#2563eb"
              strokeWidth={1}
              dash={[4, 3]}
            />
          </Layer>
        )}
      </Stage>
    </div>
  );
}
