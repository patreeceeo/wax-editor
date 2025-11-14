import {ProcedureContext, type CompiledInstructionArg} from "./compiled_procedure";
import {invariant} from "./error";
import { autoRegisterInstruction } from "./function-registry";

// TODO convert to const function expressions

/** Context manipulation instructions **/
export function literal(ctx: ProcedureContext, obj: CompiledInstructionArg) {
  ctx.push(obj);
}
autoRegisterInstruction(literal);

export function pop(ctx: ProcedureContext) {
  ctx.pop();
}
autoRegisterInstruction(pop);

export function getProperty(ctx: ProcedureContext) {
  const property = ctx.pop();
  const object = ctx.pop();
  ctx.push(object[property]);
}
autoRegisterInstruction(getProperty);

export function getPropertyAtLiteral(ctx: ProcedureContext, key: string | number) {
  const obj = ctx.pop();
  ctx.push(obj[key]);
}
autoRegisterInstruction(getPropertyAtLiteral);

export function setVariable(ctx: ProcedureContext, name: string) {
  ctx.set(name, ctx.pop());
}
autoRegisterInstruction(setVariable);

export function setVariableToLiteral(ctx: ProcedureContext, name: string, value: CompiledInstructionArg) {
  ctx.set(name, value);
}
autoRegisterInstruction(setVariableToLiteral);

export function getVariable(ctx: ProcedureContext, name: string) {
  ctx.push(ctx.get(name));
}
autoRegisterInstruction(getVariable);

export function pushReturnValue(ctx: ProcedureContext) {
  ctx.pushReturnValue(ctx.pop());
}
autoRegisterInstruction(pushReturnValue);

/** Control flow instructions **/
export function returnFromProcedure(ctx: ProcedureContext) {
  ctx.machine.returnFromProcedure();
}
autoRegisterInstruction(returnFromProcedure);

export function jump(ctx: ProcedureContext, deltaPc: number) {
  ctx.pc += deltaPc;
}
autoRegisterInstruction(jump);

export function jumpIfTrue(ctx: ProcedureContext, deltaPc: number) {
  if (ctx.pop()) {
    ctx.pc += deltaPc;
  }
}
autoRegisterInstruction(jumpIfTrue);

export function jumpIfFalse(ctx: ProcedureContext, deltaPc: number) {
  if (!ctx.pop()) {
    ctx.pc += deltaPc;
  }
}
autoRegisterInstruction(jumpIfFalse);

export function sendMessage(ctx: ProcedureContext, message: string, argCount: number) {
  invariant(argCount <= ctx.stackSize - 1, `Argument count mismatch when sending message '${message}': expected ${argCount}, got ${ctx.stackSize - 1}.`);
  const args: CompiledInstructionArg[] = [];
  for (let i = 0; i < argCount; i++) {
    args.unshift(ctx.pop()!);
  }
  const receiver = ctx.pop();
  ctx.machine.invokeMethod(receiver, message, args);
}
autoRegisterInstruction(sendMessage);

export function invokeProcedure(ctx: ProcedureContext) {
  const procedure = ctx.pop();
  ctx.machine.invokeProcedure(procedure);
}
autoRegisterInstruction(invokeProcedure);

export function halt(ctx: ProcedureContext) {
  ctx.machine.halt();
}
autoRegisterInstruction(halt);

/** Number instructions **/
export function greaterThan(ctx: ProcedureContext) {
  const a = ctx.pop();
  const b = ctx.pop();
  ctx.push(a > b);
}
autoRegisterInstruction(greaterThan);

export function lessThan(ctx: ProcedureContext) {
  const a = ctx.pop();
  const b = ctx.pop();
  ctx.push(a < b);
}
autoRegisterInstruction(lessThan);

export function add(ctx: ProcedureContext) {
  const a = ctx.pop();
  const b = ctx.pop();
  ctx.push(a + b);
}
autoRegisterInstruction(add);

/** Boolean instructions **/
export function and(ctx: ProcedureContext) {
  const a = ctx.pop();
  const b = ctx.pop();
  ctx.push(a && b);
}
autoRegisterInstruction(and);

/** JS Object instructions **/
export function getJsObjectPropertyForLiteral(ctx: ProcedureContext, key: string | number) {
  const obj = ctx.pop();
  ctx.push(obj[key]);
}
autoRegisterInstruction(getJsObjectPropertyForLiteral);

export function getJsObjectProperty(ctx: ProcedureContext) {
  const obj = ctx.pop();
  const key = ctx.pop();
  ctx.push(obj[key]);
}
autoRegisterInstruction(getJsObjectProperty);

