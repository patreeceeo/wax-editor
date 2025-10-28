import {useCallback, useReducer} from 'react';
import './App.css'
import {findMaxProc, Machine } from './machine';
import {produce} from "immer";
import ContextDiff from './components/ContextDiff';
import {BackIcon, FastForwardIcon, PlayIcon, RewindIcon} from './components/Icons';
import Button from './components/Button';
import ProgramViewer from './components/ProgramViewer';

function createInitialMachine(): Machine {
  const machine = new Machine();
  machine.load("findMax", findMaxProc);
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






// State management interfaces and types
interface AppState {
  machines: Machine[];
  isMore: boolean;
  machineIndex: number;
  stepCount: number;
}

type AppAction =
  | { type: 'RESET' }
  | { type: 'PREV' }
  | { type: 'NEXT' }
  | { type: 'RUN_TO_END' };

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'RESET': {
      return {
        machines: [createInitialMachine()],
        isMore: true,
        machineIndex: 0,
        stepCount: 0
      };
    }

    case 'PREV': {
      if (state.machineIndex < state.machines.length - 1) {
        return {
          ...state,
          machineIndex: state.machineIndex + 1,
          stepCount: state.stepCount - 1,
          isMore: true
        };
      }
      return state;
    }

    case 'NEXT': {
      if (state.machineIndex > 0) {
        // Navigate forward in history
        return {
          ...state,
          machineIndex: state.machineIndex - 1,
          stepCount: state.stepCount + 1
        };
      } else {
        // Step current machine forward
        const currentMachine = state.machines[0];
        const nextMachine = stepMachine(currentMachine);
        if (nextMachine) {
          return {
            machines: [nextMachine, ...state.machines],
            isMore: true,
            machineIndex: 0,
            stepCount: state.stepCount + 1
          };
        } else {
          return {
            ...state,
            isMore: false
          };
        }
      }
    }

    case 'RUN_TO_END': {
      const startMachine = state.machines[state.machineIndex];
      let steppedMachines = [];
      let currentMachine = startMachine;

      // Step forward to completion
      while (true) {
        const nextMachine = stepMachine(currentMachine);
        if (nextMachine) {
          steppedMachines.push(nextMachine);
          currentMachine = nextMachine;
        } else {
          break;
        }
      }

      // Build complete timeline: machines before start + stepped machines
      const beforeStart = state.machines.slice(state.machineIndex + 1);
      const completeTimeline = [currentMachine, ...steppedMachines.reverse(), ...beforeStart];

      // Calculate step count based on position in complete timeline
      const finalStepCount = state.machineIndex + steppedMachines.length;

      return {
        machines: completeTimeline,
        isMore: false,
        machineIndex: 0,
        stepCount: finalStepCount
      };
    }

    default:
      return state;
  }
}

function App() {
  const initialState: AppState = {
    machines: [createInitialMachine()],
    isMore: true,
    machineIndex: 0,
    stepCount: 0
  };

  const [state, dispatch] = useReducer(appReducer, initialState);
  const { machines, isMore, machineIndex, stepCount } = state;
  const ctx = machines[machineIndex].currentProcedureContext();
  const previousCtx = machineIndex < machines.length - 1 ? machines[machineIndex + 1].currentProcedureContext() : undefined;

  const clickReset = useCallback(() => dispatch({ type: 'RESET' }), []);

  const clickPrev = useCallback(() => dispatch({ type: 'PREV' }), []);

  const clickNext = useCallback(() => dispatch({ type: 'NEXT' }), []);

  const clickRunToEnd = useCallback(() => dispatch({ type: 'RUN_TO_END' }), []);

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
