import { raise } from "./error";

export abstract class Result<T, E> {
  abstract isOk(): this is Ok<T>;
  abstract isFail(): this is Fail<E>;
  abstract unwrap(): T;
  abstract unwrapErr(): E;
  abstract match<R>(handlers: {
    ok: (value: T) => R;
    fail: (error: E) => R;
  }): R;
}

class Ok<T> extends Result<T, any> {
  private value: T;
  constructor(value: T) {
    super();
    this.value = value;
  }
  isOk(): this is Ok<T> {
    return true;
  }
  isFail(): this is Fail<any> {
    return false;
  }
  unwrap(): T {
    return this.value;
  }
  unwrapErr(): any {
    raise("Tried to unwrapErr an Ok result.");
  }
  match<R>(handlers: { ok: (value: T) => R; fail: (error: any) => R }): R {
    return handlers.ok(this.value);
  }
}

class Fail<E> extends Result<any, E> {
  private error: E;
  constructor(error: E) {
    super();
    this.error = error;
  }
  toString() {
    return `Fail(${this.error})`;
  }
  isOk(): this is Ok<any> {
    return false;
  }
  isFail(): this is Fail<E> {
    return true;
  }
  unwrap(): any {
    raise(`Tried to unwrap a ${this}`);
  }
  unwrapErr(): E {
    return this.error;
  }
  match<R>(handlers: { ok: (value: any) => R; fail: (error: E) => R }): R {
    return handlers.fail(this.error);
  }
}

export function ok<T, E>(t: T) {
  return new Ok<T>(t) as Result<T, E>;
}

export function okIfDefined<T, E>(t: T | undefined, err: E): Result<T, E> {
  if (t !== undefined) {
    return ok<T, E>(t);
  } else {
    return fail<T, E>(err);
  }
}

export function fail<T, E>(e: E) {
  return new Fail<E>(e) as Result<T, E>;
}

/** TODO
export function catchResult() {}
*/
