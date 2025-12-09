import {
  JsLiteralNode,
  AssignmentStatementNode,
  GetVariableNode,
  ProgramNode,
  ExpressionStatementNode,
  AstNode,
} from "./abstract_syntax_tree";
import type { CompiledInstructionArg } from "./compiled_procedure";
import { ok, fail, type Result } from "./result";

export type BlockValidationError =
  | {
      type: "empty_name";
      blockId: string;
      blockType: "variable" | "assignment";
    }
  | { type: "unknown_type"; blockType: string };

export interface BaseBlock<T = unknown> {
  id: string;
  type: string;
  data: T;
}

export interface LiteralBlock extends BaseBlock<{
  value: CompiledInstructionArg;
}> {
  type: "literal";
}

export interface VariableBlock extends BaseBlock<{ name: string }> {
  type: "variable";
}

export interface AssignmentBlock extends BaseBlock<{ variableName: string }> {
  type: "assignment";
}

export type Block = LiteralBlock | VariableBlock | AssignmentBlock;

// Helper function for validation
const validateNonEmptyName = (
  name: string,
  blockId: string,
  blockType: "variable" | "assignment",
): Result<void, BlockValidationError> => {
  return name.trim() === ""
    ? fail({ type: "empty_name", blockId, blockType })
    : ok(undefined);
};

// Helper to determine if block type produces an expression
const isExpressionBlock = (blockType: string): boolean => {
  return blockType === "literal" || blockType === "variable";
};

export function generateASTFromBlock(
  block: Block,
): Result<AstNode, BlockValidationError> {
  switch (block.type) {
    case "literal":
      return ok(new JsLiteralNode({ value: block.data.value }));

    case "variable":
      return validateNonEmptyName(block.data.name, block.id, "variable").map(
        () => new GetVariableNode({ name: block.data.name }),
      );

    case "assignment":
      return validateNonEmptyName(
        block.data.variableName,
        block.id,
        "assignment",
      ).map(() => {
        // Phase 1 MVP: assign literal value of 0
        const valueExpression = new JsLiteralNode({ value: 0 });
        return new AssignmentStatementNode({
          variableName: block.data.variableName,
          valueExpression,
        });
      });

    default:
      return fail({
        type: "unknown_type",
        blockType: (block as any).type,
      });
  }
}

export function generateASTFromBlocks(
  blocks: Block[],
): Result<ProgramNode, BlockValidationError[]> {
  const statements: (ExpressionStatementNode | AssignmentStatementNode)[] = [];
  const errors: BlockValidationError[] = [];

  for (const block of blocks) {
    const astResult = generateASTFromBlock(block);

    astResult.match({
      ok: (astNode) => {
        // Use block type to determine what kind of AST node we have
        if (isExpressionBlock(block.type)) {
          statements.push(new ExpressionStatementNode({ value: astNode }));
        } else {
          // Assignment blocks produce AssignmentStatementNode directly
          statements.push(astNode as AssignmentStatementNode);
        }
      },
      fail: (error) => {
        errors.push(error);
      },
    });
  }

  return errors.length > 0
    ? fail(errors)
    : ok(new ProgramNode({ body: statements }));
}
