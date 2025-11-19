
export function getTypeName(value: any) {
  return typeof value;
}

export function isObjectOrArray(value: any): value is (Record<string, any> | any[]) {
  return value !== null && getTypeName(value) === 'object';
}
export function isObject(value: any): value is Record<string, any> {
  return isObjectOrArray(value) && !isArray(value);
}
export function isArray(value: any): value is any[] {
  return Array.isArray(value);
}

export function isString(value: any): value is string {
  return getTypeName(value) === 'string';
}

export function isNumber(value: any): value is number {
  return getTypeName(value) === 'number';
}

export function isBoolean(value: any): value is boolean {
  return getTypeName(value) === 'boolean';
}

