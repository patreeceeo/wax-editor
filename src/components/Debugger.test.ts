import {beforeEach, describe, expect, test} from "vitest";
import {add, emit, literal, Machine} from "../machine";
import {_getInitialState, _reducer} from "./Debugger";

const program = [
  emit(literal, 1),
  emit(literal, 2),
  emit(add)
];

const machine = new Machine();
machine.load("main", program);
machine.start();

describe("Debugger actions", () => {
  describe("when at first step", () => {
    let _state: ReturnType<typeof _getInitialState>;
    beforeEach(() => {
      _state = _getInitialState(machine);
    });

    test("should not go back", () => {
      const next = _reducer(_state, { type: "PREV" });
      expect(next).toEqual(_state);
    });

    test("step forward", () => {
    });

    test("run to end", () => {
    });
  });

  describe("when in middle", () => {
    test("step back", () => {
    });

    test("step forward", () => {
    });

    test("run to end", () => {
    });

    test("reset to first step", () => {
    });
  });

  describe("when at end", () => {
    test("step back", () => {
    });

    test("should not step forward", () => {
    });

    test("run to end", () => {
    });
  });
});
