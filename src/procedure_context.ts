import * as Structura from "structurajs";
import type {
  CompiledInstructionArg,
  CompiledProcedure,
} from "./compiled_procedure";
import { invariant } from "./error";
import type { Machine } from "./machine";
import type { Variable } from "./variable";

interface ProcedureContextInit {
  id: number;
  machine: Machine;
  procedure: CompiledProcedure;
  parentId: number;
  methodSelector?: string;
}

export class ProcedureContext {
  private _variables: { [key: string]: Variable } = Object.create(null);
  private _stack: CompiledInstructionArg[] = [];
  private _machine: Machine;
  private _returnValues: CompiledInstructionArg[] = [];

  private _procedure: CompiledProcedure;

  /**
   * The ID of the parent ProcedureContext.
   * Use ID instead of direct reference because the Machine also references ProcedureContexts via its stack, and Structura will silently create duplicate ProcedureContexts if they directly reference each other.
   */
  private _parentId: number;

  //@ts-expect-error
  private _methodSelector?: string;

  private _id: number;

  constructor({
    id,
    machine,
    procedure,
    parentId,
    methodSelector,
  }: ProcedureContextInit) {
    this._id = id;
    this._machine = machine;
    this._procedure = procedure;
    this._methodSelector = methodSelector;
    this._parentId = parentId;
  }

  get id() {
    return this._id;
  }

  get machine() {
    return this._machine;
  }

  get procedure() {
    return this._procedure;
  }

  getParentContext(): ProcedureContext | undefined {
    return this._machine.getProcedureContextById(this._parentId);
  }

  _setMachine(machine: Machine) {
    this._machine = machine;
  }

  pc: number = 0;

  push(value: CompiledInstructionArg) {
    this._stack.push(value);
  }
  pop() {
    const popped = this._stack.pop();
    return popped;
  }
  peek() {
    return this._stack[this._stack.length - 1];
  }
  get stackSize() {
    return this._stack.length;
  }

  get maxPc() {
    return Math.max(0, this._procedure.length - 1);
  }

  private _getVariableContext(variableName: string): ProcedureContext {
    let ctx: ProcedureContext | undefined = this;
    while (ctx !== undefined) {
      if (variableName in ctx._variables) {
        return ctx;
      }
      ctx = ctx.getParentContext();
    }
    return this;
  }

  hasOwn(name: string): boolean {
    return name in this._variables;
  }

  set(name: string, value: CompiledInstructionArg) {
    const variableContext = this._getVariableContext(name);
    if (!variableContext.hasOwn(name)) {
      variableContext._variables[name] = this._machine.createVariable();
    }
    variableContext._variables[name].value = value;
  }

  get(name: string): CompiledInstructionArg {
    const variableContext = this._getVariableContext(name);
    const variable = variableContext._variables[name];
    invariant(
      variable !== undefined,
      `Variable "${name}" not found in this context or any parent context.`,
    );
    return variable.value;
  }

  pushReturnValue(value: CompiledInstructionArg) {
    this._returnValues.push(value);
  }

  // Test helper method to access return values
  getReturnValues() {
    return [...this._returnValues];
  }
  acceptReturnValues(otherCtx: ProcedureContext): void {
    this._stack.push(...otherCtx._returnValues);
  }

  toJSON() {
    return {
      variables: { ...this._variables },
      stack: [...this._stack],
      pc: this.pc,
    };
  }

  // Semantic test helpers
  getStackTop(): CompiledInstructionArg | undefined {
    return this._stack[this._stack.length - 1];
  }

  hasVariable(name: string): boolean {
    return name in this._variables;
  }

  getVariableCount(): number {
    return Object.keys(this._variables).length;
  }

  getReturnCount(): number {
    return this._returnValues.length;
  }

  afterProduce(): void {
    /** Stack items are potentially dangling proxies because this context
     * may have been created during a `produce` call on the machine.
     * See https://giusepperaso.github.io/structura.js/gotchas.html#potential-dangling-proxy-references-if-you-assign-unproxied-objects-into-the-draft
     */
    this._stack = this._stack.map((item) => Structura.target(item));
  }
}
