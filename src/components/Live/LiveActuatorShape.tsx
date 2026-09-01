import { Circle, Group, Rect, Text } from "react-konva";
import type Konva from "konva";
import type { DeviceNode } from "../../types/hypervision";
import { DEFAULT_NODE_SIZE, getDeviceCatalogEntry } from "../../constants/deviceCatalog";
import { useIsActuatorOn } from "../../store/liveStore";

interface LiveActuatorShapeProps {
  node: DeviceNode;
  onOpen: () => void;
}

const ON_COLOR = "#16a34a";
const OFF_COLOR = "#94a3b8";

export function LiveActuatorShape({ node, onOpen }: LiveActuatorShapeProps) {
  const isOn = useIsActuatorOn(node.id);
  const entry = getDeviceCatalogEntry(node.type);
  const radius = node.size ?? DEFAULT_NODE_SIZE;

  const setCursor = (cursor: string) => (e: Konva.KonvaEventObject<Event>) => {
    const stage = e.target.getStage();
    if (stage) stage.container().style.cursor = cursor;
  };

  return (
    <Group x={node.x} y={node.y} onClick={onOpen} onTap={onOpen} onMouseEnter={setCursor("pointer")} onMouseLeave={setCursor("default")}>
      {isOn && <Circle radius={radius + 6} fill={entry.color} opacity={0.25} listening={false} />}
      <Rect
        x={-radius}
        y={-radius}
        width={radius * 2}
        height={radius * 2}
        fill={isOn ? entry.color : "#e2e8f0"}
        stroke={isOn ? "#1e293b" : "#94a3b8"}
        strokeWidth={isOn ? 2 : 1}
        cornerRadius={3}
      />
      <Text
        text={node.label}
        x={-45}
        y={radius + 4}
        width={90}
        align="center"
        fontSize={10}
        fill="#334155"
        wrap="none"
        ellipsis
        listening={false}
      />
      <Rect x={-24} y={radius + 16} width={48} height={16} cornerRadius={8} fill={isOn ? ON_COLOR : OFF_COLOR} listening={false} />
      <Text
        text={isOn ? "MARCHE" : "ARRÊT"}
        x={-24}
        y={radius + 19}
        width={48}
        align="center"
        fontSize={9}
        fontStyle="bold"
        fill="#ffffff"
        listening={false}
      />
    </Group>
  );
}
