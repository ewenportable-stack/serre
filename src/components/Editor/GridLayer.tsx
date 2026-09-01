import { Layer, Line, Rect } from "react-konva";
import type { Door, GridSettings, Wall } from "../../types/hypervision";

interface GridLayerProps {
  grid: GridSettings;
  doors: Door[];
}

/** Découpe un mur (longueur lengthPx) en segments pleins en excluant les intervalles occupés par les portes. */
function wallSegments(lengthPx: number, doorRanges: [number, number][]): [number, number][] {
  const sorted = [...doorRanges].sort((a, b) => a[0] - b[0]);
  const segments: [number, number][] = [];
  let cursor = 0;
  for (const [rawStart, rawEnd] of sorted) {
    const start = Math.max(0, Math.min(lengthPx, rawStart));
    const end = Math.max(0, Math.min(lengthPx, rawEnd));
    if (start > cursor) segments.push([cursor, start]);
    cursor = Math.max(cursor, end);
  }
  if (cursor < lengthPx) segments.push([cursor, lengthPx]);
  return segments;
}

export function GridLayer({ grid, doors }: GridLayerProps) {
  const width = grid.columns * grid.cellSize;
  const height = grid.rows * grid.cellSize;
  const pixelsPerMeter = grid.cellSize / grid.metersPerCell;

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

  const doorRangesOnWall = (wall: Wall): [number, number][] =>
    doors
      .filter((d) => d.wall === wall)
      .map((d): [number, number] => {
        const centerPx = d.offsetMeters * pixelsPerMeter;
        const halfPx = (d.widthMeters * pixelsPerMeter) / 2;
        return [centerPx - halfPx, centerPx + halfPx];
      });

  const northSegments = wallSegments(width, doorRangesOnWall("north"));
  const southSegments = wallSegments(width, doorRangesOnWall("south"));
  const westSegments = wallSegments(height, doorRangesOnWall("west"));
  const eastSegments = wallSegments(height, doorRangesOnWall("east"));

  return (
    <Layer listening={false}>
      <Rect x={0} y={0} width={width} height={height} fill="#f8fafc" />
      {verticalLines}
      {horizontalLines}
      {northSegments.map(([s, e], i) => (
        <Line key={`wn-${i}`} points={[s, 0, e, 0]} stroke="#1e293b" strokeWidth={5} lineCap="round" />
      ))}
      {southSegments.map(([s, e], i) => (
        <Line key={`ws-${i}`} points={[s, height, e, height]} stroke="#1e293b" strokeWidth={5} lineCap="round" />
      ))}
      {westSegments.map(([s, e], i) => (
        <Line key={`ww-${i}`} points={[0, s, 0, e]} stroke="#1e293b" strokeWidth={5} lineCap="round" />
      ))}
      {eastSegments.map(([s, e], i) => (
        <Line key={`we-${i}`} points={[width, s, width, e]} stroke="#1e293b" strokeWidth={5} lineCap="round" />
      ))}
    </Layer>
  );
}
