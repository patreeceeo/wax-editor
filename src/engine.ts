import {immerable} from "immer";
type ScriptingObject = any;

export class ScriptingContext {
  variables: {[key: string]: ScriptingObject} = Object.create(null);
  stack: ScriptingObject[] = [];
  pc: number = 0;
  [immerable] = true;
}

interface OperationFn<Args extends any[] = any[]> {
  (ctx: ScriptingContext, ...args: Args): true | void;
}

export interface CompiledOperation<Args extends any[] = any[]> {
  op: OperationFn<Args>;
  args: Args;
};

function emit<Args extends any[]>(op: OperationFn<Args>, ...args: Args): CompiledOperation<Args> {
  return {op, args};
}

type CompiledProgram = CompiledOperation[];

export function stepProgram(ctx: ScriptingContext, instruction: CompiledOperation): true | void {
  const result = instruction.op(ctx, ...instruction.args);
  ctx.pc += 1;
  return result;
}

export function nextInstruction(ctx: ScriptingContext, program: CompiledProgram) {
  return program[ctx.pc];
}

function pushStack(stack: ScriptingObject[], value: ScriptingObject) {
  stack.push(value);
}
function popStack(stack: ScriptingObject[]) {
  return stack.pop();
}

function literal(ctx: ScriptingContext, obj: ScriptingObject) {
  pushStack(ctx.stack, obj);
}
function getProperty(ctx: ScriptingContext) {
  const property = popStack(ctx.stack);
  const object = popStack(ctx.stack);
  pushStack(ctx.stack, object[property]);
}
function getPropertyAtLiteral(ctx: ScriptingContext, key: string | number) {
  const obj = popStack(ctx.stack);
  pushStack(ctx.stack, obj[key]);
}
function setVariable(ctx: ScriptingContext, name: string) {
  ctx.variables[name] = popStack(ctx.stack);
}
function setVariableToLiteral(ctx: ScriptingContext, name: string, value: ScriptingObject) {
  ctx.variables[name] = value;
}
function getVariable(ctx: ScriptingContext, name: string) {
  pushStack(ctx.stack, ctx.variables[name]);
}
function greaterThan(ctx: ScriptingContext) {
  const b = popStack(ctx.stack);
  const a = popStack(ctx.stack);
  pushStack(ctx.stack, a > b);
}
function jumpIfTrue(ctx: ScriptingContext, deltaPc: number) {
  if (popStack(ctx.stack)) {
    ctx.pc += deltaPc;
  }
}
function add(ctx: ScriptingContext) {
  const b = popStack(ctx.stack);
  const a = popStack(ctx.stack);
  pushStack(ctx.stack, a + b);
}

// Example: Find the max element in an array
export const exampleProgram: CompiledProgram = [
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
  emit(jumpIfTrue, 4),
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
  emit(jumpIfTrue, -19),
  // End
]
