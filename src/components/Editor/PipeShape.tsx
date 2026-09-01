import { Circle, Group, Line } from "react-konva";
import type { Pipe } from "../../types/hypervision";
import { useEditorStore } from "../../store/editorStore";

interface PipeShapeProps {
  pipe: Pipe;
  isSelected: boolean;
}

export function PipeShape({ pipe, isSelected }: PipeShapeProps) {
  const select = useEditorStore((s) => s.select);
  const updatePipe = useEditorStore((s) => s.updatePipe);

  const flatPoints = pipe.points.flatMap((p) => [p.x, p.y]);
  const handleSelect = () => select({ kind: "pipe", id: pipe.id });

  return (
    <Group>
      <Line
        points={flatPoints}
        stroke={isSelected ? "#2563eb" : "#0891b2"}
        strokeWidth={isSelected ? 4 : 3}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={16}
        onClick={handleSelect}
        onTap={handleSelect}
      />
      {isSelected &&
        pipe.points.map((pt, i) => (
          <Circle
            key={i}
            x={pt.x}
            y={pt.y}
            radius={5}
            fill="#2563eb"
            stroke="#f8fafc"
            strokeWidth={1}
            draggable
            onDragEnd={(e) => {
              const points = pipe.points.map((p, idx) => (idx === i ? { x: e.target.x(), y: e.target.y() } : p));
              updatePipe(pipe.id, { points });
            }}
          />
        ))}
    </Group>
  );
}
