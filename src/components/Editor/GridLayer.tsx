import { Layer, Line, Rect } from "react-konva";
import type { GridSettings } from "../../types/hypervision";

interface GridLayerProps {
  grid: GridSettings;
}

export function GridLayer({ grid }: GridLayerProps) {
  const width = grid.columns * grid.cellSize;
  const height = grid.rows * grid.cellSize;

  const verticalLines = [];
  for (let x = 0; x <= grid.columns; x += 1) {
    verticalLines.push(
      <Line
        key={`v-${x}`}
        points={[x * grid.cellSize, 0, x * grid.cellSize, height]}
        stroke="#e2e8f0"
        strokeWidth={x % 5 === 0 ? 1 : 0.5}
        listening={false}
      />,
    );
  }

  const horizontalLines = [];
  for (let y = 0; y <= grid.rows; y += 1) {
    horizontalLines.push(
      <Line
        key={`h-${y}`}
        points={[0, y * grid.cellSize, width, y * grid.cellSize]}
        stroke="#e2e8f0"
        strokeWidth={y % 5 === 0 ? 1 : 0.5}
        listening={false}
      />,
    );
  }

  return (
    <Layer listening={false}>
      <Rect x={0} y={0} width={width} height={height} fill="#f8fafc" />
      {verticalLines}
      {horizontalLines}
    </Layer>
  );
}
