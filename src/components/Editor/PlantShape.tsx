import { Circle, Group, Text } from "react-konva";
import type { Plant } from "../../types/hypervision";
import { getPlantCatalogEntry } from "../../constants/deviceCatalog";
import { useEditorStore } from "../../store/editorStore";
import { snapValue, clamp } from "../../utils/snap";

interface PlantShapeProps {
  plant: Plant;
  isSelected: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

const PLANT_RADIUS = 9;

export function PlantShape({ plant, isSelected, canvasWidth, canvasHeight }: PlantShapeProps) {
  const grid = useEditorStore((s) => s.grid);
  const select = useEditorStore((s) => s.select);
  const updatePlant = useEditorStore((s) => s.updatePlant);
  const entry = getPlantCatalogEntry(plant.species);

  const handleSelect = () => select({ kind: "plant", id: plant.id });

  return (
    <Group
      x={plant.x}
      y={plant.y}
      draggable
      onClick={handleSelect}
      onTap={handleSelect}
      dragBoundFunc={(pos) => ({
        x: clamp(snapValue(pos.x, grid.cellSize, grid.snapToGrid), 0, canvasWidth),
        y: clamp(snapValue(pos.y, grid.cellSize, grid.snapToGrid), 0, canvasHeight),
      })}
      onDragEnd={(e) => updatePlant(plant.id, { x: e.target.x(), y: e.target.y() })}
    >
      <Circle radius={PLANT_RADIUS} fill={entry.color} stroke="#1e293b" strokeWidth={isSelected ? 2 : 1} />
      <Circle radius={3} y={-PLANT_RADIUS - 2} fill="#16a34a" listening={false} />
      {isSelected && <Circle radius={PLANT_RADIUS + 4} stroke="#2563eb" strokeWidth={1.5} dash={[3, 2]} />}
      <Text
        text={plant.variety ? `${entry.label} (${plant.variety})` : entry.label}
        x={-45}
        y={PLANT_RADIUS + 4}
        width={90}
        align="center"
        fontSize={10}
        fill="#334155"
        listening={false}
      />
    </Group>
  );
}
