import {Memory} from "./memory";
import {ProcedureContext, type CompiledInstruction, type CompiledInstructionArg, type CompiledProcedure} from "./compiled_procedure";
import {PersistentObject} from "./persistent_object";
import {invariant} from "./error";

export class Machine extends PersistentObject {
  private _stack: ProcedureContext[] = [];
  private _memory = new Memory<CompiledInstructionArg>();

  start() {
    const main = this._memory.get("main");
    invariant(main !== undefined, "No 'main' procedure loaded in machine memory.");
    this.invokeProcedure(main);
  }

  loadMemory(key: string, proc: CompiledProcedure) {
    this._memory.set(key, proc);
  }

  readMemory(key: string): CompiledInstructionArg | undefined {
    return this._memory.get(key);
  }

  invokeProcedure(procedure: CompiledProcedure) {
    const newCtx = new ProcedureContext({machine: this, procedure});
    this._stack.unshift(newCtx);
  }

  returnFromProcedure() {
    invariant(this._stack.length > 1, "Machine stack underflow: no procedure context to return to.");
    const poppedCtx = this._stack.pop()!;
    const currentCtx = this._stack[0]!;
    currentCtx.acceptReturnValues(poppedCtx)
  }

  currentProcedure() {
    const ctx = this.currentProcedureContext();
    if (ctx) {
      return ctx.procedure;
    }
    return null;
  }

  currentProcedureContext(): ProcedureContext | undefined {
    return this._stack[0];
  }

  getInstruction() {
    const ctx = this.currentProcedureContext();
    const procedure = this.currentProcedure();
    invariant(ctx !== undefined, "No current procedure context to get instruction from.");
    invariant(procedure !== null, "No current procedure to get instruction from.");
    return procedure.at(ctx.pc);
  }

  applyInstruction(instruction: CompiledInstruction): true | void {
    const ctx = this.currentProcedureContext();
    invariant(ctx !== undefined, "No current procedure context to apply instruction.");
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

