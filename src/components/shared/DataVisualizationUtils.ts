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
