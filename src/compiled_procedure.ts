import {immerable} from "immer";

export type CompiledInstructionArg = any;


export interface InstructionFn<Args extends any[] = any[]> {
  (ctx: ProcedureContext, ...args: Args): true | void;
}

export interface CompiledInstruction<Args extends any[] = any[]> {
  fn: InstructionFn<Args>;
  args: Args;
};

export class ProcedureContext {
  [immerable] = true;
  private _variables: {[key: string]: CompiledInstructionArg} = Object.create(null);
  private _stack: CompiledInstructionArg[] = [];

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

