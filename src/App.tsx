import { useMemo } from "react";
import "./App.css";
import { Machine } from "./machine";
import Debugger from "./components/Debugger";
import { Compiler } from "./compiler";
import { findMaxInArrayExample } from "./examples/findMaxInArray";
import { Editor } from "./components/Editor";

function createInitialMachine(): Machine {
  const machine = new Machine();
  const compiler = new Compiler({ machine });
  compiler.compile(findMaxInArrayExample);
  machine.start();
  return machine;
}

function App() {
  const machine = useMemo(() => createInitialMachine(), []);

  return (
    <div className="p-4 space-y-4" style={{ width: "100vw" }}>
      <h1>My lil' Virtual Machine</h1>
      <Editor />
      <Debugger machine={machine} />
    </div>
  );
}

export default App;
