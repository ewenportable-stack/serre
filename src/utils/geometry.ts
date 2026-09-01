import type { Wall } from "../types/hypervision";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function pointInRect(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}

/** Position en pixels du centre d'une porte le long de son mur. */
export function doorPixelPosition(
  door: { wall: Wall; offsetMeters: number },
  pixelsPerMeter: number,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  const offsetPx = door.offsetMeters * pixelsPerMeter;
  switch (door.wall) {
    case "north":
      return { x: offsetPx, y: 0 };
    case "south":
      return { x: offsetPx, y: canvasHeight };
    case "west":
      return { x: 0, y: offsetPx };
    case "east":
      return { x: canvasWidth, y: offsetPx };
  }
}
