
export function isObjectOrArray(value: any): value is object {
  return value !== null && typeof value === 'object';
}

