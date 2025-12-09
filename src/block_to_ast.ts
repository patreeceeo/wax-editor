import {
  JsLiteralNode,
  AssignmentStatementNode,
  GetVariableNode,
  ProgramNode,
  ExpressionStatementNode,
  AstNode,
} from "./abstract_syntax_tree";
import { ok, fail, type Result } from "./result";

export type BlockType = "literal" | "variable" | "assignment";

export type BlockValidationError =
  | { type: "empty_variable_name"; blockId: string }
  | { type: "empty_assignment_name"; blockId: string }
  | { type: "unknown_block_type"; blockType: string };

export interface BaseBlock {
  id: string;
}

export interface LiteralBlock extends BaseBlock {
  type: "literal";
  data: {
    value: unknown;
  };
}

export interface VariableBlock extends BaseBlock {
  type: "variable";
  data: {
    name: string;
  };
}

export interface AssignmentBlock extends BaseBlock {
  type: "assignment";
  data: {
    variableName: string;
  };
}

export type Block = LiteralBlock | VariableBlock | AssignmentBlock;

export function generateASTFromBlock(
  block: Block,
): Result<AstNode, BlockValidationError> {
  switch (block.type) {
    case "literal":
      return ok(new JsLiteralNode({ value: block.data.value }));

    case "variable":
      if (block.data.name.trim() === "") {
        return fail({
          type: "empty_variable_name",
          blockId: block.id,
        });
      }
      return ok(new GetVariableNode({ name: block.data.name }));

    case "assignment":
      if (block.data.variableName.trim() === "") {
        return fail({
          type: "empty_assignment_name",
          blockId: block.id,
        });
      }

      // For Phase 1 MVP, assignments will just assign a literal value of 0
      // In Phase 2, we'll support proper expression nesting
      const valueExpression = new JsLiteralNode({ value: 0 });
      return ok(
        new AssignmentStatementNode({
          variableName: block.data.variableName,
          valueExpression,
        }),
      );

    default:
      return fail({
        type: "unknown_block_type",
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
        // Wrap expressions in ExpressionStatementNode for the program body
        // Use block type instead of instanceof to determine what kind of AST node we have
        if (block.type === "literal" || block.type === "variable") {
          statements.push(new ExpressionStatementNode({ value: astNode }));
        } else {
          // Assignment statements are already statement nodes
          statements.push(astNode as AssignmentStatementNode);
        }
      },
      fail: (error) => {
        errors.push(error);
      },
    });
  }

  if (errors.length > 0) {
    return fail(errors);
  }

  return ok(new ProgramNode({ body: statements }));
}
