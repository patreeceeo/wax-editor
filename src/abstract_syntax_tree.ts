import {assignmentStatement, literal, returnStatement, type CompilerStep, enterProecedure, exitProcedure, getVariable, sendMessage, Compiler, halt} from "./compiler";

export abstract class AstNode {
  /** Get a discrete list of compiler steps to compile this AST node **/
  abstract getSteps(): CompilerStep[];
}

// TODO merge with FunctionExpressionNode?
interface ProgramNodeInit {
  body: StatementNode[];
}
export class ProgramNode extends AstNode {
  body: StatementNode[];

  constructor({body}: ProgramNodeInit) {
    super();
    this.body = body;
  }

  getSteps(): CompilerStep[] {
    let steps: CompilerStep[] = [];
    for(const node of this.body) {
      steps = steps.concat(node.getSteps());
    }
    steps.push(Compiler.plan(halt));
    return steps;
  }
}

abstract class StatementNode extends AstNode {
}

interface ExpressionStatementNodeInit {
  value: ExpressionNode;
  isReturn?: boolean;
}

export class ExpressionStatementNode extends StatementNode {
  value: ExpressionNode;
  isReturn: boolean = false;

  constructor({value, isReturn = false}: ExpressionStatementNodeInit) {
    super();
    this.value = value;
    this.isReturn = isReturn;
  }

  getSteps(): CompilerStep[] {
    const steps = [...this.value.getSteps()]
    if(this.isReturn) {
      steps.push(Compiler.plan(returnStatement));
    }
    return steps;
  }
}

interface AssignmentStatementNodeInit {
  variableName: string;
  valueExpression: ExpressionNode;
}

export class AssignmentStatementNode extends StatementNode {
  variableName: string;
  valueExpression: ExpressionNode;

  constructor({variableName, valueExpression: value}: AssignmentStatementNodeInit) {
    super();
    this.variableName = variableName;
    this.valueExpression = value;
  }

  getSteps(): CompilerStep[] {
    return [...this.valueExpression.getSteps(), Compiler.plan(assignmentStatement, this.variableName)];
  }
}

abstract class ExpressionNode extends AstNode {
}

interface JsLiteralNodeInit {
  value: any;
}

export class JsLiteralNode extends ExpressionNode {
  value: any;

  constructor({value}: JsLiteralNodeInit) {
    super();
    this.value = value;
  }

  getSteps(): CompilerStep[] {
    return [Compiler.plan(literal, this.value)];
  }
}

interface FunctionExpressionNodeInit {
  params: string[];
  body: StatementNode[];
}

export class FunctionExpressionNode extends ExpressionNode {
  params: string[] = [];
  body: StatementNode[] = [];

  constructor({params, body}: FunctionExpressionNodeInit) {
    super();
    this.params = params;
    this.body = body;
  }

  getSteps(): CompilerStep[] {
    let steps: CompilerStep[] = [Compiler.plan(enterProecedure)];
    for (const stmt of this.body) {
      steps = steps.concat(stmt.getSteps());
    }
    steps.push(Compiler.plan(exitProcedure));
    return steps;
  }
}

interface SendMessageExpressionNodeInit {
  receiver: ExpressionNode;
  message: string;
  args: ExpressionNode[];
}

export class SendMessageExpressionNode extends ExpressionNode {
  receiver: ExpressionNode;
  message: string;
  args: ExpressionNode[] = [];

  constructor({receiver, message, args}: SendMessageExpressionNodeInit) {
    super();
    this.receiver = receiver;
    this.message = message;
    this.args = args;
  }


  getSteps(): CompilerStep[] {
    let steps = this.receiver.getSteps();
    for (const arg of this.args) {
      steps = steps.concat(arg.getSteps());
    }
    steps.push(Compiler.plan(sendMessage, this.message, this.args.length));
    return steps;
  }
}

interface GetVariableNodeInit {
  name: string;
}

export class GetVariableNode extends ExpressionNode {
  name: string;

  constructor({name}: GetVariableNodeInit) {
    super();
    this.name = name;
  }

  getSteps(): CompilerStep[] {
    return [Compiler.plan(getVariable, this.name)];
  }
}
