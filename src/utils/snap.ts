export function snapValue(value: number, cellSize: number, enabled: boolean): number {
  if (!enabled || cellSize <= 0) return value;
  return Math.round(value / cellSize) * cellSize;
}

export function snapPoint(
  x: number,
  y: number,
  cellSize: number,
  enabled: boolean,
): { x: number; y: number } {
  return {
    x: snapValue(x, cellSize, enabled),
    y: snapValue(y, cellSize, enabled),
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
