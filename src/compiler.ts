import type {CompiledInstruction, InstructionFn} from "./compiled_procedure";

export class Compiler {
  static emit<Args extends any[]>(fn: InstructionFn<Args>, ...args: Args): CompiledInstruction<Args> {
    return {fn, args};
  }
}
