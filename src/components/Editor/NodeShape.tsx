import { Circle, Group, Rect, Text } from "react-konva";
import type { DeviceNode } from "../../types/hypervision";
import { getDeviceCatalogEntry } from "../../constants/deviceCatalog";
import { useEditorStore } from "../../store/editorStore";
import { snapValue, clamp } from "../../utils/snap";

interface NodeShapeProps {
  node: DeviceNode;
  isSelected: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

const NODE_RADIUS = 12;

export function NodeShape({ node, isSelected, canvasWidth, canvasHeight }: NodeShapeProps) {
  const grid = useEditorStore((s) => s.grid);
  const select = useEditorStore((s) => s.select);
  const updateNode = useEditorStore((s) => s.updateNode);
  const entry = getDeviceCatalogEntry(node.type);

  const handleSelect = () => select({ kind: "node", id: node.id });

  const shape =
    node.category === "sensor" ? (
      <Circle radius={NODE_RADIUS} fill={entry.color} stroke="#1e293b" strokeWidth={isSelected ? 2 : 1} />
    ) : (
      <Rect
        x={-NODE_RADIUS}
        y={-NODE_RADIUS}
        width={NODE_RADIUS * 2}
        height={NODE_RADIUS * 2}
        fill={entry.color}
        stroke="#1e293b"
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={3}
      />
    );

  return (
    <Group
      x={node.x}
      y={node.y}
      draggable
      onClick={handleSelect}
      onTap={handleSelect}
      dragBoundFunc={(pos) => ({
        x: clamp(snapValue(pos.x, grid.cellSize, grid.snapToGrid), 0, canvasWidth),
        y: clamp(snapValue(pos.y, grid.cellSize, grid.snapToGrid), 0, canvasHeight),
      })}
      onDragEnd={(e) => {
        updateNode(node.id, { x: e.target.x(), y: e.target.y() });
      }}
    >
      {shape}
      {isSelected && (
        <Circle radius={NODE_RADIUS + 4} stroke="#2563eb" strokeWidth={1.5} dash={[3, 2]} />
      )}
      <Text
        text={node.label}
        x={-40}
        y={NODE_RADIUS + 4}
        width={80}
        align="center"
        fontSize={11}
        fill="#334155"
        listening={false}
      />
    </Group>
  );
}
