import { raise } from "./error";

/**
 * Represents a result that can be either a success (Ok) or a failure (Fail).
 *
 * This is a monadic type that provides a way to handle errors explicitly without
 * throwing exceptions. It's useful for operations that can fail in expected ways
 * where you want to provide clear error handling and type safety.
 *
 * @template T - The type of the success value
 * @template E - The type of the error value
 *
 * @example
 * ```typescript
 * const result = divide(10, 2); // Result<number, string>
 * result.match({
 *   ok: (value) => console.log(`Result: ${value}`),
 *   fail: (error) => console.log(`Error: ${error}`)
 * });
 * ```
 */
export abstract class Result<T, E> {
  /**
   * Type guard that checks if the result is a success (Ok).
   * When this returns true, TypeScript narrows the type to Ok<T>.
   */
  abstract isOk(): this is Ok<T>;

  /**
   * Type guard that checks if the result is a failure (Fail).
   * When this returns true, TypeScript narrows the type to Fail<E>.
   */
  abstract isFail(): this is Fail<E>;

  /**
   * Unwraps the success value.
   * @throws If called on a Fail result
   * @returns The success value of type T
   */
  abstract unwrap(): T;

  /**
   * Unwraps the error value.
   * @throws If called on an Ok result
   * @returns The error value of type E
   */
  abstract unwrapErr(): E;

  /**
   * Pattern matches on the result and applies the appropriate handler.
   * This is the preferred way to handle both success and failure cases.
   *
   * @param handlers - Object with ok and fail handler functions
   * @param handlers.ok - Function to handle success case
   * @param handlers.fail - Function to handle failure case
   * @returns The result of applying the appropriate handler
   *
   * @example
   * ```typescript
   * const message = result.match({
   *   ok: (value) => `Success: ${value}`,
   *   fail: (error) => `Error: ${error}`
   * });
   * ```
   */
  abstract match<R>(handlers: {
    ok: (value: T) => R;
    fail: (error: E) => R;
  }): R;

  /**
   * Given a type guard function for type T, narrows the Result to Ok<T> if the guard passes.
   * If the Result is a Fail, it remains Fail<E>.
   *
   * @param typeGuard - A type guard function that checks if a value is of type U
   * @returns Result<U, E> - Ok<U> if the original Result was Ok<T> and the guard passed, otherwise Fail<E>
   *
   * @example
   * ```typescript
   * const result: Result<number | string, string> = getResult();
   * const numberResult = result.guard((value): value is number => typeof value === "number"); // Result<number, string>
   */
  abstract guardType<U extends T>(
    typeGuard: (value: T) => value is U,
  ): Result<U, E>;
}

class Ok<T> extends Result<T, any> {
  private value: T;
  constructor(value: T) {
    super();
    this.value = value;
  }
  toString() {
    return `Ok(${this.value})`;
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
  guardType<U extends T>(typeGuard: (value: T) => value is U): Result<U, any> {
    if (typeGuard(this.value)) {
      return new Ok<U>(this.value);
    } else {
      return new Fail<any>(`Value ${this.value} did not pass type guard.`);
    }
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
  guardType<U>(_: (value: any) => value is U): Result<U, E> {
    return new Fail<E>(this.error);
  }
}

/**
 * Creates a successful Result containing the provided value.
 *
 * This is the primary way to create success cases for operations that complete
 * successfully and have a value to return.
 *
 * @template T - The type of the success value
 * @template E - The type of potential errors (for type compatibility)
 * @param t - The success value to wrap in a Result
 * @returns A Result<T, E> representing success
 *
 * @example
 * ```typescript
 * const result = ok(42); // Result<number, never>
 * const result2 = ok("hello"); // Result<string, never>
 * const result3 = ok<number, string>(42); // Result<number, string>
 * ```
 */
export function ok<T, E>(t: T) {
  return new Ok<T>(t) as Result<T, E>;
}

/**
 * Creates a Result based on whether the provided value is defined.
 *
 * This is useful for handling potentially undefined values in a type-safe way,
 * converting them to explicit success or failure cases.
 *
 * @template T - The type of the success value (when not undefined)
 * @template E - The type of the error value
 * @param t - The value that may be undefined
 * @param err - The error value to use if t is undefined
 * @returns Result<T, E> - Ok if t is defined, Fail with err if undefined
 *
 * @example
 * ```typescript
 * const optionalValue: string | undefined = getValue();
 * const result = okIfDefined(optionalValue, "Value not found");
 * // Result<string, string>
 * ```
 */
export function okIfDefined<T, E>(t: T | undefined, err: E): Result<T, E> {
  if (t !== undefined) {
    return ok<T, E>(t);
  } else {
    return fail<T, E>(err);
  }
}

/**
 * Creates a failure Result containing the provided error.
 *
 * This is the primary way to create failure cases for operations that fail
 * and need to provide error information.
 *
 * @template T - The type that would be returned on success (for type compatibility)
 * @template E - The type of the error value
 * @param e - The error value to wrap in a Result
 * @returns A Result<T, E> representing failure
 *
 * @example
 * ```typescript
 * const result = fail("Something went wrong"); // Result<never, string>
 * const result2 = fail<number, string>("Invalid input"); // Result<number, string>
 * const result3 = fail(new Error("Database connection failed")); // Result<never, Error>
 * ```
 */
export function fail<T, E>(e: E) {
  return new Fail<E>(e) as Result<T, E>;
}

/** TODO
export function catchResult() {}
*/
