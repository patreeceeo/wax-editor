import { describe, test } from "vitest";
import { render } from "@testing-library/react";
import { GraphView } from "./GraphView";

describe("GraphView", () => {
  test("renders without crashing", () => {
    const testData = {
      name: "test",
      value: 42,
      nested: {
        prop: "hello"
      }
    };

    render(<GraphView value={testData} />);
  });

  test("handles primitive values", () => {
    render(<GraphView value="simple string" />);
    render(<GraphView value={123} />);
    render(<GraphView value={true} />);
  });

  test("handles arrays", () => {
    const testArray = [1, 2, 3, { nested: "value" }];
    render(<GraphView value={testArray} />);
  });

  test("handles circular references", () => {
    const obj: any = { name: "test" };
    obj.self = obj; // Create circular reference
    render(<GraphView value={obj} />);
  });

  test("handles null and undefined", () => {
    render(<GraphView value={null} />);
    render(<GraphView value={undefined} />);
  });

  test("renders with default dimensions", () => {
    const testData = { width: 100, height: 200 };
    render(<GraphView value={testData} />);
  });
});