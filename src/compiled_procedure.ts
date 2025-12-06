import type { ProcedureContext } from "./procedure_context";
import { isObjectOrArray } from "./utils";

const CompiledProcedureSymbol = Symbol("CompiledProcedure");

interface CompiledProcedureInit {
  id: number | string;
  instructions?: CompiledInstruction[];
  parentProcedure?: CompiledProcedure;
}

export class CompiledProcedure {
  static isInstance(value: any): value is CompiledProcedure {
    return isObjectOrArray(value) && CompiledProcedureSymbol in value;
  }

  private _body: CompiledInstruction[];
  private _parentProcedure?: CompiledProcedure;
  readonly id: number | string;

  [CompiledProcedureSymbol] = true;

  constructor({
    id,
    instructions = [],
    parentProcedure,
  }: CompiledProcedureInit) {
    this.id = id;
    this._body = instructions;
    this._parentProcedure = parentProcedure;
  }
  get length() {
    return this._body.length;
  }
  at(index: number): CompiledInstruction | undefined {
    // Array.at is still somewhat new and may not be supported everywhere
    // TODO polyfill?
    const length = this._body.length;
    return this._body[index < 0 ? length + (index % length) : index % length];
  }
  append(...instruction: CompiledInstruction[]) {
    this._body.push(...instruction);
  }
  map<T>(fn: (instr: CompiledInstruction, index: number) => T): T[] {
    return this._body.map(fn);
  }
  get parentProcedure() {
    return this._parentProcedure;
  }
}

export type CompiledInstructionArg =
  | undefined
  | number
  | string
  | boolean
  | Array<CompiledInstructionArg>
  | { [key: string]: CompiledInstructionArg }
  | CompiledProcedure;

export interface InstructionFn<Args extends any[] = any[]> {
  (ctx: ProcedureContext, ...args: Args): true | void;
  // `function.name` is readonly and will get minified, hence a custom property
  displayName: string;
}

export interface CompiledInstruction<Args extends any[] = any[]> {
  name: string;
  fn: InstructionFn<Args>;
  args: Args;
}
