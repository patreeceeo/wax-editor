import type {CompiledInstructionArg} from "./compiled_procedure";

interface VariableInit {
  id: number;
  value: CompiledInstructionArg;
}

export class Variable {
  readonly id: number;
  private _value: CompiledInstructionArg;

  constructor({id, value}: VariableInit) {
    this.id = id;
    this._value = value;
  }

  get value() {
    return this._value;
  }

  set value(newValue: CompiledInstructionArg) {
    this._value = newValue;
  }
}
