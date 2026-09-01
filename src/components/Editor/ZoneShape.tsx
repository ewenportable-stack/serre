import { useEffect, useRef } from "react";
import { Group, Rect, Text, Transformer } from "react-konva";
import type Konva from "konva";
import type { Zone } from "../../types/hypervision";
import { useEditorStore } from "../../store/editorStore";
import { snapValue, clamp } from "../../utils/snap";

interface ZoneShapeProps {
  zone: Zone;
  isSelected: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export function ZoneShape({ zone, isSelected, canvasWidth, canvasHeight }: ZoneShapeProps) {
  const rectRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const grid = useEditorStore((s) => s.grid);
  const select = useEditorStore((s) => s.select);
  const updateZone = useEditorStore((s) => s.updateZone);

  useEffect(() => {
    if (isSelected && trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const strokeColor = zone.kind === "culture_bed" ? "#65a30d" : zone.kind === "walkway" ? "#64748b" : "#9333ea";

  return (
    <>
      <Group
        onClick={() => select({ kind: "zone", id: zone.id })}
        onTap={() => select({ kind: "zone", id: zone.id })}
      >
        <Rect
          ref={rectRef}
          x={zone.x}
          y={zone.y}
          width={zone.width}
          height={zone.height}
          fill={zone.color}
          stroke={strokeColor}
          strokeWidth={isSelected ? 2 : 1}
          cornerRadius={4}
          draggable
          dragBoundFunc={(pos) => ({
            x: clamp(snapValue(pos.x, grid.cellSize, grid.snapToGrid), 0, canvasWidth - zone.width),
            y: clamp(snapValue(pos.y, grid.cellSize, grid.snapToGrid), 0, canvasHeight - zone.height),
          })}
          onDragEnd={(e) => {
            updateZone(zone.id, { x: e.target.x(), y: e.target.y() });
          }}
          onTransformEnd={() => {
            const node = rectRef.current;
            if (!node) return;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();
            node.scaleX(1);
            node.scaleY(1);
            updateZone(zone.id, {
              x: snapValue(node.x(), grid.cellSize, grid.snapToGrid),
              y: snapValue(node.y(), grid.cellSize, grid.snapToGrid),
              width: Math.max(grid.cellSize, snapValue(node.width() * scaleX, grid.cellSize, grid.snapToGrid)),
              height: Math.max(grid.cellSize, snapValue(node.height() * scaleY, grid.cellSize, grid.snapToGrid)),
            });
          }}
        />
        <Text
          x={zone.x + 6}
          y={zone.y + 6}
          text={zone.name}
          fontSize={13}
          fill="#1e293b"
          listening={false}
        />
      </Group>
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={false}
          keepRatio={false}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < grid.cellSize || newBox.height < grid.cellSize) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
