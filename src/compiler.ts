import type { AstNode } from "./abstract_syntax_tree";
import {
  literal as literalInstruction,
  pushReturnValue,
  returnFromProcedure,
  setVariable,
  sendMessage as sendMessageInstruction,
  getVariable as getVariableInstruction,
  halt as haltInstruction,
} from "./compiled_instructions";
import {
  CompiledProcedure,
  type CompiledInstruction,
  type InstructionFn,
} from "./compiled_procedure";
import { invariant } from "./error";
import type { Machine } from "./machine";
import { okIf, type Result } from "./result";

interface CompilerInit {
  machine: Machine;
}

export class Compiler {
  static emit<Args extends any[]>(
    fn: InstructionFn<Args>,
    ...args: Args
  ): CompiledInstruction<Args> {
    return { name: fn.displayName, fn, args };
  }

  static plan<Args extends any[]>(
    fn: CompilerStepFn<Args>,
    ...args: Args
  ): CompilerStep<Args> {
    return { fn, args };
  }

  private _procedureStack: CompiledProcedure[] = [];
  private _machine: Machine;

  constructor({ machine }: CompilerInit) {
    this._machine = machine;
  }

  private _topProcedure: CompiledProcedure | undefined;
  private _nextProcedureId = 0;

  pushProcedure() {
    const id = this._nextProcedureId++;
    const child = new CompiledProcedure({
      id,
      parentProcedure: this._topProcedure,
    });
    this._procedureStack.push(child);
    this._topProcedure = child;
  }

  popProcedure(): Result<CompiledProcedure, string> {
    const length = this._procedureStack.length;
    const popped = this._procedureStack.pop();
    this._topProcedure = this._procedureStack.at(-1);
    return okIf(
      length > 0,
      popped!,
      "Procedure stack underflow: no procedure to pop.",
    );
  }

  get currentProcedure(): CompiledProcedure | undefined {
    return this._topProcedure;
  }

  append(...instructions: CompiledInstruction[]) {
    invariant(
      this._topProcedure !== undefined,
      "Cannot append instructions without an active procedure",
    );
    this._topProcedure.append(...instructions);
  }

  compile(astNode: AstNode) {
    const steps = astNode.getSteps();
    this.pushProcedure();
    for (const step of steps) {
      step.fn(this, ...step.args);
    }
    const procedure = this.popProcedure().unwrap();
    this._machine.loadMemory("main", procedure);
  }
}

interface CompilerStepFn<Args extends any[] = []> {
  (compiler: Compiler, ...args: Args): void;
}
export interface CompilerStep<Args extends any[] = any> {
  fn: CompilerStepFn<Args>;
  args: Args;
}
export const returnStatement: CompilerStepFn = (compiler: Compiler) => {
  compiler.append(
    Compiler.emit(pushReturnValue),
    Compiler.emit(returnFromProcedure),
  );
};
export const assignmentStatement: CompilerStepFn<[string]> = (
  compiler: Compiler,
  variableName: string,
) => {
  compiler.append(Compiler.emit(setVariable, variableName));
};
export const literal: CompilerStepFn<[any]> = (
  compiler: Compiler,
  value: any,
) => {
  compiler.append(Compiler.emit(literalInstruction, value));
};
export const enterProecedure: CompilerStepFn = (compiler: Compiler) => {
  compiler.pushProcedure();
};
export const exitProcedure: CompilerStepFn = (compiler: Compiler) => {
  // Append implicit return if needed
  if (compiler.currentProcedure!.at(-1)?.fn !== returnFromProcedure) {
    compiler.append(Compiler.emit(returnFromProcedure));
  }
  const procedure = compiler.popProcedure().unwrap();
  compiler.append(Compiler.emit(literalInstruction, procedure));
};
export const sendMessage: CompilerStepFn<[string, number]> = (
  compiler: Compiler,
  message: string,
  argCount: number,
) => {
  compiler.append(Compiler.emit(sendMessageInstruction, message, argCount));
};
export const getVariable: CompilerStepFn<[string]> = (
  compiler: Compiler,
  variableName: string,
) => {
  compiler.append(Compiler.emit(getVariableInstruction, variableName));
};
export const halt: CompilerStepFn = (compiler: Compiler) => {
  compiler.append(Compiler.emit(haltInstruction));
};
