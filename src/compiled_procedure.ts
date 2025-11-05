import type {Machine} from "./machine";

const CompiledProcedureSymbol = Symbol("CompiledProcedure");

// export type CompiledProcedure = CompiledInstruction[];
export class CompiledProcedure {
  static isInstance(value: any): value is CompiledProcedure {
    return CompiledProcedureSymbol in value;
  }
  [CompiledProcedureSymbol] = true;
  private body: CompiledInstruction[];
  constructor(instructions: CompiledInstruction[] = []) {
    this.body = instructions;
  }
  get length() {
    return this.body.length;
  }
  at(index: number): CompiledInstruction | undefined {
    // Array.at is still somewhat new and may not be supported everywhere
    const length = this.body.length;
    return this.body[index < 0 ? length + (index % length) : (index % length)];
  }
  append(...instruction: CompiledInstruction[]) {
    this.body.push(...instruction);
  }
  map<T>(fn: (instr: CompiledInstruction, index: number) => T): T[] {
    return this.body.map(fn);
  }
}

export type CompiledInstructionArg = any;


export interface InstructionFn<Args extends any[] = any[]> {
  (ctx: ProcedureContext, ...args: Args): true | void;
}

export interface CompiledInstruction<Args extends any[] = any[]> {
  fn: InstructionFn<Args>;
  args: Args;
};

interface ProcedureContextInit {
  machine: Machine;
  procedure: CompiledProcedure;
}

export class ProcedureContext {
  private _variables: {[key: string]: CompiledInstructionArg} = Object.create(null);
  private _stack: CompiledInstructionArg[] = [];
  private _machine: Machine;
  private _returnValues: CompiledInstructionArg[] = [];

  private _procedure: CompiledProcedure;

  constructor({machine, procedure}: ProcedureContextInit) {
    this._machine = machine;
    this._procedure = procedure;
  }

  get machine() {
    return this._machine;
  }

  get procedure() {
    return this._procedure
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

  pushReturnValue(value: CompiledInstructionArg) {
    this._returnValues.push(value);
  }
  acceptReturnValues(otherCtx: ProcedureContext): void {
    this._stack.push(...otherCtx._returnValues);
  }

  toJSON() {
    return {
      variables: {...this._variables},
      stack: [...this._stack],
      pc: this.pc
    };
  }
}

