import { useRef } from "react";
import { Layer, Stage } from "react-konva";
import type Konva from "konva";
import { useEditorStore } from "../../store/editorStore";
import { GridLayer } from "./GridLayer";
import { ZoneShape } from "./ZoneShape";
import { NodeShape } from "./NodeShape";
import type { DeviceType } from "../../types/hypervision";
import { DEVICE_DRAG_MIME } from "../Palette/DevicePalette";

export function EditorCanvas() {
  const grid = useEditorStore((s) => s.grid);
  const zones = useEditorStore((s) => s.zones);
  const nodes = useEditorStore((s) => s.nodes);
  const selection = useEditorStore((s) => s.selection);
  const select = useEditorStore((s) => s.select);
  const addNode = useEditorStore((s) => s.addNode);

  const containerRef = useRef<HTMLDivElement>(null);

  const canvasWidth = grid.columns * grid.cellSize;
  const canvasHeight = grid.rows * grid.cellSize;

  const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) {
      select(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes(DEVICE_DRAG_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const deviceType = e.dataTransfer.getData(DEVICE_DRAG_MIME) as DeviceType;
    if (!deviceType || !containerRef.current) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    const y = e.clientY - rect.top + containerRef.current.scrollTop;
    addNode(deviceType, { x, y });
  };

  return (
    <div className="editor-canvas-wrapper" ref={containerRef} onDragOver={handleDragOver} onDrop={handleDrop}>
      <Stage width={canvasWidth} height={canvasHeight} onMouseDown={handleStageMouseDown} onTouchStart={handleStageMouseDown}>
        <GridLayer grid={grid} />
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
      </Stage>
    </div>
  );
}
