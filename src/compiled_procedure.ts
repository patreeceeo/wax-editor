import type {Machine} from "./machine";

export type CompiledProcedure = CompiledInstruction[];

export type CompiledInstructionArg = any;


export interface InstructionFn<Args extends any[] = any[]> {
  (ctx: ProcedureContext, ...args: Args): true | void;
}

export interface CompiledInstruction<Args extends any[] = any[]> {
  fn: InstructionFn<Args>;
  args: Args;
};

export class ProcedureContext {
  private _variables: {[key: string]: CompiledInstructionArg} = Object.create(null);
  private _stack: CompiledInstructionArg[] = [];
  private _machine: Machine;

  constructor(machine: Machine) {
    this._machine = machine;
  }

  get machine() {
    return this._machine;
  }

  _setMachine(machine: Machine) {
    this._machine = machine;
  }

  pc: number = 0;

  push(value: CompiledInstructionArg) {
    this._stack.push(value);
  }
  pop() {
    return this._stack.pop();
  }

  set(name: string, value: CompiledInstructionArg) {
    this._variables[name] = value;
  }
  get(name: string) {
    return this._variables[name];
  }

  toJSON() {
    return {
      variables: {...this._variables},
      stack: [...this._stack],
      pc: this.pc
    };
  }
}

