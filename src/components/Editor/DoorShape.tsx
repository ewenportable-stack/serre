import { Group, Rect } from "react-konva";
import type Konva from "konva";
import type { Door } from "../../types/hypervision";
import { useEditorStore } from "../../store/editorStore";
import { clamp } from "../../utils/snap";

interface DoorShapeProps {
  door: Door;
  isSelected: boolean;
  pixelsPerMeter: number;
  canvasWidth: number;
  canvasHeight: number;
}

export function DoorShape({ door, isSelected, pixelsPerMeter, canvasWidth, canvasHeight }: DoorShapeProps) {
  const select = useEditorStore((s) => s.select);
  const toggleSelection = useEditorStore((s) => s.toggleSelection);
  const updateDoor = useEditorStore((s) => s.updateDoor);

  const widthPx = door.widthMeters * pixelsPerMeter;
  const offsetPx = door.offsetMeters * pixelsPerMeter;
  const horizontal = door.wall === "north" || door.wall === "south";
  const wallLengthPx = horizontal ? canvasWidth : canvasHeight;

  const pos =
    door.wall === "north"
      ? { x: offsetPx, y: 0 }
      : door.wall === "south"
        ? { x: offsetPx, y: canvasHeight }
        : door.wall === "west"
          ? { x: 0, y: offsetPx }
          : { x: canvasWidth, y: offsetPx };

  const handleSelect = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
      toggleSelection({ kind: "door", id: door.id });
    } else {
      select({ kind: "door", id: door.id });
    }
  };
  const half = widthPx / 2;

  return (
    <Group
      x={pos.x}
      y={pos.y}
      draggable
      onClick={handleSelect}
      onTap={() => select({ kind: "door", id: door.id })}
      dragBoundFunc={(p) =>
        horizontal
          ? { x: clamp(p.x, half, Math.max(half, wallLengthPx - half)), y: pos.y }
          : { x: pos.x, y: clamp(p.y, half, Math.max(half, wallLengthPx - half)) }
      }
      onDragEnd={(e) => {
        const newOffsetPx = horizontal ? e.target.x() : e.target.y();
        updateDoor(door.id, { offsetMeters: newOffsetPx / pixelsPerMeter });
      }}
    >
      {horizontal ? (
        <Rect
          x={-half}
          y={-4}
          width={widthPx}
          height={8}
          fill={isSelected ? "#2563eb" : "#92400e"}
          stroke="#f8fafc"
          strokeWidth={1}
          cornerRadius={2}
        />
      ) : (
        <Rect
          x={-4}
          y={-half}
          width={8}
          height={widthPx}
          fill={isSelected ? "#2563eb" : "#92400e"}
          stroke="#f8fafc"
          strokeWidth={1}
          cornerRadius={2}
        />
      )}
    </Group>
  );
}
