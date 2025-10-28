import {useMemo} from 'react';
import './App.css'
import { findMaxProc, Machine } from './machine';
import Debugger from './components/Debugger';

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
