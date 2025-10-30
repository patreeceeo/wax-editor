import {immerable} from "immer";
import {Memory} from "./memory";
import {ProcedureContext, type CompiledInstruction, type CompiledInstructionArg, type CompiledProcedure, type InstructionFn} from "./compiled_procedure";


/* Compiler functions */
export function emit<Args extends any[]>(fn: InstructionFn<Args>, ...args: Args): CompiledInstruction<Args> {
  return {fn, args};
}
/* End of compiler functions */

export class Machine {
  private _stack: ProcedureContext[] = [];
  private _memory = new Memory<CompiledInstructionArg>();
  private _currentProcedureKey: string | null = null;
  [immerable] = true;

  start() {
    this.invokeProcedure('main');
  }

  load(key: string, proc: CompiledProcedure) {
    this._memory.set(key, proc);
  }

  invokeProcedure(key: string) {
    this._currentProcedureKey = key;
    const newCtx = new ProcedureContext();
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
}

/** Instruction implementations **/
export function literal(ctx: ProcedureContext, obj: CompiledInstructionArg) {
  ctx.push(obj);
}
function getProperty(ctx: ProcedureContext) {
  const property = ctx.pop();
  const object = ctx.pop();
  ctx.push(object[property]);
}
function getPropertyAtLiteral(ctx: ProcedureContext, key: string | number) {
  const obj = ctx.pop();
  ctx.push(obj[key]);
}
function setVariable(ctx: ProcedureContext, name: string) {
  ctx.set(name, ctx.pop());
}
function setVariableToLiteral(ctx: ProcedureContext, name: string, value: CompiledInstructionArg) {
  ctx.set(name, value);
}
function getVariable(ctx: ProcedureContext, name: string) {
  ctx.push(ctx.get(name));
}
export function greaterThan(ctx: ProcedureContext) {
  const b = ctx.pop();
  const a = ctx.pop();
  ctx.push(a > b);
}
function jumpIfTrue(ctx: ProcedureContext, pc: number) {
  if (ctx.pop()) {
    // Subtract 1 because applyInstruction will increment pc after this
    ctx.pc = pc - 1;
  }
}
export function add(ctx: ProcedureContext) {
  const b = ctx.pop();
  const a = ctx.pop();
  ctx.push(a + b);
}
/** End of instruction implementations **/

// Example: Find the max element in an array
export const findMaxProc: CompiledProcedure = [
  // array = [...]
  emit(setVariableToLiteral, 'array', [3, 1, 4, 1, 5, 9, 2, 6, 5]),
  // max = 0
  emit(setVariableToLiteral, 'max', 0),
  // i = 0
  emit(setVariableToLiteral, 'i', 0),
  // Loop start
  // max > array[i]
  emit(getVariable, 'max'),
  emit(getVariable, 'array'),
  emit(getVariable, 'i'),
  emit(getProperty),
  emit(greaterThan),
  emit(jumpIfTrue, 13),
  // max = array[i]
  emit(getVariable, 'array'),
  emit(getVariable, 'i'),
  emit(getProperty),
  emit(setVariable, 'max'),
  // i = i + 1
  emit(getVariable, 'i'),
  emit(literal, 1),
  emit(add),
  emit(setVariable, 'i'),

  // Loop condition: array.length > i
  emit(getVariable, 'array'),
  emit(getPropertyAtLiteral, 'length'),
  emit(getVariable, 'i'),
  emit(greaterThan),
  emit(jumpIfTrue, 3),
  // End
]
