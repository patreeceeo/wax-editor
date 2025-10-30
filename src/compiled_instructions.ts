import {ProcedureContext, type CompiledInstructionArg} from "./compiled_procedure";

export function literal(ctx: ProcedureContext, obj: CompiledInstructionArg) {
  ctx.push(obj);
}
export function getProperty(ctx: ProcedureContext) {
  const property = ctx.pop();
  const object = ctx.pop();
  ctx.push(object[property]);
}
export function getPropertyAtLiteral(ctx: ProcedureContext, key: string | number) {
  const obj = ctx.pop();
  ctx.push(obj[key]);
}
export function setVariable(ctx: ProcedureContext, name: string) {
  ctx.set(name, ctx.pop());
}
export function setVariableToLiteral(ctx: ProcedureContext, name: string, value: CompiledInstructionArg) {
  ctx.set(name, value);
}
export function getVariable(ctx: ProcedureContext, name: string) {
  ctx.push(ctx.get(name));
}
export function greaterThan(ctx: ProcedureContext) {
  const b = ctx.pop();
  const a = ctx.pop();
  ctx.push(a > b);
}
export function jumpIfTrue(ctx: ProcedureContext, pc: number) {
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

