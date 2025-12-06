// TODO use WeakMap with memoized key objects

import { okIfDefined, Result } from "./result";

/** * A simple in-memory key-value store with reference counting. */
export class Memory<T> {
  private _store: {
    [key: string]: {
      value: T;
      refCount: number;
    };
  } = Object.create(null);
  has(key: string): boolean {
    return key in this._store;
  }
  set(key: string, value: T): void {
    this._store[key] = { value, refCount: 0 };
  }
  get(key: string): Result<T, string> {
    return okIfDefined(
      this._store[key].value,
      `Key "${key}" not found in memory.`,
    );
  }
  retain(key: string): void {
    if (this.has(key)) {
      this._store[key].refCount += 1;
    }
  }
  release(key: string): void {
    if (this.has(key)) {
      this._store[key].refCount -= 1;
      if (this._store[key].refCount <= 0) {
        delete this._store[key];
      }
    }
  }
  clone(): Memory<T> {
    const newMemory = new Memory<T>();
    for (const key in this._store) {
      newMemory._store[key] = {
        value: this._store[key].value,
        refCount: this._store[key].refCount,
      };
    }
    return newMemory;
  }
}
