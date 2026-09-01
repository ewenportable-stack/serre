import { useEffect, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text } from "react-konva";
import { useEditorStore } from "../../store/editorStore";
import { useLiveStore } from "../../store/liveStore";
import { GridLayer } from "../Editor/GridLayer";
import { LiveActuatorShape } from "./LiveActuatorShape";
import { LiveSensorShape } from "./LiveSensorShape";
import { SensorDetailModal } from "./SensorDetailModal";
import { ActuatorDetailModal } from "./ActuatorDetailModal";
import { getPlantCatalogEntry } from "../../constants/deviceCatalog";
import { doorPixelPosition } from "../../utils/geometry";

const TICK_INTERVAL_MS = 2500;

export function LiveCanvas() {
  const grid = useEditorStore((s) => s.grid);
  const zones = useEditorStore((s) => s.zones);
  const doors = useEditorStore((s) => s.doors);
  const plants = useEditorStore((s) => s.plants);
  const pipes = useEditorStore((s) => s.pipes);
  const nodes = useEditorStore((s) => s.nodes);
  const tick = useLiveStore((s) => s.tick);
  const tickActuators = useLiveStore((s) => s.tickActuators);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const canvasWidth = grid.columns * grid.cellSize;
  const canvasHeight = grid.rows * grid.cellSize;
  const pixelsPerMeter = grid.cellSize / grid.metersPerCell;

  const sensorNodesKey = nodes
    .filter((n) => n.category === "sensor")
    .map((n) => `${n.id}:${n.type}`)
    .join(",");
  const actuatorIdsKey = nodes
    .filter((n) => n.category === "actuator")
    .map((n) => n.id)
    .join(",");

  useEffect(() => {
    const sensorNodes = nodes.filter((n) => n.category === "sensor").map((n) => ({ id: n.id, type: n.type }));
    const actuatorIds = nodes.filter((n) => n.category === "actuator").map((n) => n.id);
    const runTick = () => {
      if (sensorNodes.length > 0) tick(sensorNodes);
      if (actuatorIds.length > 0) tickActuators(actuatorIds);
    };
    runTick();
    const interval = setInterval(runTick, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensorNodesKey, actuatorIdsKey, tick, tickActuators]);

  const selectedNode = selectedNodeId ? (nodes.find((n) => n.id === selectedNodeId) ?? null) : null;

  return (
    <div className="editor-canvas-wrapper">
      <Stage width={canvasWidth} height={canvasHeight}>
        <GridLayer grid={grid} doors={doors} />
        <Layer listening={false}>
          {zones.map((zone) => (
            <Group key={zone.id}>
              <Rect x={zone.x} y={zone.y} width={zone.width} height={zone.height} fill={zone.color} stroke="#94a3b8" strokeWidth={1} cornerRadius={4} />
              <Text x={zone.x + 6} y={zone.y + 6} text={zone.name} fontSize={13} fill="#1e293b" />
            </Group>
          ))}
        </Layer>
        <Layer listening={false}>
          {pipes.map((pipe) => (
            <Line
              key={pipe.id}
              points={pipe.points.flatMap((p) => [p.x, p.y])}
              stroke="#0891b2"
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
            />
          ))}
        </Layer>
        <Layer listening={false}>
          {plants.map((plant) => {
            const entry = getPlantCatalogEntry(plant.species);
            return <Circle key={plant.id} x={plant.x} y={plant.y} radius={9} fill={entry.color} stroke="#1e293b" strokeWidth={1} />;
          })}
        </Layer>
        <Layer listening={false}>
          {doors.map((door) => {
            const pos = doorPixelPosition(door, pixelsPerMeter, canvasWidth, canvasHeight);
            const horizontal = door.wall === "north" || door.wall === "south";
            const widthPx = door.widthMeters * pixelsPerMeter;
            const half = widthPx / 2;
            return horizontal ? (
              <Rect key={door.id} x={pos.x - half} y={pos.y - 4} width={widthPx} height={8} fill="#92400e" cornerRadius={2} />
            ) : (
              <Rect key={door.id} x={pos.x - 4} y={pos.y - half} width={8} height={widthPx} fill="#92400e" cornerRadius={2} />
            );
          })}
        </Layer>
        <Layer>
          {nodes.map((node) =>
            node.category === "actuator" ? (
              <LiveActuatorShape key={node.id} node={node} onOpen={() => setSelectedNodeId(node.id)} />
            ) : (
              <LiveSensorShape key={node.id} node={node} onOpen={() => setSelectedNodeId(node.id)} />
            ),
          )}
        </Layer>
      </Stage>
      {selectedNode &&
        (selectedNode.category === "actuator" ? (
          <ActuatorDetailModal node={selectedNode} onClose={() => setSelectedNodeId(null)} />
        ) : (
          <SensorDetailModal node={selectedNode} onClose={() => setSelectedNodeId(null)} />
        ))}
    </div>
  );
}
