import {immerable} from "immer";
import {Memory} from "./memory";

type CompiledInstructionArg = any;

export class ProcedureContext {
  variables: {[key: string]: CompiledInstructionArg} = Object.create(null);
  stack: CompiledInstructionArg[] = [];
  pc: number = 0;
  [immerable] = true;
}

function pushStack(stack: CompiledInstructionArg[], value: CompiledInstructionArg) {
  stack.push(value);
}
function popStack(stack: CompiledInstructionArg[]) {
  return stack.pop();
}

interface InstructionFn<Args extends any[] = any[]> {
  (ctx: ProcedureContext, ...args: Args): true | void;
}

export interface CompiledInstruction<Args extends any[] = any[]> {
  fn: InstructionFn<Args>;
  args: Args;
};

/* Compiler functions */
function emit<Args extends any[]>(fn: InstructionFn<Args>, ...args: Args): CompiledInstruction<Args> {
  return {fn, args};
}
/* End of compiler functions */

export type CompiledProcedure = CompiledInstruction[];


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
      return proc[ctx.pc];
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

export function nextInstruction(ctx: ProcedureContext, program: CompiledProcedure) {
  return program[ctx.pc];
}

export function stepProgram(ctx: ProcedureContext, instruction: CompiledInstruction): true | void {
  const result = instruction.fn(ctx, ...instruction.args);
  ctx.pc += 1;
  return result;
}

/** Instruction implementations **/
function literal(ctx: ProcedureContext, obj: CompiledInstructionArg) {
  pushStack(ctx.stack, obj);
}
function getProperty(ctx: ProcedureContext) {
  const property = popStack(ctx.stack);
  const object = popStack(ctx.stack);
  pushStack(ctx.stack, object[property]);
}
function getPropertyAtLiteral(ctx: ProcedureContext, key: string | number) {
  const obj = popStack(ctx.stack);
  pushStack(ctx.stack, obj[key]);
}
function setVariable(ctx: ProcedureContext, name: string) {
  ctx.variables[name] = popStack(ctx.stack);
}
function setVariableToLiteral(ctx: ProcedureContext, name: string, value: CompiledInstructionArg) {
  ctx.variables[name] = value;
}
function getVariable(ctx: ProcedureContext, name: string) {
  pushStack(ctx.stack, ctx.variables[name]);
}
function greaterThan(ctx: ProcedureContext) {
  const b = popStack(ctx.stack);
  const a = popStack(ctx.stack);
  pushStack(ctx.stack, a > b);
}
function jumpIfTrue(ctx: ProcedureContext, pc: number) {
  if (popStack(ctx.stack)) {
    ctx.pc = pc - 1;
  }
}
function add(ctx: ProcedureContext) {
  const b = popStack(ctx.stack);
  const a = popStack(ctx.stack);
  pushStack(ctx.stack, a + b);
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
