import {useCallback, useReducer} from 'react';
import {Machine} from '../machine';
import {MachineProvider} from './MachineContext';
import JsonDiff from './JsonDiff';
import {BackIcon, FastForwardIcon, PlayIcon, RewindIcon} from './Icons';
import Button from './Button';
import ProgramViewer from './ProgramViewer';
import {TreeView} from './TreeView';
import {GraphView} from './GraphView';

interface DebuggerProps {
  machine: Machine;
}

interface DebuggerState {
  machines: Machine[];
  isMore: boolean;
  machineIndex: number;
  stepCount: number;
}

type DebuggerAction =
  | { type: 'RESET'; machine: Machine }
  | { type: 'PREV' }
  | { type: 'NEXT' }
  | { type: 'RUN_TO_END' };

function stepMachine(currentMachine: Machine): Machine | null {
  const instruction = currentMachine.getInstruction();
  if(instruction) {
    return currentMachine.produce((draft) => {
      draft.applyInstruction(instruction);
    });
  }
  return null;
}

export function _getInitialState(machine: Machine): DebuggerState {
  return {
    machines: [machine],
    isMore: true,
    machineIndex: 0,
    stepCount: 0
  };
}

/**
* Reducer function to manage debugger state transitions.
* Only exported for tests.
*/
export function _reducer(state: DebuggerState, action: DebuggerAction): DebuggerState {
  switch (action.type) {
    case 'RESET': {
      return _getInitialState(action.machine);
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
      let stepCount = state.stepCount + state.machineIndex;
      const newMachines = [...state.machines];

      // Step forward to completion
      while(true) {
        const nextMachine = stepMachine(newMachines[0]);
        if(nextMachine) {
          newMachines.unshift(nextMachine);
          stepCount += 1;
        } else {
          break;
        }
      }

      return {
        machines: newMachines,
        isMore: false,
        machineIndex: 0,
        stepCount
      };
    }

    default:
      return state;
  }
}

export default function Debugger({ machine: initialMachine }: DebuggerProps) {
  const initialState = _getInitialState(initialMachine);

  const [state, dispatch] = useReducer(_reducer, initialState);
  const { machines, isMore, machineIndex, stepCount } = state;
  const ctx = machines[machineIndex].currentProcedureContext()!.toJSON();
  const previousCtx = machineIndex < machines.length - 1 ? machines[machineIndex + 1].currentProcedureContext()!.toJSON() : undefined;

  const program = machines[machineIndex].currentProcedure()!;

  const clickReset = useCallback(() => dispatch({ type: 'RESET', machine: initialMachine }), [initialMachine]);

  const clickPrev = useCallback(() => dispatch({ type: 'PREV' }), []);

  const clickNext = useCallback(() => dispatch({ type: 'NEXT' }), []);

  const clickRunToEnd = useCallback(() => dispatch({ type: 'RUN_TO_END' }), []);

  return (
    <MachineProvider machine={machines[machineIndex]} previousMachine={machineIndex < machines.length - 1 ? machines[machineIndex + 1] : undefined}>
      <div className="space-x-4">
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
      <GraphView value={machines[machineIndex]} />
      <div className="flex space-x-4">
        <div>
          <h2>Instructions</h2>
          <ProgramViewer value={program} />
        </div>
        <div className="flex-1 space-y-4">
          <h2>State</h2>
          <div className="flex space-x-4">
            <div>
              <h3 className="mt-0">Variables</h3>
              <JsonDiff
                currentContext={ctx.variables}
                previousContext={previousCtx ? previousCtx['variables'] : undefined}
              />
            </div>
            <div>
              <h3 className="mt-0">Stack</h3>
              <JsonDiff
                currentContext={ctx.stack}
                previousContext={previousCtx ? previousCtx['stack'] : undefined}
              />
            </div>
          </div>
        </div>
      </div>
      <TreeView value={machines[machineIndex]} label='machine'/>
    </MachineProvider>
  )
}
