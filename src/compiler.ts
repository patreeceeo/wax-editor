import type {AstNode} from "./abstract_syntax_tree";
import {literal as literalInstruction, pushReturnValue, returnFromProcedure, setVariable, sendMessage as sendMessageInstruction, getVariable as getVariableInstruction} from "./compiled_instructions";
import {CompiledProcedure, type CompiledInstruction, type InstructionFn} from "./compiled_procedure";
import type {Machine} from "./machine";

interface CompilerInit {
  machine: Machine
}

export class Compiler {
  static emit<Args extends any[]>(fn: InstructionFn<Args>, ...args: Args): CompiledInstruction<Args> {
    return {fn, args};
  }

  static plan<Args extends any[]>(fn: CompilerStepFn<Args>, ...args: Args): CompilerStep<Args> {
    return {fn, args};
  }

  private _procedureStack: CompiledProcedure[] = [];
  private _machine: Machine;

  constructor({machine}: CompilerInit) {
    this._machine = machine;
  }

  pushProcedure() {
    return this._procedureStack.push(new CompiledProcedure());
  }

  popProcedure() {
    return this._procedureStack.pop();
  }

  append(...instructions: CompiledInstruction[]) {
    const currentProcedure = this._procedureStack[this._procedureStack.length - 1];
    currentProcedure.append(...instructions);
  }

  compile(astNode: AstNode) {
    const steps = astNode.getSteps();
    this.pushProcedure();
    for (const step of steps) {
      step.fn(this, ...step.args);
    }
    const procedure = this.popProcedure();
    this._machine.loadMemory("main", procedure!);
  }
}

interface CompilerStepFn<Args extends any[] = []> {
  (compiler: Compiler, ...args: Args): void;
}
export interface CompilerStep<Args extends any[] = any> {
  fn: CompilerStepFn<Args>;
  args: Args
}
export const returnStatement: CompilerStepFn = (compiler: Compiler) => {
  compiler.append(
    Compiler.emit(pushReturnValue),
    Compiler.emit(returnFromProcedure)
  )
}
export const assignmentStatement: CompilerStepFn<[string]> = (compiler: Compiler, variableName: string)  => {
  compiler.append(
    Compiler.emit(setVariable, variableName)
  )
}
export const literal: CompilerStepFn<[any]> = (compiler: Compiler, value: any) => {
  compiler.append(
    Compiler.emit(literalInstruction, value)
  )
}
export const enterProecedure: CompilerStepFn = (compiler: Compiler) => {
  compiler.pushProcedure();
}
export const exitProcedure: CompilerStepFn = (compiler: Compiler) => {
  const procedure = compiler.popProcedure();
  compiler.append(
    Compiler.emit(literalInstruction, procedure)
  )
}
export const sendMessage: CompilerStepFn<[string, number]> = (compiler: Compiler, message: string, argCount: number) => {
  compiler.append(
    Compiler.emit(sendMessageInstruction, message, argCount)
  )
}
export const getVariable: CompilerStepFn<[string]> = (compiler: Compiler, variableName: string) => {
  compiler.append(
    Compiler.emit(getVariableInstruction, variableName),
  )
}

