import {immerable} from "immer";
type ScriptingObject = any;

export class ScriptingContext {
  variables: {[key: string]: ScriptingObject} = {};
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

function invariant(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

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
function pushObject(ctx: ScriptingContext, obj: ScriptingObject) {
  pushStack(ctx.stack, obj);
}
function pushFromIndex(ctx: ScriptingContext) {
  const index = popStack(ctx.stack);
  const array = popStack(ctx.stack);
  invariant(Array.isArray(array), 'Current object is not an array');
  pushStack(ctx.stack, array[index]);
}
function setVariable(ctx: ScriptingContext, name: string) {
  ctx.variables[name] = popStack(ctx.stack);
}
function pushFromVariable(ctx: ScriptingContext, name: string) {
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
function addAndPush(ctx: ScriptingContext) {
  const b = popStack(ctx.stack);
  const a = popStack(ctx.stack);
  pushStack(ctx.stack, a + b);
}
function pushJsProperty(ctx: ScriptingContext, property: string) {
  const obj = popStack(ctx.stack);
  invariant(property in obj, `Property ${property} does not exist on object`);
  pushStack(ctx.stack, obj[property]);
}

// Example: Find the max element in an array
export const exampleProgram: CompiledProgram = [
  // array = [...]
  emit(pushObject, [3, 1, 4, 1, 5, 9, 2, 6, 5]),
  emit(setVariable, 'array'),
  // max = 0
  emit(pushObject, 0),
  emit(setVariable, 'max'),
  // i = 0
  emit(pushObject, 0),
  emit(setVariable, 'i'),
  // Loop start
  // max > array[i]
  emit(pushFromVariable, 'max'),
  emit(pushFromVariable, 'array'),
  emit(pushFromVariable, 'i'),
  emit(pushFromIndex),
  emit(greaterThan),
  emit(jumpIfTrue, 4),
  // max = array[i]
  emit(pushFromVariable, 'array'),
  emit(pushFromVariable, 'i'),
  emit(pushFromIndex),
  emit(setVariable, 'max'),
  // i = i + 1
  emit(pushFromVariable, 'i'),
  emit(pushObject, 1),
  emit(addAndPush),
  emit(setVariable, 'i'),

  // Loop condition: array.length > i
  emit(pushFromVariable, 'array'),
  emit(pushJsProperty, 'length'),
  emit(pushFromVariable, 'i'),
  emit(greaterThan),
  emit(jumpIfTrue, -19),
  // End
]
