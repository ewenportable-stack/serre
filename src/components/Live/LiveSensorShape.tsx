import { Circle, Group, Text } from "react-konva";
import type Konva from "konva";
import type { DeviceNode } from "../../types/hypervision";
import { DEFAULT_NODE_SIZE, getDeviceCatalogEntry } from "../../constants/deviceCatalog";
import { useLiveStore } from "../../store/liveStore";
import { formatSensorValue } from "../../utils/sensorFormat";

interface LiveSensorShapeProps {
  node: DeviceNode;
  onOpen: () => void;
}

export function LiveSensorShape({ node, onOpen }: LiveSensorShapeProps) {
  const history = useLiveStore((s) => s.history[node.id]);
  const entry = getDeviceCatalogEntry(node.type);
  const radius = node.size ?? DEFAULT_NODE_SIZE;
  const latest = history && history.length > 0 ? history[history.length - 1] : undefined;

  const setCursor = (cursor: string) => (e: Konva.KonvaEventObject<Event>) => {
    const stage = e.target.getStage();
    if (stage) stage.container().style.cursor = cursor;
  };

  return (
    <Group x={node.x} y={node.y} onClick={onOpen} onTap={onOpen} onMouseEnter={setCursor("pointer")} onMouseLeave={setCursor("default")}>
      <Circle radius={radius} fill={entry.color} stroke="#1e293b" strokeWidth={1} />
      <Circle radius={3} y={-radius - 2} fill="#16a34a" listening={false} />
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
      {latest && (
        <Text
          text={formatSensorValue(node.type, latest)}
          x={-45}
          y={radius + 18}
          width={90}
          wrap="none"
          ellipsis
          align="center"
          fontSize={11}
          fontStyle="bold"
          fill="#0f172a"
          listening={false}
        />
      )}
    </Group>
  );
}
