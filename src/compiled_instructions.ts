import {type CompiledInstructionArg, type InstructionFn, CompiledProcedure} from "./compiled_procedure";
import {invariant} from "./error";
import { isString, isNumber, isBoolean, getTypeName, isObjectOrArray } from "./utils";

// Convert all instruction functions to function expressions with explicit names
// This ensures function names are preserved during minification

/** Context manipulation instructions **/
export const literal: InstructionFn<[CompiledInstructionArg]> = (ctx, obj) => {
  ctx.push(obj);
};
literal.displayName = "literal";

export const pop: InstructionFn<[]> = (ctx) => {
  ctx.pop();
};
pop.displayName = "pop";

export const setVariable: InstructionFn<[string]> = (ctx, name) => {
  ctx.set(name, ctx.pop());
};
setVariable.displayName = "setVariable";

export const setVariableToLiteral: InstructionFn<[string, CompiledInstructionArg]> = (ctx, name, value) => {
  ctx.set(name, value);
};
setVariableToLiteral.displayName = "setVariableToLiteral";

export const getVariable: InstructionFn<[string]> = (ctx, name) => {
  ctx.push(ctx.get(name));
};
getVariable.displayName = "getVariable";

export const pushReturnValue: InstructionFn<[]> = (ctx) => {
  ctx.pushReturnValue(ctx.pop());
};
pushReturnValue.displayName = "pushReturnValue";

/** Control flow instructions **/
export const returnFromProcedure: InstructionFn<[]> = (ctx) => {
  ctx.machine.returnFromProcedure();
};
returnFromProcedure.displayName = "returnFromProcedure";

export const jump: InstructionFn<[number]> = (ctx, deltaPc) => {
  const newPc = ctx.pc + deltaPc;
  invariant(newPc >= 0, `Invalid jump target: ${newPc} is negative`);
  invariant(newPc <= ctx.maxPc, `Invalid jump target: ${newPc} exceeds max PC of ${ctx.maxPc}`);
  ctx.pc = newPc;
};
jump.displayName = "jump";

export const jumpIfTrue: InstructionFn<[number]> = (ctx, deltaPc) => {
  const value = ctx.pop();
  invariant(isBoolean(value), `jumpIfTrue expects boolean value, got ${typeof value}`);
  if (value) {
    const newPc = ctx.pc + deltaPc;
    invariant(newPc >= 0, `Invalid jump target: ${newPc} is negative`);
    invariant(newPc <= ctx.maxPc, `Invalid jump target: ${newPc} exceeds max PC of ${ctx.maxPc}`);
    ctx.pc = newPc;
  }
};
jumpIfTrue.displayName = "jumpIfTrue";

export const jumpIfFalse: InstructionFn<[number]> = (ctx, deltaPc) => {
  const value = ctx.pop();
  invariant(isBoolean(value), `jumpIfFalse expects boolean value, got ${typeof value}`);
  if (!value) {
    const newPc = ctx.pc + deltaPc;
    invariant(newPc >= 0, `Invalid jump target: ${newPc} is negative`);
    invariant(newPc <= ctx.maxPc, `Invalid jump target: ${newPc} exceeds max PC of ${ctx.maxPc}`);
    ctx.pc = newPc;
  }
};
jumpIfFalse.displayName = "jumpIfFalse";

export const sendMessage: InstructionFn<[string, number]> = (ctx, message, argCount) => {
  invariant(argCount <= ctx.stackSize - 1, `Argument count mismatch when sending message '${message}': expected ${argCount}, got ${ctx.stackSize - 1}.`);
  const args: CompiledInstructionArg[] = [];
  for (let i = 0; i < argCount; i++) {
    args.unshift(ctx.pop()!);
  }
  const receiver = ctx.pop();
  ctx.machine.invokeMethod(receiver, message, args);
};
sendMessage.displayName = "sendMessage";

export const invokeProcedure: InstructionFn<[]> = (ctx) => {
  const procedure = ctx.pop();
  invariant(CompiledProcedure.isInstance(procedure), `invokeProcedure expects a CompiledProcedure, got ${typeof procedure}`);
  ctx.machine.invokeProcedure(procedure);
};
invokeProcedure.displayName = "invokeProcedure";

export const halt: InstructionFn<[]> = (ctx) => {
  ctx.machine.halt();
};
halt.displayName = "halt";

/** Number instructions **/
export const greaterThan: InstructionFn<[]> = (ctx) => {
  const a = ctx.pop();
  const b = ctx.pop();
  invariant(isNumber(a) && isNumber(b), `greaterThan expects numeric operands, got ${typeof a} and ${typeof b}`);
  ctx.push(a > b);
};
greaterThan.displayName = "greaterThan";

export const lessThan: InstructionFn<[]> = (ctx) => {
  const a = ctx.pop();
  const b = ctx.pop();
  invariant(isNumber(a) && isNumber(b), `lessThan expects numeric operands, got ${typeof a} and ${typeof b}`);
  ctx.push(a < b);
};
lessThan.displayName = "lessThan";

export const add: InstructionFn<[]> = (ctx) => {
  const a = ctx.pop();
  const b = ctx.pop();
  invariant(isNumber(a) && isNumber(b), `add expects numeric operands, got ${typeof a} and ${typeof b}`);
  ctx.push(a + b);
};
add.displayName = "add";

/** Boolean instructions **/
export const and: InstructionFn<[]> = (ctx) => {
  const a = ctx.pop();
  const b = ctx.pop();
  invariant(isBoolean(a) && isBoolean(b), `and expects boolean operands, got ${typeof a} and ${typeof b}`);
  ctx.push(a && b);
};
and.displayName = "and";

/** JS Object instructions **/
export const getJsObjectPropertyForLiteral: InstructionFn<[string | number]> = (ctx, key) => {
  const obj = ctx.pop();
  invariant(isObjectOrArray(obj), `getJsObjectPropertyForLiteral called on non-object/array: ${getTypeName(obj)}`);
  ctx.push((obj as any)[key]);
};
getJsObjectPropertyForLiteral.displayName = "getJsObjectPropertyForLiteral";

export const getJsObjectProperty: InstructionFn<[]> = (ctx) => {
  const obj = ctx.pop();
  const key = ctx.pop();
  invariant(isObjectOrArray(obj), `getProperty called on non-object/array: ${getTypeName(obj)}`);
  invariant(isString(key) || isNumber(key), `getProperty called with non-string/number property: ${getTypeName(key)}`);
  ctx.push((obj as any)[key]);
};
getJsObjectProperty.displayName = "getJsObjectProperty";
