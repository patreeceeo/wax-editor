import {useCallback, useState, type Dispatch, type SetStateAction} from 'react';
import './App.css'
import {findMaxProc, Machine } from './machine';
import {produce} from "immer";
import ContextDiff from './components/ContextDiff';
import {BackIcon, FastForwardIcon, PlayIcon, RewindIcon} from './components/Icons';
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

// Helper functions for hooks
function pushMachineHelper(
  machines: Machine[],
  newMachine: Machine,
  setMachines: Dispatch<SetStateAction<Machine[]>>
) {
  setMachines([newMachine, ...machines]);
}

function clickPrevHelper(
  machineIndex: number,
  machines: Machine[],
  setMachineIndex: Dispatch<SetStateAction<number>>,
  setMore: Dispatch<SetStateAction<boolean>>,
  setStepCount: Dispatch<SetStateAction<number>>
) {
  setMachineIndex(machineIndex + 1);
  setStepCount(prev => prev - 1);
  if(machineIndex < machines.length) {
    setMore(true);
  }
}

function clickResetHelper(
  setMachineIndex: Dispatch<SetStateAction<number>>,
  setMachines: Dispatch<SetStateAction<Machine[]>>,
  setMore: Dispatch<SetStateAction<boolean>>,
  setStepCount: Dispatch<SetStateAction<number>>
) {
  setMachines([createInitialMachine()]);
  setMore(true);
  setMachineIndex(0);
  setStepCount(0);
}

function clickNextHelper(
  machineIndex: number,
  machines: Machine[],
  pushMachine: (newMachine: Machine) => void,
  setMachineIndex: Dispatch<SetStateAction<number>>,
  setMore: Dispatch<SetStateAction<boolean>>,
  setStepCount: Dispatch<SetStateAction<number>>
) {
  if(machineIndex > 0) {
    setMachineIndex(machineIndex - 1);
    setStepCount(prev => prev + 1);
  } else {
    const currentMachine = machines[0];
    const nextMachine = stepMachine(currentMachine);
    if(nextMachine) {
      pushMachine(nextMachine);
      setStepCount(prev => prev + 1);
    } else {
      setMore(false);
    }
  }
}

function clickRunToEndHelper(
  machineIndex: number,
  machines: Machine[],
  setMachineIndex: Dispatch<SetStateAction<number>>,
  setMachines: Dispatch<SetStateAction<Machine[]>>,
  setMore: Dispatch<SetStateAction<boolean>>,
  setStepCount: Dispatch<SetStateAction<number>>
) {
  const startMachine = machines[machineIndex];
  let steppedMachines = [];
  let currentMachine = startMachine;

  // Step forward to completion
  while(true) {
    const nextMachine = stepMachine(currentMachine);
    if(nextMachine) {
      steppedMachines.push(nextMachine);
      currentMachine = nextMachine;
    } else {
      setMore(false);
      break;
    }
  }

  // Build complete timeline: machines before start + stepped machines
  const beforeStart = machines.slice(machineIndex + 1);
  const completeTimeline = [currentMachine, ...steppedMachines.reverse(), ...beforeStart];

  // Calculate step count based on position in complete timeline
  const finalStepCount = machineIndex + steppedMachines.length;

  setMachines(completeTimeline);
  setStepCount(finalStepCount);
  setMachineIndex(0);
}

function App() {
  const [machines, setMachines] = useState([createInitialMachine()]);
  const [isMore, setMore] = useState(true);
  const [machineIndex, setMachineIndex] = useState(0);
  const [stepCount, setStepCount] = useState(0);
  const ctx = machines[machineIndex].currentProcedureContext();
  const previousCtx = machineIndex < machines.length - 1 ? machines[machineIndex + 1].currentProcedureContext() : undefined;

  const pushMachine = useCallback((newMachine: Machine) => pushMachineHelper(machines, newMachine, setMachines), [machines, setMachines]);

  const clickPrev = useCallback(() => clickPrevHelper(machineIndex, machines, setMachineIndex, setMore, setStepCount), [machineIndex, machines, setMachineIndex, setMore, setStepCount]);

  const clickReset = useCallback(() => clickResetHelper(setMachineIndex, setMachines, setMore, setStepCount), [setMachineIndex, setMachines, setMore, setStepCount]);

  const clickNext = useCallback(() => clickNextHelper(machineIndex, machines, pushMachine, setMachineIndex, setMore, setStepCount), [machineIndex, machines, pushMachine, setMachineIndex, setMore, setStepCount]);

  const clickRunToEnd = useCallback(() => clickRunToEndHelper(machineIndex, machines, setMachineIndex, setMachines, setMore, setStepCount), [machineIndex, machines, setMachineIndex, setMachines, setMore, setStepCount]);

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
