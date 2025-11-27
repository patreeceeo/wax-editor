import { isObjectOrArray, isArray } from "../../utils";

/**
 * Shared utilities for data visualization components
 */

export interface ObjectEntry {
  key: string | number;
  value: any;
}

/**
 * Extract entries from objects and arrays in a consistent format
 */
export function getObjectEntries(value: any): ObjectEntry[] {
  if (isArray(value)) {
    return value.map((value, index) => ({ key: index, value }));
  }
  if (isObjectOrArray(value)) {
    return Object.entries(value).map(([key, value]) => ({ key, value }));
  }
  return [];
}

export function getRenderingContextForFont(font: string): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  context.font = font;
  return context;
}

const _letterWidths: Record<string, number> = {}
let _letterWidthsInitialized = false;
function initLetterWidths() {
  const font = getComputedStyle(document.body).font || '16px sans-serif';
  const context = getRenderingContextForFont(font);
  const letters = '_-.!?<>(){}[] abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (const letter of letters) {
    const metrics = context.measureText(letter);
    _letterWidths[letter] = metrics.width;
  }
  _letterWidthsInitialized = true;
}

export function getTextWidth(text: string, size: number): number {
  if (!_letterWidthsInitialized) {
    initLetterWidths();
  }
  let width = 0;
  for (const char of text) {
    width += _letterWidths[char] || 8; // Default width for unknown chars
  }
  return width * (size / 16);
}

/**
 * Calculate intersection point of a line with a rectangle
 * Returns the point where the line from (x1, y1) to (x2, y2) intersects the rectangle bounds
 */
export function getLineRectangleIntersection(
  x1: number, y1: number,
  x2: number, y2: number,
  rectX: number, rectY: number,
  rectWidth: number, rectHeight: number
): { x: number; y: number } {
  // Calculate rectangle boundaries
  const rectLeft = rectX - rectWidth / 2;
  const rectRight = rectX + rectWidth / 2;
  const rectTop = rectY - rectHeight / 2;
  const rectBottom = rectY + rectHeight / 2;

  // Direction vector
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Check intersections with each edge of the rectangle
  const intersections: { x: number; y: number; t: number }[] = [];

  // Left edge (x = rectLeft)
  if (dx !== 0) {
    const t = (rectLeft - x1) / dx;
    if (t >= 0 && t <= 1) {
      const y = y1 + t * dy;
      if (y >= rectTop && y <= rectBottom) {
        intersections.push({ x: rectLeft, y, t });
      }
    }
  }

  // Right edge (x = rectRight)
  if (dx !== 0) {
    const t = (rectRight - x1) / dx;
    if (t >= 0 && t <= 1) {
      const y = y1 + t * dy;
      if (y >= rectTop && y <= rectBottom) {
        intersections.push({ x: rectRight, y, t });
      }
    }
  }

  // Top edge (y = rectTop)
  if (dy !== 0) {
    const t = (rectTop - y1) / dy;
    if (t >= 0 && t <= 1) {
      const x = x1 + t * dx;
      if (x >= rectLeft && x <= rectRight) {
        intersections.push({ x, y: rectTop, t });
      }
    }
  }

  // Bottom edge (y = rectBottom)
  if (dy !== 0) {
    const t = (rectBottom - y1) / dy;
    if (t >= 0 && t <= 1) {
      const x = x1 + t * dx;
      if (x >= rectLeft && x <= rectRight) {
        intersections.push({ x, y: rectBottom, t });
      }
    }
  }

  // Return the intersection with the smallest t (closest to the start point)
  if (intersections.length === 0) {
    // Fallback: return the target point if no intersection found
    return { x: x2, y: y2 };
  }

  intersections.sort((a, b) => a.t - b.t);
  return { x: intersections[0].x, y: intersections[0].y };
}

export function getTextDimensions(text: string, padding: number = 0) {
  const width = getTextWidth(text, 12) + padding * 2;
  const height = 16 + padding * 2;
  return { width, height };
}
