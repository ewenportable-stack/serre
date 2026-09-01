import { Circle, Group, Text } from "react-konva";
import type Konva from "konva";
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
  const toggleSelection = useEditorStore((s) => s.toggleSelection);
  const updatePlant = useEditorStore((s) => s.updatePlant);
  const selectionCount = useEditorStore((s) => s.selection.length);
  const beginGroupDrag = useEditorStore((s) => s.beginGroupDrag);
  const applyGroupDragDelta = useEditorStore((s) => s.applyGroupDragDelta);
  const endGroupDrag = useEditorStore((s) => s.endGroupDrag);
  const entry = getPlantCatalogEntry(plant.species);

  const isGroupDrag = isSelected && selectionCount > 1;

  const handleSelect = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey) {
      toggleSelection({ kind: "plant", id: plant.id });
    } else {
      select({ kind: "plant", id: plant.id });
    }
  };

  return (
    <Group
      x={plant.x}
      y={plant.y}
      draggable
      onClick={handleSelect}
      onTap={() => select({ kind: "plant", id: plant.id })}
      dragBoundFunc={(pos) => ({
        x: clamp(snapValue(pos.x, grid.cellSize, grid.snapToGrid), 0, canvasWidth),
        y: clamp(snapValue(pos.y, grid.cellSize, grid.snapToGrid), 0, canvasHeight),
      })}
      onDragStart={() => {
        if (isGroupDrag) beginGroupDrag();
      }}
      onDragMove={(e) => {
        if (isGroupDrag) {
          applyGroupDragDelta(e.target.x() - plant.x, e.target.y() - plant.y, "plant", plant.id);
        }
      }}
      onDragEnd={(e) => {
        updatePlant(plant.id, { x: e.target.x(), y: e.target.y() });
        if (isGroupDrag) endGroupDrag();
      }}
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
