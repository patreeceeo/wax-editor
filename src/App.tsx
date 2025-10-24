import {useCallback, useState} from 'react';
import './App.css'
import {exampleProgram, nextInstruction, ScriptingContext, stepProgram} from './engine';
import {produce} from "immer";
import ContextDiff from './components/ContextDiff';

const ProgramViewer = ({program, pc, lastPc}: {program: typeof exampleProgram, pc: number, lastPc: number}) => {
  // Calculate the number of digits needed for the last line number
  const totalDigits = program.length > 0 ? Math.floor(Math.log10(program.length)) + 1 : 1;

  // Helper function to format line numbers with leading zeros
  const formatLineNumber = (lineNumber: number) => {
    return String(lineNumber).padStart(totalDigits, '0');
  };

  return (
    <pre className="program-viewer px-0">
      {program.map((instruction, index) => {
        const lineNumber = index;
        const formattedLineNumber = formatLineNumber(lineNumber + 1);
        const isCurrent = lineNumber === pc;
        const isPrevious = lineNumber === lastPc;

        return (
          <div key={index} className={`px-3 ${isPrevious ? 'bg-yellow-400 text-black font-bold' : isCurrent ? 'bg-yellow-800 font-bold' : ''}`}>
            <span className={`text-right mr-3 ${isPrevious ? 'text-gray-600' : 'text-gray-500'} select-none`}>
              {formattedLineNumber}
            </span>
            {instruction.op.name} {instruction.args.length > 0 ? JSON.stringify(instruction.args[0]) : ''}
          </div>
        );
      })}
    </pre>
  )
}

// Button looks 3D, press animation and hover effect
const Button = ({onClick, disabled, size, primary, children}: {onClick: () => void, disabled?: boolean, primary?: boolean, size?: "xl" | "l" | "m" | "s", children: React.ReactNode}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{borderColor: 'currentColor'}}
      className={`
        cursor-pointer
        bg-white
        ${primary ? "text-blue-500" : "text-gray-500"}
        font-bold
        ${size === "xl" ? "px-8 py-4" : size === "l" ? "px-6 py-3" : size === "m" ? "px-4 py-2" : size === "s" ? "px-2 py-1" : "px-4 py-2"}
        rounded
        ${`hover:${primary ? "text-blue-600" : "text-gray-600"}`}
        border-2
        [box-shadow:0_var(--shadow-height-normal)_0_currentColor]
        active:[box-shadow:0_var(--shadow-height-active)_0_currentColor]
        active:translate-y-0.5
        hover:[box-shadow:0_var(--shadow-height-hover)_0_currentColor]
        hover:-translate-y-0.5
        disabled:opacity-50
        disabled:cursor-not-allowed
        ${size === "xl" ? "text-2xl" : size === "l" ? "text-xl" : size === "m" ? "text-lg" : size === "s" ? "text-sm" : "text-base"}
        border
        ${primary ? "border-blue-200" : "border-gray-200"}
      `}
    >
      {children}
    </button>
  )
}

function step(ctx: ScriptingContext, program: typeof exampleProgram) {
  const instruction = nextInstruction(ctx, program);
  if(instruction) {
    return produce(ctx, draft => {
      stepProgram(draft, instruction);
    })
  }
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
    setCtxIdx(0);
    setStepCount(0);
  }, [setCtxs, setMore]);

  const clickNext = useCallback(() => {
    if(ctxIdx > 0) {
      setCtxIdx(ctxIdx - 1);
    } else {
      const nextCtx = step(ctx, exampleProgram);
      if(nextCtx) {
        pushCtx(nextCtx);
        setStepCount(stepCount + 1);
      } else {
        setMore(false);
      }
    }
  }, [ctxs, setMore, ctxIdx, setCtxIdx, ctx, pushCtx]);

  if(stepCount === 0) {
    clickNext();
  }

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
          <ProgramViewer program={exampleProgram} pc={ctx.pc} lastPc={previousCtx?.pc ?? 0}/>
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
