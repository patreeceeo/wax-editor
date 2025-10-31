import {PersistentObject} from './persistent_object';
import {test, expect} from 'vitest';

test("only copies changed parts of object", () => {
  const original = new class extends PersistentObject {
    a = {
      b: {
        c: 1,
        d: 2
      },
      e: 3
    }
    f = {
      g: 4
    }
  }

  const modified = original.produce(draft => {
    draft.a.b.c = 10; // Change a nested property
  });

  // Check that the modified object has the updated value
  expect(modified.a.b.c).toBe(10);
  expect(modified.a.b).not.toBe(original.a.b); // a.b should be a new object

  // Check that unchanged parts are the same reference
  expect(modified.a.b.d).toBe(2);
  expect(modified.f).toBe(original.f); // a.f should be the same object
});

test("circular references are handled correctly", () => {
  const original = new class extends PersistentObject {
    a = {
      b: 1,
      self: null as any
    }
    constructor() {
      super();
      // Create a circular reference
      this.a.self = this.a;
    }
  }

  const modified = original.produce(draft => {
    draft.a.b = 10; // Change a property
  });

  // Check that the modified object has the updated value
  expect(modified.a.b).toBe(10);
  expect(modified.a).not.toBe(original.a); // a should be a new object

  // Check that the circular reference is preserved
  expect(modified.a.self).toBe(original.a);
});

test("getters/setters", () => {
  const original = new class extends PersistentObject {
    _a = 1
    get a() {
      return this._a;
    }
    get b() {
      return this._a + 1;
    }
    set a(value: number) {
      this._a = value;
    }
  };

  const modified = original.produce(draft => {
    draft.a = 10; // Use the setter
  });

  expect(modified.b).toBe(11); // b should reflect the updated _a value

  // Attempting to modify b should result in a TypeScript error
  expect(() => {
    // @ts-expect-error
    modified.b = 20;
  }).toThrowError();

  expect(original.b).toBe(2); // Original remains unchanged
});

test("retains instance types", () => {
  class MyClass extends PersistentObject {
    value: number;
    constructor(value: number) {
      super();
      this.value = value;
    }
    increment() {
      this.value += 1;
    }
  }

  const original = new MyClass(1);

  const modified = original.produce(draft => {
    draft.increment(); // Call a method to modify state
  });

  expect(modified).toBeInstanceOf(MyClass);
  expect(modified.increment).toBe(MyClass.prototype.increment);
});

test("afterProduce hook is called", () => {
  let hookCalled = false;

  class MyPersistentObject extends PersistentObject {
    afterProduce() {
      hookCalled = true;
    }
    a = 1;
  }

  const original = new MyPersistentObject();

  original.produce(draft => {
    draft.a = 2;
  });

  expect(hookCalled).toBe(true);
});
