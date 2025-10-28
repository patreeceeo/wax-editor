import {immerable} from "immer";

/** * A simple in-memory key-value store with reference counting. */
export class Memory<T> {
  [immerable] = true;
  private _store: {[key: string]: {
    value: T
    refCount: number
  }} = Object.create(null);
  has(key: string): boolean {
    return key in this._store;
  }
  set(key: string, value: T): void {
    this._store[key] = { value, refCount: 0 };
  }
  get(key: string): T | undefined {
    return this._store[key].value;
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
}
