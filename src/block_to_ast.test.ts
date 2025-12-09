import { describe, it, expect } from "vitest";
import { generateASTFromBlock, generateASTFromBlocks } from "./block_to_ast";
import type { Block } from "./block_to_ast";
import type { CompiledInstructionArg } from "./compiled_procedure";

// Test helper functions to reduce repetition
const createLiteralBlock = (
  id: string,
  value: CompiledInstructionArg,
): Block => ({
  id,
  type: "literal",
  data: { value },
});

const createVariableBlock = (id: string, name: string): Block => ({
  id,
  type: "variable",
  data: { name },
});

const createAssignmentBlock = (id: string, variableName: string): Block => ({
  id,
  type: "assignment",
  data: { variableName },
});

describe("Block to AST conversion", () => {
  describe("Basic Block Types", () => {
    it("should convert literal block to JsLiteralNode", () => {
      const result = generateASTFromBlock(createLiteralBlock("literal-1", 42));

      expect(result.isOk()).toBe(true);
      const astNode = result.unwrap();
      expect(astNode).toHaveProperty("value", 42);
      expect(astNode.getSteps()).toHaveLength(1);
    });

    it("should convert variable block to GetVariableNode", () => {
      const result = generateASTFromBlock(createVariableBlock("var-1", "x"));

      expect(result.isOk()).toBe(true);
      const astNode = result.unwrap();
      expect(astNode).toHaveProperty("name", "x");
      expect(astNode.getSteps()).toHaveLength(1);
    });

    it("should convert assignment block to AssignmentStatementNode", () => {
      const result = generateASTFromBlock(
        createAssignmentBlock("assign-1", "result"),
      );

      expect(result.isOk()).toBe(true);
      const astNode = result.unwrap();
      expect(astNode).toHaveProperty("variableName", "result");
      expect(astNode.getSteps()).toHaveLength(2);
    });
  });

  describe("Multiple Blocks", () => {
    it("should generate ProgramNode from block array", () => {
      const blocks: Block[] = [
        createLiteralBlock("literal-1", 10),
        createAssignmentBlock("assign-1", "x"),
        createVariableBlock("var-1", "x"),
      ];

      const result = generateASTFromBlocks(blocks);
      expect(result.isOk()).toBe(true);

      const program = result.unwrap();
      expect(program.body).toHaveLength(3);
    });
  });

  describe("Validation", () => {
    it("should reject empty assignment names", () => {
      const result = generateASTFromBlock(
        createAssignmentBlock("assign-bad", ""),
      );

      expect(result.isFail()).toBe(true);
      expect(result.unwrapErr()).toEqual({
        type: "empty_name",
        blockId: "assign-bad",
        blockType: "assignment",
      });
    });

    it("should reject empty variable names", () => {
      const result = generateASTFromBlock(createVariableBlock("var-bad", ""));

      expect(result.isFail()).toBe(true);
      expect(result.unwrapErr()).toEqual({
        type: "empty_name",
        blockId: "var-bad",
        blockType: "variable",
      });
    });

    it("should collect multiple validation errors", () => {
      const blocks: Block[] = [
        createLiteralBlock("literal-1", 42),
        createAssignmentBlock("assign-bad", ""),
        createVariableBlock("var-bad", ""),
      ];

      const result = generateASTFromBlocks(blocks);
      expect(result.isFail()).toBe(true);

      const errors = result.unwrapErr();
      expect(errors).toHaveLength(2);
      expect(errors).toContainEqual({
        type: "empty_name",
        blockId: "assign-bad",
        blockType: "assignment",
      });
      expect(errors).toContainEqual({
        type: "empty_name",
        blockId: "var-bad",
        blockType: "variable",
      });
    });

    it("should reject unknown block types", () => {
      const unknownBlock = {
        id: "unknown-1",
        type: "unknown",
        data: {},
      } as any;

      const result = generateASTFromBlock(unknownBlock);
      expect(result.isFail()).toBe(true);
      expect(result.unwrapErr()).toEqual({
        type: "unknown_type",
        blockType: "unknown",
      });
    });

    it("should accept all valid block types", () => {
      const validBlocks: Block[] = [
        createLiteralBlock("literal-1", 42),
        createVariableBlock("var-1", "myVar"),
        createAssignmentBlock("assign-1", "result"),
      ];

      const result = generateASTFromBlocks(validBlocks);
      expect(result.isOk()).toBe(true);
    });
  });
});
