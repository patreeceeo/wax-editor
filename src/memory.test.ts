import { Memory } from "./memory";
import { test, expect } from "vitest";

test("Memory set and get primitive", () => {
  const memory = new Memory<number>();
  memory.set("a", 42);
  const result = memory.get("a");
  expect(result.isOk()).toBe(true);
  expect(result.unwrap()).toBe(42);
});

test("Memory set and get object", () => {
  const memory = new Memory<object>();
  const obj = { foo: "bar" };
  memory.set("obj1", obj);
  const result = memory.get("obj1");
  expect(result.isOk()).toBe(true);
  expect(result.unwrap()).toBe(obj);
});

test("Memory get non-existent key", () => {
  const memory = new Memory<string>();
  const result = memory.get("nonExistentKey");
  expect(result.isOk()).toBe(false);
  expect(result.unwrapErr()).toBeDefined();
});

test("Memory set undefined value", () => {
  const memory = new Memory<undefined>();
  memory.set("undef", undefined);
  const result = memory.get("undef");
  expect(result.isOk()).toBe(true);
  expect(result.unwrap()).toBeUndefined();
});
