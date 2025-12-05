import type { JSX } from "react/jsx-runtime";
import { CompiledProcedure } from "./compiled_procedure";
import { invariant } from "./error";
import { getObjectId } from "./utils";
import { okIfDefined, Result } from "./result";

interface WaxClassInit {
  methods?: { [key: string]: CompiledProcedure };
}

export class WaxClass<T> {
  static isValueClass(waxClass: WaxClass<any>): boolean {
    return (
      waxClass === nilClass ||
      waxClass === trueClass ||
      waxClass === falseClass ||
      waxClass === numberClass ||
      waxClass === stringClass
    );
  }
  static forJsObject(value: any): WaxClass<any> {
    if (value === true) {
      return trueClass;
    }
    if (value === false) {
      return falseClass;
    }
    if (value === null || value === undefined) {
      return nilClass;
    }
    switch (typeof value) {
      case "string":
        return stringClass;
      case "symbol":
        return symbolClass;
      case "number":
        return numberClass;
      case "object":
        if (CompiledProcedure.isInstance(value)) {
          return procedureClass;
        }
        if (Array.isArray(value)) {
          return arrayClass;
        }
        if (value.constructor === undefined) {
          return objectClass;
        }
    }
    return WaxClass.getJsWrapper(value);
  }

  private static _wrappersByConstructor = new Map<Function, WaxClass<any>>();
  static getJsWrapper(value: any): WaxClass<any> {
    const constructor = value.constructor;
    invariant(
      constructor !== undefined,
      "Cannot get JS wrapper for object with no constructor.",
    );
    let wrapper = this._wrappersByConstructor.get(constructor);
    if (wrapper === undefined) {
      wrapper = new WaxClass();
      wrapper.displayName = `Js::${constructor.name}`;
      this._wrappersByConstructor.set(constructor, wrapper);
    }
    return wrapper;
  }

  private _methods: { [key: string]: CompiledProcedure };
  constructor({ methods = {} }: WaxClassInit = {}) {
    this._methods = methods;
  }

  lookupMethod(name: string): Result<CompiledProcedure, string> {
    return okIfDefined(
      this._methods[name],
      `Method '${name}' not found on ${this.displayName}.`,
    );
  }

  defineMethod(name: string, procedure: CompiledProcedure) {
    this._methods[name] = procedure;
    return this;
  }

  displayName = "Unknown";
  displayColor = "var(--color-blue-600)";

  stringify(value: T): string {
    return `${this.displayName}#${getObjectId(value)}`;
  }

  renderReact(value: any) {
    const className = `inline-flex font-bold whitespace-pre`;
    return (
      <span className={className} style={{ color: this.displayColor }}>
        {this.stringify(value)}
      </span>
    );
  }
}

/**
 * TODO avoid billion-dollar mistakes https://en.wikipedia.org/wiki/Null_pointer#History
 */
export const nilClass = new (class extends WaxClass<undefined> {
  displayName = "Nil";
  displayColor = "var(--color-pink-600)";
  stringify() {
    return "nil";
  }
})();

export const trueClass = new (class extends WaxClass<true> {
  displayName = "True";
  displayColor = "var(--color-green-600)";
  stringify() {
    return "true";
  }
})();

export const falseClass = new (class extends WaxClass<false> {
  displayName = "False";
  displayColor = "var(--color-red-600)";
  stringify() {
    return "false";
  }
})();

export const numberClass = new (class extends WaxClass<number> {
  displayName = "Number";
  displayColor = "var(--color-yellow-600)";
  stringify(value: number) {
    return value.toString();
  }
})();

export const procedureClass = new (class extends WaxClass<CompiledProcedure> {
  displayName = "Procedure";
  displayColor = "var(--color-purple-600)";
  stringify(value: CompiledProcedure) {
    return `⁋ ${value.id.toString()}`;
  }
})();

export const objectClass = new (class extends WaxClass<Record<string, any>> {
  displayName = "Object";
  displayColor = "var(--color-blue-600)";
  stringify(value: Record<string, any>) {
    return `Object #${getObjectId(value)}`;
  }
})();

export const arrayClass = new (class extends WaxClass<any[]> {
  displayName = "Array";
  displayColor = "var(--color-teal-600)";
  stringify(value: any[]) {
    const items = value.map((subValue) => {
      const waxClass = WaxClass.forJsObject(subValue);
      return WaxClass.isValueClass(waxClass)
        ? waxClass.stringify(subValue)
        : `_`;
    });
    return `[${items.join(", ")}]`;
  }
  renderReact(value: any[]): JSX.Element {
    const className = `inline-flex font-bold whitespace-pre`;
    return (
      <span className={className} style={{ color: this.displayColor }}>
        [
        {value.map((subValue, index) => {
          const waxClass = WaxClass.forJsObject(subValue);
          return (
            <span key={getObjectId(subValue)}>
              {waxClass.renderReact(subValue)}
              {index < value.length - 1 ? ", " : ""}
            </span>
          );
        })}
        ]
      </span>
    );
  }
})();

export const stringClass = new (class extends WaxClass<string> {
  displayName = "String";
  displayColor = "var(--color-orange-600)";
  stringify(jsValue: string) {
    return `“${jsValue}”`;
  }
})();

export const symbolClass = new WaxClass();
