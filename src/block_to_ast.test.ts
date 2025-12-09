import { describe, it, expect } from "vitest";
import { generateASTFromBlock, generateASTFromBlocks } from "./block_to_ast";
import type {
  Block,
  LiteralBlock,
  VariableBlock,
  AssignmentBlock,
} from "./block_to_ast";

describe("Block to AST conversion", () => {
  describe("with Basic Block Types", () => {
    it("should create a literal block that generates JsLiteralNode", () => {
      const literalBlock: LiteralBlock = {
        id: "literal-1",
        type: "literal",
        data: { value: 42 },
      };

      const result = generateASTFromBlock(literalBlock);
      expect(result.isOk()).toBe(true);

      const astNode = result.unwrap();
      expect(astNode).toHaveProperty("value", 42);
      expect(astNode.getSteps()).toHaveLength(1);
    });

    it("should create a variable block that generates GetVariableNode", () => {
      const variableBlock: VariableBlock = {
        id: "var-1",
        type: "variable",
        data: { name: "x" },
      };

      const result = generateASTFromBlock(variableBlock);
      expect(result.isOk()).toBe(true);

      const astNode = result.unwrap();
      expect(astNode).toHaveProperty("name", "x");
      expect(astNode.getSteps()).toHaveLength(1);
    });

    it("should create an assignment block that generates AssignmentStatementNode", () => {
      const assignmentBlock: AssignmentBlock = {
        id: "assign-1",
        type: "assignment",
        data: { variableName: "result" },
      };

      const result = generateASTFromBlock(assignmentBlock);
      expect(result.isOk()).toBe(true);

      const astNode = result.unwrap();
      expect(astNode).toHaveProperty("variableName", "result");
      expect(astNode.getSteps()).toHaveLength(2); // literal + assignment
    });
  });

  describe("with Multiple Blocks", () => {
    it("should generate a ProgramNode from an array of blocks", () => {
      const blocks: Block[] = [
        {
          id: "literal-1",
          type: "literal",
          data: { value: 10 },
        },
        {
          id: "assign-1",
          type: "assignment",
          data: { variableName: "x" },
        },
        {
          id: "var-1",
          type: "variable",
          data: { name: "x" },
        },
      ];

      const result = generateASTFromBlocks(blocks);
      expect(result.isOk()).toBe(true);

      const program = result.unwrap();
      expect(program).toHaveProperty("body");
      expect(program.body).toHaveLength(3);
    });
  });

  describe("Block Validation", () => {
    it("should return Fail result for empty assignment variable names", () => {
      const assignmentBlock: AssignmentBlock = {
        id: "assign-bad",
        type: "assignment",
        data: { variableName: "" },
      };

      const result = generateASTFromBlock(assignmentBlock);
      expect(result.isFail()).toBe(true);

      const error = result.unwrapErr();
      expect(error).toEqual({
        type: "empty_assignment_name",
        blockId: "assign-bad",
      });
    });

    it("should return Fail result for empty variable names", () => {
      const variableBlock: VariableBlock = {
        id: "var-bad",
        type: "variable",
        data: { name: "" },
      };

      const result = generateASTFromBlock(variableBlock);
      expect(result.isFail()).toBe(true);

      const error = result.unwrapErr();
      expect(error).toEqual({
        type: "empty_variable_name",
        blockId: "var-bad",
      });
    });

    it("should collect all validation errors in generateASTFromBlocks", () => {
      const blocks: Block[] = [
        {
          id: "literal-1",
          type: "literal",
          data: { value: 42 },
        },
        {
          id: "assign-bad",
          type: "assignment",
          data: { variableName: "" },
        },
        {
          id: "var-bad",
          type: "variable",
          data: { name: "" },
        },
      ];

      const result = generateASTFromBlocks(blocks);
      expect(result.isFail()).toBe(true);

      const errors = result.unwrapErr();
      expect(errors).toHaveLength(2);
      expect(errors).toContainEqual({
        type: "empty_assignment_name",
        blockId: "assign-bad",
      });
      expect(errors).toContainEqual({
        type: "empty_variable_name",
        blockId: "var-bad",
      });
    });

    it("should return Fail result for unknown block types", () => {
      // Create a mock block with unknown type
      const unknownBlock = {
        id: "unknown-1",
        type: "unknown" as any,
        data: {},
      };

      const result = generateASTFromBlock(unknownBlock as any);
      expect(result.isFail()).toBe(true);

      const error = result.unwrapErr();
      expect(error).toEqual({
        type: "unknown_block_type",
        blockType: "unknown",
      });
    });

    it("should accept properly structured blocks", () => {
      const validBlocks: Block[] = [
        {
          id: "literal-1",
          type: "literal",
          data: { value: 42 },
        },
        {
          id: "var-1",
          type: "variable",
          data: { name: "myVar" },
        },
        {
          id: "assign-1",
          type: "assignment",
          data: { variableName: "result" },
        },
      ];

      const result = generateASTFromBlocks(validBlocks);
      expect(result.isOk()).toBe(true);
    });
  });
});
