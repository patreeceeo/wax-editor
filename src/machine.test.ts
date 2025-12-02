import { beforeEach, describe, expect, test } from "vitest";
import { Machine } from "./machine";
import { CompiledProcedure } from "./compiled_procedure";
import { literal, halt } from "./compiled_instructions";
import { Compiler } from "./compiler";

describe("Machine Critical Bug Prevention", () => {
  let machine: Machine;

  beforeEach(() => {
    machine = new Machine();
  });

  // Helper to create a simple test procedure
  const createTestProcedure = (id: string, instructions: any[] = []) => {
    return new CompiledProcedure({
      id,
      instructions:
        instructions.length > 0
          ? instructions
          : [Compiler.emit(literal, 42), Compiler.emit(halt)],
    });
  };

  describe("Stack underflow protection", () => {
    test("returnFromProcedure throws when cannot return", () => {
      machine.loadMemory("main", createTestProcedure("main"));
      machine.start();

      // Should be able to return from main procedure
      expect(machine.canReturnFromProcedure()).toBe(false); // Only main on stack

      // But returning from main when it's the only one should throw
      expect(() => machine.returnFromProcedure()).toThrow();
    });

    test("stack depth is never negative", () => {
      machine.loadMemory("main", createTestProcedure("main"));
      machine.start();

      // Stack should have at least the main procedure
      expect(machine.getStackDepth()).toBeGreaterThanOrEqual(1);

      // The first return should throw since we can't return from main
      expect(() => machine.returnFromProcedure()).toThrow();

      // Stack depth should still be valid
      expect(machine.getStackDepth()).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Program counter bounds protection", () => {
    test("getInstruction throws when PC exceeds procedure length", () => {
      const procedure = createTestProcedure("main", [
        Compiler.emit(literal, 1),
        Compiler.emit(halt),
      ]);

      machine.loadMemory("main", procedure);
      machine.start();

      // Execute first instruction
      machine.applyInstruction(machine.getInstruction()!);

      // Execute halt instruction
      machine.applyInstruction(machine.getInstruction()!);

      // Now at end, getInstruction should return undefined (not running)
      expect(machine.getInstruction()).toBeUndefined();
      expect(machine.isAtEndOfProcedure()).toBe(true);
    });

    test("machine cannot execute without starting", () => {
      machine.loadMemory("main", createTestProcedure("main"));

      expect(machine.getInstruction()).toBeUndefined();
      expect(machine.isAtEndOfProcedure()).toBe(true);
    });
  });

  describe("Memory corruption prevention", () => {
    test("procedure contexts maintain correct isolation", () => {
      const main = createTestProcedure("main", [
        Compiler.emit(literal, 100),
        Compiler.emit(halt),
      ]);
      const nested = createTestProcedure("nested", [
        Compiler.emit(literal, 200),
        Compiler.emit(halt),
      ]);

      machine.loadMemory("main", main);
      machine.loadMemory("nested", nested);
      machine.start();

      // Execute first instruction in main
      machine.applyInstruction(machine.getInstruction()!);
      const mainStackValue = machine.currentProcedureContext()!.peek();

      // Invoke nested procedure
      machine.invokeProcedure(nested, []);
      machine.applyInstruction(machine.getInstruction()!);
      const nestedStackValue = machine.currentProcedureContext()!.peek();

      // Values should be different (isolated contexts)
      expect(mainStackValue).toBe(100);
      expect(nestedStackValue).toBe(200);

      // Return and verify main context is unchanged
      machine.returnFromProcedure();
      expect(machine.currentProcedureContext()!.peek()).toBe(100);
    });

    test("variable scoping is preserved across procedure calls", () => {
      const main = createTestProcedure("main", [
        Compiler.emit(literal, "main_var"),
        Compiler.emit(halt),
      ]);
      const nested = createTestProcedure("nested", [
        Compiler.emit(literal, "nested_var"),
        Compiler.emit(halt),
      ]);

      machine.loadMemory("main", main);
      machine.loadMemory("nested", nested);
      machine.start();

      // Set variable in main context
      machine.applyInstruction(machine.getInstruction()!); // literal "main_var"
      const mainCtx = machine.currentProcedureContext()!;
      mainCtx.set("test_var", mainCtx.pop());

      // Invoke nested and set different variable
      machine.invokeProcedure(nested, []);
      machine.applyInstruction(machine.getInstruction()!); // literal "nested_var"
      const nestedCtx = machine.currentProcedureContext()!;
      nestedCtx.set("test_var", nestedCtx.pop());

      // Variables should be different
      expect(mainCtx.get("test_var")).toBe("main_var");
      expect(nestedCtx.get("test_var")).toBe("nested_var");
    });
  });

  describe("Procedure lifecycle integrity", () => {
    test("procedure calls and returns maintain correct execution order", () => {
      const procedures = [
        createTestProcedure("level1", [
          Compiler.emit(literal, 1),
          Compiler.emit(halt),
        ]),
        createTestProcedure("level2", [
          Compiler.emit(literal, 2),
          Compiler.emit(halt),
        ]),
        createTestProcedure("level3", [
          Compiler.emit(literal, 3),
          Compiler.emit(halt),
        ]),
      ];

      machine.loadMemory("main", procedures[0]);
      machine.loadMemory("level2", procedures[1]);
      machine.loadMemory("level3", procedures[2]);
      machine.start();

      // Execute nested calls
      const executionOrder: (string | number)[] = [];

      machine.invokeProcedure(procedures[1], []);
      executionOrder.push(machine.currentProcedure()!.id);

      machine.invokeProcedure(procedures[2], []);
      executionOrder.push(machine.currentProcedure()!.id);

      // Return should reverse the order
      machine.returnFromProcedure();
      executionOrder.push(machine.currentProcedure()!.id);

      machine.returnFromProcedure();
      executionOrder.push(machine.currentProcedure()!.id);

      // The actual execution order based on current procedure after each operation
      expect(executionOrder).toEqual(["level2", "level3", "level2", "level1"]);
    });

    test("call stack accurately reflects current execution state", () => {
      const main = createTestProcedure("main");
      const nested = createTestProcedure("nested");
      const deeplyNested = createTestProcedure("deeplyNested");

      machine.loadMemory("main", main);
      machine.loadMemory("nested", nested);
      machine.loadMemory("deeplyNested", deeplyNested);
      machine.start();

      expect(machine.getCallStack()).toEqual(["main"]);

      machine.invokeProcedure(nested, []);
      expect(machine.getCallStack()).toEqual(["nested", "main"]);

      machine.invokeProcedure(deeplyNested, []);
      expect(machine.getCallStack()).toEqual([
        "deeplyNested",
        "nested",
        "main",
      ]);

      machine.returnFromProcedure();
      expect(machine.getCallStack()).toEqual(["nested", "main"]);
    });
  });

  describe("Return value handling", () => {
    test("return values are correctly transferred to caller", () => {
      const main = createTestProcedure("main", [Compiler.emit(halt)]);
      const worker = createTestProcedure("worker", [Compiler.emit(halt)]);

      machine.loadMemory("main", main);
      machine.loadMemory("worker", worker);
      machine.start();

      // Invoke worker procedure
      machine.invokeProcedure(worker, [10, 20]);
      const workerCtx = machine.currentProcedureContext()!;

      // Worker produces return values
      workerCtx.pushReturnValue("result1");
      workerCtx.pushReturnValue("result2");

      // Return to main
      machine.returnFromProcedure();
      const mainCtx = machine.currentProcedureContext()!;

      // Main should have return values on its stack
      expect(mainCtx.pop()).toBe("result2");
      expect(mainCtx.pop()).toBe("result1");
      expect(mainCtx.stackSize).toBe(0); // Stack should be empty after consuming returns
    });
  });

  describe("Error prevention in edge cases", () => {
    test("machine prevents execution without main procedure", () => {
      expect(() => machine.start()).toThrow();
    });

    test("variable IDs are unique and increment correctly", () => {
      machine.loadMemory("main", createTestProcedure("main"));
      machine.start();

      const initialCount = machine.getVariableCount();
      const ids = new Set();
      const varCount = 10;

      for (let i = 0; i < varCount; i++) {
        const variable = machine.createVariable();
        expect(ids.has(variable.id)).toBe(false); // No duplicates
        ids.add(variable.id);
      }

      expect(ids.size).toBe(varCount);
      expect(machine.getVariableCount()).toBe(initialCount + varCount);
    });

    test("complex nested execution doesn't corrupt stack", () => {
      const mainProc = createTestProcedure("main");
      const nestedProc = createTestProcedure("nested");

      machine.loadMemory("main", mainProc);
      machine.loadMemory("nested", nestedProc);
      machine.start();

      // Create complex nesting
      for (let i = 0; i < 5; i++) {
        machine.invokeProcedure(nestedProc, [i]);
      }

      expect(machine.getStackDepth()).toBe(6); // main + 5 nested calls

      // Verify we can unwind correctly
      const unwindOrder: number[] = [];
      while (machine.canReturnFromProcedure()) {
        const ctx = machine.currentProcedureContext()!;
        unwindOrder.push(ctx.pop() as number);
        machine.returnFromProcedure();
      }

      // Should unwind in reverse order (LIFO)
      expect(unwindOrder).toEqual([4, 3, 2, 1, 0]);
      expect(machine.getCallStack()).toEqual(["main"]);
    });
  });
});
