import {beforeEach, describe, expect, test} from "vitest";
import {Machine} from "./machine";
import {CompiledProcedure} from "./compiled_procedure";
import {Compiler} from "./compiler";
import {
  literal,
  pop,
  setVariable,
  setVariableToLiteral,
  getVariable,
  pushReturnValue,
  returnFromProcedure,
  jump,
  jumpIfTrue,
  jumpIfFalse,
  sendMessage,
  add,
  greaterThan,
  lessThan,
  and
} from "./compiled_instructions";
import type {ProcedureContext} from "./procedure_context";

describe("Instruction Set Critical Bug Prevention", () => {
  let machine: Machine;
  let procedure: CompiledProcedure;
  let context: ProcedureContext;

  beforeEach(() => {
    machine = new Machine();
    procedure = new CompiledProcedure({id: "test", instructions: []});
    machine.loadMemory("main", procedure);
    machine.start();
    context = machine.currentProcedureContext()!;
  });

  const createTestProcedure = (instructions: any[] = []) => {
    return new CompiledProcedure({
      id: "test",
      instructions
    });
  };

  describe("Stack manipulation prevents crashes", () => {
    test("pop throws when stack is empty", () => {
      expect(context.stackSize).toBe(0);
      expect(() => pop(context)).toThrow();
    });
  });

  describe("Variable scoping prevents undefined access", () => {
    test("getVariable throws when variable not found", () => {
      expect(() => getVariable(context, "nonexistent_var")).toThrow();
    });

    test("setVariable and getVariable work correctly", () => {
      const testValue = "test_value";
      context.push(testValue);

      setVariable(context, "test_var");

      expect(context.hasVariable("test_var")).toBe(true);

      getVariable(context, "test_var");
      expect(context.getStackTop()).toBe(testValue);
    });

    test("setVariableToLiteral creates variable correctly", () => {
      const testValue = 123;

      setVariableToLiteral(context, "literal_var", testValue);

      expect(context.hasVariable("literal_var")).toBe(true);

      getVariable(context, "literal_var");
      expect(context.getStackTop()).toBe(testValue);
    });

    test("setVariable throws when stack is empty", () => {
      expect(context.stackSize).toBe(0);
      expect(() => setVariable(context, "test_var")).toThrow();
    });
  });

  describe("Control flow prevents invalid jumps", () => {
    test("jump throws when target address is negative", () => {
      expect(() => jump(context, -1)).toThrow();
    });

    test("jump throws when target address exceeds procedure bounds", () => {
      // Create a procedure with only 5 instructions
      const smallProc = createTestProcedure([
        Compiler.emit(literal, 1),
        Compiler.emit(literal, 2),
        Compiler.emit(literal, 3),
        Compiler.emit(literal, 4),
        Compiler.emit(literal, 5)
      ]);
      machine.invokeProcedure(smallProc, []);
      const smallCtx = machine.currentProcedureContext()!;

      expect(() => jump(smallCtx, 10)).toThrow(); // Beyond procedure length
    });

    test("jumpIfTrue throws when no boolean on stack", () => {
      expect(context.stackSize).toBe(0);
      expect(() => jumpIfTrue(context, 1)).toThrow();
    });

    test("jumpIfFalse throws when no boolean on stack", () => {
      expect(context.stackSize).toBe(0);
      expect(() => jumpIfFalse(context, 1)).toThrow();
    });

    test("jumpIfTrue jumps correctly with true value", () => {
      // Create a procedure with enough dummy instructions for the jump
      const jumpProc = createTestProcedure([{}, {}, {}, {}]); // 4 dummy instructions
      machine.invokeProcedure(jumpProc, []);
      const jumpCtx = machine.currentProcedureContext()!;

      jumpCtx.push(true);
      const initialPC = jumpCtx.pc;

      jumpIfTrue(jumpCtx, 3);

      expect(jumpCtx.pc).toBe(initialPC + 3);
      expect(jumpCtx.stackSize).toBe(0); // Should consume the boolean
    });

    test("jumpIfTrue does not jump with false value", () => {
      // Create a procedure with enough dummy instructions for the jump
      const jumpProc = createTestProcedure([{}, {}, {}, {}]); // 4 dummy instructions
      machine.invokeProcedure(jumpProc, []);
      const jumpCtx = machine.currentProcedureContext()!;

      jumpCtx.push(false);
      const initialPC = jumpCtx.pc;

      jumpIfTrue(jumpCtx, 3);

      expect(jumpCtx.pc).toBe(initialPC);
      expect(jumpCtx.stackSize).toBe(0); // Should consume the boolean
    });
  });

  describe("Message passing prevents runtime errors", () => {
    test("sendMessage throws for receiver without WaxClass", () => {
      const receiver = {}; // Plain object
      context.push(receiver);

      expect(() => sendMessage(context, "testMethod", 0)).toThrow();
    });

    test("sendMessage throws for non-existent method", () => {
      // Create a simple object with a WaxClass
      const receiver = "test_string"; // Strings have WaxClass
      context.push(receiver);

      expect(() => sendMessage(context, "nonExistentMethod", 0)).toThrow();
    });

    test("sendMessage throws when insufficient arguments", () => {
      const receiver = "test";
      context.push(receiver);

      // Try to call method with 2 args but only have receiver on stack
      expect(() => sendMessage(context, "substring", 2)).toThrow();
    });
  });

  describe("Arithmetic operations prevent type errors", () => {
    test("add throws when insufficient operands", () => {
      context.push(5);
      // Only one operand, need two

      expect(() => add(context)).toThrow();
    });

    test("add throws when stack is empty", () => {
      expect(context.stackSize).toBe(0);
      expect(() => add(context)).toThrow();
    });

    test("add works correctly with two operands", () => {
      context.push(5);
      context.push(3);

      add(context);

      expect(context.getStackTop()).toBe(8);
      expect(context.stackSize).toBe(1);
    });

    test("greaterThan throws when insufficient operands", () => {
      context.push(5);
      expect(() => greaterThan(context)).toThrow();
    });

    test("greaterThan works correctly with two operands", () => {
      context.push(3);
      context.push(5);

      greaterThan(context);

      expect(context.getStackTop()).toBe(true);
      expect(context.stackSize).toBe(1);
    });

    test("lessThan throws when insufficient operands", () => {
      context.push(3);
      expect(() => lessThan(context)).toThrow();
    });

    test("and throws when insufficient operands", () => {
      context.push(true);
      expect(() => and(context)).toThrow();
    });

    test("all arithmetic operations throw with empty stack", () => {
      expect(context.stackSize).toBe(0);

      expect(() => add(context)).toThrow();
      expect(() => greaterThan(context)).toThrow();
      expect(() => lessThan(context)).toThrow();
      expect(() => and(context)).toThrow();
    });

    test("add throws when operands are not numbers", () => {
      context.push("not_a_number");
      context.push("also_not_a_number");

      expect(() => add(context)).toThrow();
    });

    test("add throws when mixing numbers and non-numbers", () => {
      context.push(42);
      context.push("not_a_number");

      expect(() => add(context)).toThrow();
    });

    test("greaterThan throws when operands are not comparable", () => {
      context.push({}); // object
      context.push([]); // array

      expect(() => greaterThan(context)).toThrow();
    });

    test("jumpIfTrue throws when value is not boolean", () => {
      context.push("not_boolean");

      expect(() => jumpIfTrue(context, 1)).toThrow();
      expect(() => jumpIfFalse(context, 1)).toThrow();
    });

    test("and throws when operands are not boolean-like", () => {
      context.push({});
      context.push([]);

      expect(() => and(context)).toThrow();
    });
  });

  describe("Return value handling", () => {
    test("pushReturnValue throws when stack is empty", () => {
      expect(context.stackSize).toBe(0);
      expect(() => pushReturnValue(context)).toThrow();
    });

    test("pushReturnValue moves value from stack to return values", () => {
      const testValue = "return_value";
      context.push(testValue);

      pushReturnValue(context);

      expect(context.getReturnCount()).toBe(1);
      expect(context.stackSize).toBe(0); // Should consume the value

      // Check that the return value is stored correctly
      const returnValues = context.getReturnValues();
      expect(returnValues[0]).toBe(testValue);
    });

    test("returnFromProcedure throws when cannot return", () => {
      // Only main procedure on stack, cannot return
      expect(machine.canReturnFromProcedure()).toBe(false);
      expect(() => returnFromProcedure(context)).toThrow();
    });

    test("returnFromProcedure works correctly with nested procedure", () => {
      // Create a nested procedure context
      const nestedProc = createTestProcedure([]);
      machine.invokeProcedure(nestedProc, []);
      const nestedCtx = machine.currentProcedureContext()!;

      // Set up return values
      nestedCtx.pushReturnValue("result1");
      nestedCtx.pushReturnValue("result2");

      // This should work since we have nested procedure
      expect(() => returnFromProcedure(nestedCtx)).not.toThrow();

      // Check that return values were transferred to main context
      const mainCtx = machine.currentProcedureContext()!;
      expect(mainCtx.getStackTop()).toBe("result2");
      expect(mainCtx.stackSize).toBe(2);
    });
  });

  describe("Basic instruction behavior verification", () => {
    test("literal pushes values to stack", () => {
      const testValue = {test: "object"};

      literal(context, testValue);

      expect(context.getStackTop()).toBe(testValue);
      expect(context.stackSize).toBe(1);
    });

    test("multiple literal pushes work correctly", () => {
      literal(context, "first");
      literal(context, "second");
      literal(context, "third");

      expect(context.stackSize).toBe(3);
      expect(context.getStackTop()).toBe("third");
    });
  });

  describe("Complex instruction sequences", () => {
    test("variable assignment and retrieval sequence", () => {
      // Set up a variable
      literal(context, 42);
      setVariable(context, "answer");

      // Modify stack
      literal(context, "temp");
      context.pop(); // Clear stack

      // Retrieve variable
      getVariable(context, "answer");

      expect(context.getStackTop()).toBe(42);
    });

    test("arithmetic with variables", () => {
      // Set variables
      setVariableToLiteral(context, "x", 10);
      setVariableToLiteral(context, "y", 20);

      // Load and add
      getVariable(context, "x");
      getVariable(context, "y");
      add(context);

      expect(context.getStackTop()).toBe(30);
    });

    test("conditional flow with arithmetic", () => {
      // Create a procedure with enough dummy instructions for the jump
      const flowProc = createTestProcedure([{}, {}, {}, {}, {}, {}]); // 6 dummy instructions
      machine.loadMemory("flowTest", flowProc);
      machine.invokeProcedure(flowProc, []);
      const flowCtx = machine.currentProcedureContext()!;

      // Set up comparison
      literal(flowCtx, 5);
      literal(flowCtx, 10);
      greaterThan(flowCtx);

      // Use result for conditional jump
      jumpIfTrue(flowCtx, 5);

      expect(flowCtx.stackSize).toBe(0);
      // PC should have advanced since 10 > 5 is true
      expect(flowCtx.pc).toBeGreaterThan(0);
    });
  });
});
