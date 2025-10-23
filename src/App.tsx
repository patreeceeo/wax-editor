import {useState} from 'react';
import './App.css'
import {exampleProgram, nextInstruction, ScriptingContext, stepProgram} from './engine';
import {produce} from "immer";

const ProgramViewer = ({program, pc}: {program: typeof exampleProgram, pc: number}) => {
  return (
    <pre className="program-viewer">
      {program.map((instruction, index) => (
        <div key={index} className={index === pc ? 'bg-red-400 text-black' : ''}>
          {instruction.op.name} {instruction.args.length > 0 ? JSON.stringify(instruction.args) : ''}
        </div>
      ))}
    </pre>
  )
}

// Button looks 3D, press animation and hover effect
const Button = ({onClick, disabled, size, primary, children}: {onClick: () => void, disabled?: boolean, primary?: boolean, size?: "xl" | "l" | "m" | "s", children: React.ReactNode}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        cursor-pointer
        ${primary ? "bg-blue-500" : "bg-gray-500"}
        text-white
        font-bold
        ${size === "xl" ? "px-8 py-4" : size === "l" ? "px-6 py-3" : size === "m" ? "px-4 py-2" : size === "s" ? "px-2 py-1" : "px-4 py-2"}
        rounded
        shadow-lg
        ${`hover:${primary ? "bg-blue-600" : "bg-gray-600"}`}
        active:translate-y-1
        active:shadow-md
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${size === "xl" ? "text-2xl" : size === "l" ? "text-xl" : size === "m" ? "text-lg" : size === "s" ? "text-sm" : "text-base"}
      `}
    >
      {children}
    </button>
  )
}

function App() {

  const [ctx, setCtx] = useState(new ScriptingContext());
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="p-4 space-y-4">
      <div className="space-x-4">
        <Button primary size="xl" onClick={() => {
          const instruction = nextInstruction(ctx, exampleProgram);
          if(instruction) {
            const newCtx = produce(ctx, draft => {
              stepProgram(draft, instruction);
            })
            setCtx(newCtx);
          } else {
            setEnabled(false);
          }
        }} disabled={!enabled}>
          Step
        </Button>
        <Button size="xl" onClick={() => {
          setCtx(new ScriptingContext());
          setEnabled(true);
        }}>Reset</Button>
      </div>
      <div className="flex space-x-4">
        <div>
          <h2>Program</h2>
          <ProgramViewer program={exampleProgram} pc={ctx.pc} />
        </div>
        <div>
          <h2>Context</h2>
          <pre>
            {JSON.stringify(ctx, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default App
