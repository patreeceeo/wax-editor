import { beforeEach, describe, expect, test } from "vitest";
import { Machine } from "../machine";
import { _getInitialState, _reducer } from "./Debugger";
import { literal, add, halt } from "../compiled_instructions";
import { Compiler } from "../compiler";
import { CompiledProcedure } from "../compiled_procedure";

const program = new CompiledProcedure({
  id: "test",
  instructions: [
    Compiler.emit(literal, 1),
    Compiler.emit(literal, 2),
    Compiler.emit(add),
    Compiler.emit(halt),
  ],
});

const machine = new Machine();
machine.loadMemory("main", program);
machine.start();

describe("Debugger actions", () => {
  let _state: ReturnType<typeof _getInitialState>;
  describe("when at first step", () => {
    beforeEach(() => {
      _state = _getInitialState(machine);
    });

    test("step forward", () => {
      const next = _reducer(_state, { type: "NEXT" });
      expect(next.machines).toHaveLength(2);
      expect(next.machineIndex).toBe(0);
      expect(next.stepCount).toBe(1);
      expect(next.isMore).toBe(true);
    });

    test("run to end", () => {
      const next = _reducer(_state, { type: "RUN_TO_END" });
      expect(next.machines).toHaveLength(5);
      expect(next.machineIndex).toBe(0);
      expect(next.stepCount).toBe(4);
      expect(next.isMore).toBe(false);
    });
  });

  describe("when in middle", () => {
    beforeEach(() => {
      _state = _getInitialState(machine);
      // Step forward to middle state
      _state = _reducer(_state, { type: "NEXT" });
    });
    test("step back", () => {
      const next = _reducer(_state, { type: "PREV" });
      expect(next.machineIndex).toBe(1);
      expect(next.stepCount).toBe(0);
      expect(next.isMore).toBe(true);
    });

    test("step forward", () => {
      const next = _reducer(_state, { type: "NEXT" });
      expect(next.machineIndex).toBe(0);
      expect(next.stepCount).toBe(2);
      expect(next.isMore).toBe(true);
    });

    test("run to end", () => {
      const next = _reducer(_state, { type: "RUN_TO_END" });
      expect(next.machines).toHaveLength(5);
      expect(next.machineIndex).toBe(0);
      expect(next.stepCount).toBe(4);
      expect(next.isMore).toBe(false);
    });

    test("reset to first step", () => {
      const next = _reducer(_state, { type: "RESET", machine: machine });
      expect(next.machines).toHaveLength(1);
      expect(next.machineIndex).toBe(0);
      expect(next.stepCount).toBe(0);
      expect(next.isMore).toBe(true);
    });
  });

  describe("when at end", () => {
    beforeEach(() => {
      _state = _getInitialState(machine);
      // Run to end state
      _state = _reducer(_state, { type: "RUN_TO_END" });
    });

    test("step back", () => {
      const next = _reducer(_state, { type: "PREV" });
      expect(next.machineIndex).toBe(1);
      expect(next.stepCount).toBe(3);
      expect(next.isMore).toBe(true);
    });

    test("reset to first step", () => {
      const next = _reducer(_state, { type: "RESET", machine: machine });
      expect(next.machines).toHaveLength(1);
      expect(next.machineIndex).toBe(0);
      expect(next.stepCount).toBe(0);
      expect(next.isMore).toBe(true);
    });

    test("step back then run to end again", () => {
      const prev = _reducer(_state, { type: "PREV" });
      const next = _reducer(prev, { type: "RUN_TO_END" });
      expect(next.machines).toHaveLength(5);
      expect(next.machineIndex).toBe(0);
      expect(next.stepCount).toBe(4);
      expect(next.isMore).toBe(false);
    });
  });
});
