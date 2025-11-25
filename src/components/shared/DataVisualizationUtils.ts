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
let nextObjectId = 0;
const primitiveIds = new Map<string, number>();
export function getObjectId(value: any): string {
  const type = typeof value;
  if (type === 'object') {
    // Use WeakMap to maintain consistent IDs for object instances
    if (!objectIds.has(value)) {
      objectIds.set(value, `obj_${nextObjectId++}`);
    }
    return objectIds.get(value)!;
  } else {
    // Use Map for primitive values
    const id = primitiveIds.get(type) || 0;
    primitiveIds.set(type, id + 1);
    return `prim_${type}_${id}`;
  }
}
