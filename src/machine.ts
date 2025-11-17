import {Memory} from "./memory";
import {type CompiledInstruction, type CompiledInstructionArg, type CompiledProcedure} from "./compiled_procedure";
import {PersistentObject} from "./persistent_object";
import {invariant} from "./error";
import {WaxClass} from "./wax_classes";
import {Variable} from "./variable";
import {ProcedureContext} from "./procedure_context";

export class Machine extends PersistentObject {
  private _stack: ProcedureContext[] = [];
  private _memory = new Memory<CompiledInstructionArg>();
  private _running = false;

  start() {
    this._stack = [];
    const main = this._memory.get("main");
    invariant(main !== undefined, "No 'main' procedure loaded in machine memory.");
    this.invokeProcedure(main, []);
    this._running = true;
  }

  halt() {
    this._running = false;
  }

  isRunning() {
    return this._running;
  }

  loadMemory(key: string, proc: CompiledProcedure) {
    this._memory.set(key, proc);
  }

  readMemory(key: string): CompiledInstructionArg | undefined {
    return this._memory.get(key);
  }

  _getParentContextForProcedure(procedure: CompiledProcedure): ProcedureContext | undefined {
    if(procedure.parentProcedure === undefined) {
      return undefined;
    }
    // Walk backwards through the stack to find the nearest context whose procedure is the parent of the given procedure
    for (const ctx of this._stack) {
      if (ctx.procedure.id === procedure.parentProcedure.id) {
        return ctx;
      }
    }
    throw new Error("No parent context found for procedure.");
  }

  invokeMethod(receiver: CompiledInstructionArg, methodSelector: string, args: CompiledInstructionArg[]) {
    const receiverClass = WaxClass.forJsObject(receiver);
    invariant(receiverClass !== undefined, `Receiver of message '${methodSelector}' does not have a WaxClass.`);
    const method = receiverClass.lookupMethod(methodSelector);
    invariant(method !== undefined, `Method '${methodSelector}' not found on receiver's class.`);
    this.invokeProcedure(method, [...args, receiver], methodSelector);
  }

  invokeProcedure(procedure: CompiledProcedure, args: CompiledInstructionArg[] = [], methodSelector?: string) {
    const newCtx = new ProcedureContext({machine: this, procedure, parentContext: this._getParentContextForProcedure(procedure), methodSelector});
    this._stack.unshift(newCtx);
    for (const arg of args) {
      newCtx.push(arg);
    }
  }

  returnFromProcedure() {
    invariant(this._stack.length > 1, "Machine stack underflow: no procedure context to return to.");
    const poppedCtx = this._stack.shift()!;
    const currentCtx = this.currentProcedureContext()!;
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
    if(!this._running) {
      return;
    }
    const ctx = this.currentProcedureContext();
    const procedure = this.currentProcedure();
    invariant(ctx !== undefined, "No current procedure context to get instruction from.");
    invariant(procedure !== null, "No current procedure to get instruction from.");
    invariant(ctx.pc < procedure.length, "Program counter out of bounds of current procedure.");
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

  private _nextVariableId = 0;
  createVariable(): Variable {
    const variable = new Variable({id: this._nextVariableId++, value: undefined});
    return variable;
  }

  indexOfProcedureContext(context: ProcedureContext): number {
    return this._stack.indexOf(context);
  }

  getProcedureContextAtIndex(index: number): ProcedureContext | undefined {
    invariant(index < this._stack.length, `No procedure context at index ${index}.`);
    return index >= 0 ? this._stack.at(-index) : undefined;
  }

  getCallStack(): (string | number)[] {
    return this._stack.map(ctx => ctx.procedure.id);
  }

  getStackDepth(): number {
    return this._stack.length;
  }

  isAtEndOfProcedure(): boolean {
    const ctx = this.currentProcedureContext();
    const procedure = this.currentProcedure();
    if (!ctx || !procedure) return true;
    return ctx.pc >= procedure.length;
  }

  canReturnFromProcedure(): boolean {
    return this._stack.length > 1;
  }

  getVariableCount(): number {
    return this._nextVariableId;
  }
}

