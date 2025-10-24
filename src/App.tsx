import {useCallback, useState} from 'react';
import './App.css'
import {exampleProgram, nextInstruction, ScriptingContext, stepProgram} from './engine';
import {produce} from "immer";
import ContextDiff from './components/ContextDiff';
import {BackIcon, PlayIcon, ResetIcon} from './components/Icons';
import Button from './components/Button';
import ProgramViewer from './components/ProgramViewer';



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

  return (
    <div className="p-4 space-y-4">
      <div className="space-x-4">
        <Button size="xl" onClick={clickPrev} disabled={ctxIdx === ctxs.length - 1}>
          <BackIcon size="xl" />
        </Button>
        <Button size="xl" onClick={clickReset}>
          <ResetIcon size="xl" />
        </Button>
        <Button primary size="xl" onClick={clickNext} disabled={!isMore}>
          <PlayIcon size="xl" />
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
