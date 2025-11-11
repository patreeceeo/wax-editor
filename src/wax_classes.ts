import {CompiledProcedure} from "./compiled_procedure";
import {thunkComponent} from "./components/helpers";
import ProgramViewer from "./components/ProgramViewer";
import {TreeViewEntries} from "./components/TreeView";
import { thunkValueObject } from "./components/ValueObject";

interface WaxClassInit {
  methods?: {[key: string]: CompiledProcedure};
}

export class WaxClass {
  displayName = "Unknown";
  static isValueClass(waxClass: WaxClass): boolean {
    return waxClass === nilClass ||
      waxClass === trueClass ||
      waxClass === falseClass ||
      waxClass === numberClass ||
      waxClass === stringClass ||
      waxClass === jsFunctionClass;
  }
  static forJsObject(value: any): WaxClass {
    if (value === true) {
      return trueClass;
    }
    if (value === false) {
      return falseClass;
    }
    if(value === null || value === undefined) {
      return nilClass;
    }
    switch(typeof value) {
      case "string":
        return stringClass;
      case "function":
        return jsFunctionClass;
      case "symbol":
        return symbolClass;
      case "number":
        return numberClass;
      case "object":
        if(CompiledProcedure.isInstance(value)) {
          return procedureClass;
        }
        if(Array.isArray(value)) {
          return arrayClass;
        }
    }
    return jsObjectClass;
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

  renderReact = thunkValueObject(((value: any) => {
    return {value: String(value), color: "gray" };
  }));
}


export const nilClass = new class extends WaxClass {
  displayName = "Nil";
  renderReact = thunkValueObject((() => {
    return {value: "nil", color: "pink" };
  }))
}

export const trueClass = new class extends WaxClass {
  displayName = "True";
  renderReact = thunkValueObject((() => {
    return {value: "true", color: "green" };
  }))
}

export const falseClass = new class extends WaxClass {
  displayName = "False";
  renderReact = thunkValueObject((() => {
    return {value: "false", color: "red" };
  }))
}

export const numberClass = new class extends WaxClass {
  displayName = "Number";
  renderReact = thunkValueObject((jsValue: number) => {
    return {value: String(jsValue), color: "blue" };
  })
}

export const procedureClass = new class extends WaxClass {
  displayName = "Procedure";
  renderReact = thunkComponent("value", ProgramViewer)
}

export const jsObjectClass = new class extends WaxClass {
  displayName = "JsObject";
  renderReact = thunkComponent("value", TreeViewEntries)
}

export const arrayClass = new class extends WaxClass {
  displayName = "Array";
  renderReact = thunkComponent("value", TreeViewEntries)
}

export const stringClass = new class extends WaxClass {
  displayName = "String";
  renderReact = thunkValueObject((jsValue: string) => {
    return {value: `“${jsValue}”`, color: "yellow" };
  })
}

export const symbolClass = new WaxClass();

export const jsFunctionClass = new class extends WaxClass {
  displayName = "JsFunction";
  renderReact = thunkValueObject((jsValue: Function) => {
    const name = jsValue.name || "(anonymous)";
    return {value: `function ${name}()`, color: "purple" };
  })
}


