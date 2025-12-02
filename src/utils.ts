export function getTypeName(value: any) {
  return typeof value;
}

export function isObjectOrArray(
  value: any,
): value is Record<string, any> | any[] {
  return value !== null && getTypeName(value) === "object";
}
export function isObject(value: any): value is Record<string, any> {
  return isObjectOrArray(value) && !isArray(value);
}
export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

export function isString(value: any): value is string {
  return getTypeName(value) === "string";
}

export function isNumber(value: any): value is number {
  return getTypeName(value) === "number";
}

export function isBoolean(value: any): value is boolean {
  return getTypeName(value) === "boolean";
}

export function isJsPrimitive(
  value: any,
): value is string | number | boolean | undefined {
  const typeName = getTypeName(value);
  return (
    value === undefined ||
    typeName === "string" ||
    typeName === "number" ||
    typeName === "boolean"
  );
}

/**
 * Generate a unique identifier for a value
 */
const objectIds = new WeakMap();
let nextObjectId = 0;
const primitiveIds = new Map<string, number>();
export function getObjectId(value: any): string {
  const type = typeof value;
  if (type === "object" || type === "function") {
    // Use WeakMap to maintain consistent IDs for object instances
    if (!objectIds.has(value)) {
      objectIds.set(value, String(nextObjectId++));
    }
    return objectIds.get(value)!;
  } else {
    // Use Map for primitive values
    const id = primitiveIds.get(type) || 0;
    primitiveIds.set(type, id + 1);
    return `${type}_${id}`;
  }
}
