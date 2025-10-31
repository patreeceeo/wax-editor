import {Memory} from "./memory";
import {ProcedureContext, type CompiledInstruction, type CompiledInstructionArg, type CompiledProcedure} from "./compiled_procedure";
import {PersistentObject} from "./persistent_object";

export class Machine extends PersistentObject {
  private _stack: ProcedureContext[] = [];
  private _memory = new Memory<CompiledInstructionArg>();
  private _currentProcedureKey: string | null = null;

  start() {
    this.invokeProcedure('main');
  }

  load(key: string, proc: CompiledProcedure) {
    this._memory.set(key, proc);
  }

  invokeProcedure(key: string) {
    this._currentProcedureKey = key;
    const newCtx = new ProcedureContext(this);
    this._stack.unshift(newCtx);
  }

  currentProcedure() {
    if (this._currentProcedureKey) {
      return this._memory.get(this._currentProcedureKey);
    }
    return null;
  }

  currentProcedureContext() {
    return this._stack[0];
  }

  getInstruction() {
    const ctx = this.currentProcedureContext();
    if (this._currentProcedureKey) {
      const proc = this._memory.get(this._currentProcedureKey);
      return proc[ctx.pc] as CompiledInstruction;
    }
    return null;
  }

  applyInstruction(instruction: CompiledInstruction): true | void {
    const ctx = this.currentProcedureContext();
    const result = instruction.fn(ctx, ...instruction.args);
    ctx.pc += 1;
    return result;
  }

  afterProduce(): void {
    // All of my contexts should point to me instead of the previous machine
    for (const ctx of this._stack) {
      ctx._setMachine(this);
    }
  }
}

