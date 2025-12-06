// TODO use WeakMap with memoized key objects

import { okIf, Result } from "./result";

/** * A simple in-memory key-value store. */
export class Memory<T> {
  private _store: {
    [key: string]: T;
  } = Object.create(null);
  has(key: string): boolean {
    return key in this._store;
  }
  set(key: string, value: T): void {
    this._store[key] = value;
  }
  get(key: string): Result<T, string> {
    return okIf(
      this.has(key),
      this._store[key],
      `"${key}" not found in memory.`,
    );
  }
}
