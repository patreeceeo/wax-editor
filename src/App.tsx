import {useMemo} from 'react';
import './App.css'
import { Machine } from './machine';
import Debugger from './components/Debugger';
import type {CompiledProcedure} from './compiled_procedure';
import {Compiler} from './compiler';
import {
  setVariableToLiteral,
  getVariable,
  getProperty,
  greaterThan,
  jumpIfTrue,
  setVariable,
  literal,
  add,
  getPropertyAtLiteral
} from './compiled_instructions';

// Example: Find the max element in an array
export const findMaxProc: CompiledProcedure = [
  // array = [...]
  Compiler.emit(setVariableToLiteral, 'array', [3, 1, 4, 1, 5, 9, 2, 6, 5]),
  // max = 0
  Compiler.emit(setVariableToLiteral, 'max', 0),
  // i = 0
  Compiler.emit(setVariableToLiteral, 'i', 0),
  // Loop start
  // max > array[i]
  Compiler.emit(getVariable, 'max'),
  Compiler.emit(getVariable, 'array'),
  Compiler.emit(getVariable, 'i'),
  Compiler.emit(getProperty),
  Compiler.emit(greaterThan),
  Compiler.emit(jumpIfTrue, 13),
  // max = array[i]
  Compiler.emit(getVariable, 'array'),
  Compiler.emit(getVariable, 'i'),
  Compiler.emit(getProperty),
  Compiler.emit(setVariable, 'max'),
  // i = i + 1
  Compiler.emit(getVariable, 'i'),
  Compiler.emit(literal, 1),
  Compiler.emit(add),
  Compiler.emit(setVariable, 'i'),
  // Loop condition: array.length > i
  Compiler.emit(getVariable, 'array'),
  Compiler.emit(getPropertyAtLiteral, 'length'),
  Compiler.emit(getVariable, 'i'),
  Compiler.emit(greaterThan),
  Compiler.emit(jumpIfTrue, 3),
  // End
]

function createInitialMachine(): Machine {
  const machine = new Machine();
  machine.load("main", findMaxProc)
  machine.start();
  return machine;
}

function App() {
  const machine = useMemo(() => createInitialMachine(), []);

  return (
    <div className="p-4 space-y-4">
      <h1>My lil' Virtual Machine</h1>
      <Debugger machine={machine} />
    </div>
  )
}

export default App
