import { Circle, Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { DeviceNode } from "../../types/hypervision";
import { DEFAULT_NODE_SIZE, getDeviceCatalogEntry } from "../../constants/deviceCatalog";
import { useEditorStore } from "../../store/editorStore";
import { snapValue, clamp } from "../../utils/snap";

interface NodeShapeProps {
  node: DeviceNode;
  isSelected: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export function NodeShape({ node, isSelected, canvasWidth, canvasHeight }: NodeShapeProps) {
  const grid = useEditorStore((s) => s.grid);
  const select = useEditorStore((s) => s.select);
  const toggleSelection = useEditorStore((s) => s.toggleSelection);
  const updateNode = useEditorStore((s) => s.updateNode);
  const selectionCount = useEditorStore((s) => s.selection.length);
  const beginGroupDrag = useEditorStore((s) => s.beginGroupDrag);
  const applyGroupDragDelta = useEditorStore((s) => s.applyGroupDragDelta);
  const endGroupDrag = useEditorStore((s) => s.endGroupDrag);
  const entry = getDeviceCatalogEntry(node.type);

  const isGroupDrag = isSelected && selectionCount > 1;
  const radius = node.size ?? DEFAULT_NODE_SIZE;
  const labelWidth = Math.max(80, radius * 6);

  const handleSelect = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
      toggleSelection({ kind: "node", id: node.id });
    } else {
      select({ kind: "node", id: node.id });
    }
  };

  const shape =
    node.category === "sensor" ? (
      <Circle radius={radius} fill={entry.color} stroke="#1e293b" strokeWidth={isSelected ? 2 : 1} />
    ) : (
      <Rect
        x={-radius}
        y={-radius}
        width={radius * 2}
        height={radius * 2}
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
      onTap={() => select({ kind: "node", id: node.id })}
      dragBoundFunc={(pos) => ({
        x: clamp(snapValue(pos.x, grid.cellSize, grid.snapToGrid), 0, canvasWidth),
        y: clamp(snapValue(pos.y, grid.cellSize, grid.snapToGrid), 0, canvasHeight),
      })}
      onDragStart={() => {
        if (isGroupDrag) beginGroupDrag();
      }}
      onDragMove={(e) => {
        if (isGroupDrag) {
          applyGroupDragDelta(e.target.x() - node.x, e.target.y() - node.y, "node", node.id);
        }
      }}
      onDragEnd={(e) => {
        updateNode(node.id, { x: e.target.x(), y: e.target.y() });
        if (isGroupDrag) endGroupDrag();
      }}
    >
      {shape}
      {isSelected && (
        <Circle radius={radius + 4} stroke="#2563eb" strokeWidth={1.5} dash={[3, 2]} />
      )}
      <Text
        text={node.label}
        x={-labelWidth / 2}
        y={radius + 4}
        width={labelWidth}
        align="center"
        fontSize={11}
        fill="#334155"
        listening={false}
      />
    </Group>
  );
}
