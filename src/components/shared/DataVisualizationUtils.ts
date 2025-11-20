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

/**
 * Generate a unique identifier for object instances in graphs
 */
const objectIds = new WeakMap();
export function getObjectId(value: any): string {
  if (value === null || value === undefined) {
    return `null_${value}`;
  }
  if (typeof value === 'object') {
    // Use WeakMap to maintain consistent IDs for object instances
    if (!objectIds.has(value)) {
      objectIds.set(value, `obj_${Math.random().toString(36).substr(2, 9)}`);
    }
    return objectIds.get(value)!;
  }
  // Use value and type for primitives
  return `${typeof value}_${String(value)}`;
}