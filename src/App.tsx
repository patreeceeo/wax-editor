import { useMemo } from "react";
import "./App.css";
import { Machine } from "./machine";
import Debugger from "./components/Debugger";
import { Compiler } from "./compiler";
import {
  AssignmentStatementNode,
  ExpressionStatementNode,
  FunctionExpressionNode,
  GetVariableNode,
  JsLiteralNode,
  ProgramNode,
  SendMessageExpressionNode,
} from "./abstract_syntax_tree";

const isIndexLessThanArrayLengthAst = new FunctionExpressionNode({
  params: [],
  body: [
    new ExpressionStatementNode({
      value: new SendMessageExpressionNode({
        receiver: new GetVariableNode({ name: "i" }),
        message: "<",
        args: [
          new SendMessageExpressionNode({
            receiver: new GetVariableNode({ name: "array" }),
            message: "length",
            args: [],
          }),
        ],
      }),
      isReturn: true,
    }),
  ],
});

const getCurrentElementAst = new SendMessageExpressionNode({
  receiver: new GetVariableNode({ name: "array" }),
  message: "at:",
  args: [new GetVariableNode({ name: "i" })],
});

const isCurrentGreaterThanMaxAst = new SendMessageExpressionNode({
  receiver: getCurrentElementAst,
  message: ">",
  args: [new GetVariableNode({ name: "max" })],
});

const maybeUpdateMaxAst = new SendMessageExpressionNode({
  receiver: isCurrentGreaterThanMaxAst,
  message: "ifTrue",
  args: [
    new FunctionExpressionNode({
      params: [],
      body: [
        new AssignmentStatementNode({
          variableName: "max",
          valueExpression: getCurrentElementAst,
        }),
      ],
    }),
  ],
});

const incrementIndexAst = new AssignmentStatementNode({
  variableName: "i",
  valueExpression: new SendMessageExpressionNode({
    receiver: new GetVariableNode({ name: "i" }),
    message: "+",
    args: [new JsLiteralNode({ value: 1 })],
  }),
});

const findMaxProgramAst = new ProgramNode({
  body: [
    new AssignmentStatementNode({
      variableName: "array",
      valueExpression: new JsLiteralNode({
        value: [3, 1, 4, 1, 5, 9, 2, 6, 5],
      }),
    }),
    new AssignmentStatementNode({
      variableName: "max",
      valueExpression: new JsLiteralNode({ value: 0 }),
    }),
    new AssignmentStatementNode({
      variableName: "i",
      valueExpression: new JsLiteralNode({ value: 0 }),
    }),
    new SendMessageExpressionNode({
      receiver: isIndexLessThanArrayLengthAst,
      message: "whileTrue",
      args: [
        new FunctionExpressionNode({
          params: [],
          body: [maybeUpdateMaxAst, incrementIndexAst],
        }),
      ],
    }),
  ],
});

function createInitialMachine(): Machine {
  const machine = new Machine();
  const compiler = new Compiler({ machine });
  compiler.compile(findMaxProgramAst);
  machine.start();
  return machine;
}

function App() {
  const machine = useMemo(() => createInitialMachine(), []);

  return (
    <div className="p-4 space-y-4" style={{ width: "100vw" }}>
      <h1>My lil' Virtual Machine</h1>
      <Debugger machine={machine} />
    </div>
  );
}

export default App;
