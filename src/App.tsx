import {useCallback, useState} from 'react';
import './App.css'
import {exampleProgram, nextInstruction, ScriptingContext, stepProgram} from './engine';
import {produce} from "immer";
import ContextDiff from './components/ContextDiff';

const ProgramViewer = ({program, pc}: {program: typeof exampleProgram, pc: number}) => {
  return (
    <pre className="program-viewer px-0">
      {program.map((instruction, index) => (
        <div key={index} className={`px-3 ${index === pc ? 'bg-yellow-400 text-black font-bold' : ''}`}>
          {instruction.op.name} {instruction.args.length > 0 ? JSON.stringify(instruction.args[0]) : ''}
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
  const [ctxs, setCtxs] = useState([new ScriptingContext()]);
  const [isMore, setMore] = useState(true);
  const [ctxIdx, setCtxIdx] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const ctx = ctxs[ctxIdx];
  const previousCtx = ctxIdx < ctxs.length - 1 ? ctxs[ctxIdx + 1] : undefined;

  const pushCtx = useCallback((newCtx: ScriptingContext) => {
    setCtxs([newCtx, ...ctxs]);
  }, [setCtxs, ctxs]);

  const clickPrev = useCallback(() => {
    setCtxIdx(ctxIdx + 1);
  }, [ctxIdx, setCtxIdx, ctxs]);

  const clickReset = useCallback(() => {
    setCtxs([new ScriptingContext()]);
    setMore(true);
  }, [setCtxs, setMore]);

  const clickNext = useCallback(() => {
    if(ctxIdx > 0) {
      setCtxIdx(ctxIdx - 1);
    } else {
      const instruction = nextInstruction(ctx, exampleProgram);
      if(instruction) {
        const newCtx = produce(ctx, draft => {
          stepProgram(draft, instruction);
        })
        pushCtx(newCtx);
        setStepCount(stepCount + 1);
      } else {
        setMore(false);
      }
    }
  }, [ctxs, setMore, ctxIdx, setCtxIdx, ctx, pushCtx]);

  return (
    <div className="p-4 space-y-4">
      <div className="space-x-4">
        <Button size="xl" onClick={clickPrev} disabled={ctxIdx === ctxs.length - 1}>
          &lt;
        </Button>
        <Button size="xl" onClick={clickReset}>Reset</Button>
        <Button primary size="xl" onClick={clickNext} disabled={!isMore}>
          &gt;
        </Button>
      </div>
      <div className="flex space-x-4">
        <div>
          <h2>VM Codes</h2>
          <ProgramViewer program={exampleProgram} pc={ctx.pc} />
        </div>
        <div className="flex-1 space-y-4">
          <h2>Variables</h2>
          <ContextDiff
            propertyName="variables"
            currentContext={ctx}
            previousContext={previousCtx}
          />
        </div>
        <div className="flex-1 space-y-4">
          <h2>Stack</h2>
          <ContextDiff
            propertyName="stack"
            currentContext={ctx}
            previousContext={previousCtx}
          />
        </div>
      </div>
      <h3>Step Count: {stepCount}</h3>
    </div>
  )
}

export default App
