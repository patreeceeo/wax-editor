import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {trueClass, falseClass, numberClass} from './wax_classes.ts'
import {Compiler} from './compiler.ts'
import {add, greaterThan, invokeProcedure} from './compiled_instructions.ts'
import {CompiledProcedure} from './compiled_procedure.ts'

trueClass.defineMethod('ifTrue', new CompiledProcedure({
  instructions: [
    Compiler.emit(invokeProcedure)
  ]
}));

falseClass.defineMethod('ifTrue', new CompiledProcedure({
  instructions: [
  ]
}));

numberClass.defineMethod('+', new CompiledProcedure({
  instructions: [
    Compiler.emit(add)
  ]
}))
.defineMethod('>', new CompiledProcedure({
  instructions: [
    Compiler.emit(greaterThan)
  ]
}));


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
