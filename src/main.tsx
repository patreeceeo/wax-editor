import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {
  trueClass,
  falseClass,
  numberClass,
  procedureClass,
  arrayClass,
} from "./wax_classes.tsx";
import { Compiler } from "./compiler.ts";
import {
  add,
  getJsObjectProperty,
  getJsObjectPropertyForLiteral,
  getVariable,
  greaterThan,
  invokeProcedure,
  jump,
  jumpIfFalse,
  lessThan,
  pop,
  pushReturnValue,
  returnFromProcedure,
  setVariable,
} from "./compiled_instructions.ts";
import { CompiledProcedure } from "./compiled_procedure.ts";

trueClass.defineMethod(
  "ifTrue",
  new CompiledProcedure({
    id: "True_ifTrue",
    instructions: [
      Compiler.emit(pop),
      Compiler.emit(invokeProcedure),
      Compiler.emit(pushReturnValue),
      Compiler.emit(returnFromProcedure),
    ],
  }),
);

falseClass.defineMethod(
  "ifTrue",
  new CompiledProcedure({
    id: "False_ifTrue",
    instructions: [Compiler.emit(returnFromProcedure)],
  }),
);

numberClass
  .defineMethod(
    "+",
    new CompiledProcedure({
      id: "Number_add",
      instructions: [
        Compiler.emit(add),
        Compiler.emit(pushReturnValue),
        Compiler.emit(returnFromProcedure),
      ],
    }),
  )
  .defineMethod(
    ">",
    new CompiledProcedure({
      id: "Number_greaterThan",
      instructions: [
        Compiler.emit(greaterThan),
        Compiler.emit(pushReturnValue),
        Compiler.emit(returnFromProcedure),
      ],
    }),
  )
  .defineMethod(
    "<",
    new CompiledProcedure({
      id: "Number_lessThan",
      instructions: [
        Compiler.emit(lessThan),
        Compiler.emit(pushReturnValue),
        Compiler.emit(returnFromProcedure),
      ],
    }),
  );

procedureClass.defineMethod(
  "whileTrue",
  new CompiledProcedure({
    id: "Procedure_whileTrue",
    instructions: [
      Compiler.emit(setVariable, "conditionProc"),
      Compiler.emit(setVariable, "bodyProc"),
      // Start of loop
      Compiler.emit(getVariable, "conditionProc"),
      Compiler.emit(invokeProcedure),
      Compiler.emit(jumpIfFalse, 3),
      Compiler.emit(getVariable, "bodyProc"),
      Compiler.emit(invokeProcedure),
      // Negative jump values need to account for the increment after each
      // instruction, hence -6 instead of -5
      Compiler.emit(jump, -6),
      Compiler.emit(returnFromProcedure),
    ],
  }),
);

arrayClass
  .defineMethod(
    "length",
    new CompiledProcedure({
      id: "Array_length",
      instructions: [
        Compiler.emit(getJsObjectPropertyForLiteral, "length"),
        Compiler.emit(pushReturnValue),
        Compiler.emit(returnFromProcedure),
      ],
    }),
  )
  .defineMethod(
    "at:",
    new CompiledProcedure({
      id: "Array_at",
      instructions: [
        Compiler.emit(getJsObjectProperty),
        Compiler.emit(pushReturnValue),
        Compiler.emit(returnFromProcedure),
      ],
    }),
  );

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
