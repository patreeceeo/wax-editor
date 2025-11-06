import {CompiledProcedure} from "./compiled_procedure";

interface WaxClassInit {
  methods?: {[key: string]: CompiledProcedure};
}

export class WaxClass {
  static forJsObject(value: any): WaxClass | undefined {
    if (value === true) {
      return trueClass;
    }
    if (value === false) {
      return falseClass;
    }
    if(typeof value === "number") {
      return numberClass;
    }
  }

  private _methods: {[key: string]: CompiledProcedure};
  constructor({methods = {}}: WaxClassInit = {}) {
    this._methods = methods;
  }

  lookupMethod(name: string): CompiledProcedure | undefined {
    return this._methods[name];
  }

  defineMethod(name: string, procedure: CompiledProcedure) {
    this._methods[name] = procedure;
    return this;
  }
}

export const trueClass: WaxClass = new WaxClass();

export const falseClass: WaxClass = new WaxClass();

export const numberClass: WaxClass = new WaxClass();
