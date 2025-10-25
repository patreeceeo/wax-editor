import {useCallback, useState} from 'react';
import './App.css'
import {findMaxProc, Machine, nextInstruction, ProcedureContext, stepProgram} from './machine';
import {produce} from "immer";
import ContextDiff from './components/ContextDiff';
import {BackIcon, FastForwardIcon, PlayIcon, ResetIcon, RewindIcon} from './components/Icons';
import Button from './components/Button';
import ProgramViewer from './components/ProgramViewer';

function createInitialMachine(): Machine {
  const machine = new Machine();
  machine.loadProcedure("findMax", findMaxProc);
  machine.invokeProcedure("findMax");
  return machine;
}

function stepMachine(currentMachine: Machine): Machine | null {
  const instruction = currentMachine.nextInstruction();
  if(instruction) {
    return produce(currentMachine, draft => {
      draft.stepProgram(instruction);
    });
  }
  return null;
}

function App() {
  const [machines, setMachines] = useState([createInitialMachine()]);
  const [isMore, setMore] = useState(true);
  const [machineIndex, setMachineIndex] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const ctx = machines[machineIndex].currentProcedureContext();
  const previousCtx = machineIndex < machines.length - 1 ? machines[machineIndex + 1].currentProcedureContext() : undefined;

  const pushMachine = useCallback((newMachine: Machine) => {
    setMachines([newMachine, ...machines]);
  }, [setMachines, machines]);

  const clickPrev = useCallback(() => {
    setMachineIndex(machineIndex + 1);
    setStepCount(stepCount - 1);
    if(machineIndex < machines.length) {
      setMore(true);
    }
  }, [machineIndex, setMachineIndex, machines, stepCount, setStepCount, setMore]);

  const clickReset = useCallback(() => {
    setMachines([createInitialMachine()]);
    setMore(true);
    setMachineIndex(0);
    setStepCount(0);
  }, [setMachines, setMore, setMachineIndex, setStepCount]);

  const clickNext = useCallback(() => {
    if(machineIndex > 0) {
      setMachineIndex(machineIndex - 1);
    } else {
      const currentMachine = machines[0];
      const nextMachine = stepMachine(currentMachine);
      if(nextMachine) {
        pushMachine(nextMachine);
      } else {
        setMore(false);
      }
    }
    setStepCount(stepCount + 1);
  }, [machines, setMore, machineIndex, setMachineIndex, pushMachine, stepCount, setStepCount]);

  const clickRunToEnd = useCallback(() => {
    let currentMachine = machines[0];
    let newMachines = [];
    let steps = 0;
    while(true) {
      const nextMachine = stepMachine(currentMachine);
      if(nextMachine) {
        newMachines.unshift(nextMachine);
        currentMachine = nextMachine;
        steps += 1;
      } else {
        setMore(false);
        break;
      }
    }
    setStepCount(stepCount + steps);
    setMachines([...newMachines, ...machines]);
  }, [machines, setMore, stepCount, setStepCount]);

  return (
    <div className="p-4 space-y-4">
      <div className="space-x-4">
        <h1>My lil' Virtual Machine</h1>
        <Button size="xl" onClick={clickReset} disabled={machineIndex === machines.length - 1}>
          <RewindIcon size="xl" />
        </Button>
        <Button size="xl" onClick={clickPrev} disabled={machineIndex === machines.length - 1}>
          <BackIcon size="xl" />
        </Button>
        <Button primary size="xl" onClick={clickNext} disabled={!isMore}>
          <PlayIcon size="xl" />
        </Button>
        <Button size="xl" onClick={clickRunToEnd} disabled={!isMore}>
          <FastForwardIcon size="xl" />
        </Button>
      </div>
      <h3>Step Count: {stepCount}</h3>
      <div className="flex space-x-4">
        <div>
          <h2>Instructions</h2>
          <ProgramViewer program={findMaxProc} pc={ctx.pc} lastPc={previousCtx?.pc ?? 0}/>
        </div>
        <div className="flex-1 space-y-4">
          <h2>State</h2>
          <div className="flex space-x-4">
            <div>
              <h3 className="mt-0">Variables</h3>
              <ContextDiff
                propertyName="variables"
                currentContext={ctx}
                previousContext={previousCtx}
              />
            </div>
            <div>
              <h3 className="mt-0">Stack</h3>
              <ContextDiff
                propertyName="stack"
                currentContext={ctx}
                previousContext={previousCtx}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
