import {
  CompiledProcedure,
  type CompiledInstruction,
} from "../compiled_procedure";
import { WaxClass } from "../wax_classes";
import { useMachine } from "./MachineContext";
import classNames from "clsx";

interface ProgramViewerProps {
  value: CompiledProcedure;
}

// Helper function to format line numbers with leading zeros
const formatLineNumber = (lineNumber: number, totalDigits: number) => {
  return String(lineNumber).padStart(totalDigits, "0");
};

export default function ProgramViewer({ value: program }: ProgramViewerProps) {
  return (
    <pre className="ProgramViewer">
      <ProcedureViewer value={program} />
    </pre>
  );
}

export function ProcedureViewer({ value }: { value: CompiledProcedure }) {
  const totalDigits =
    value.length > 0 ? Math.floor(Math.log10(value.length)) + 1 : 1;
  const { machine, previousMachine } = useMachine();
  const pc = machine.currentProcedureContext()?.pc ?? 0;
  const lastPc = previousMachine?.currentProcedureContext()?.pc ?? -1;
  const inCurrentProcedure = machine.currentProcedure() === value;
  const waxClass = WaxClass.forJsObject(value);

  return (
    <>
      {waxClass.renderReact(value)}
      {value.map((instruction, index) => (
        <Instruction
          key={index}
          instruction={instruction}
          lineNumber={index}
          totalDigits={totalDigits}
          isCurrent={inCurrentProcedure && index === pc}
          isPrevious={inCurrentProcedure && index === lastPc}
        />
      ))}
    </>
  );
}

function Instruction({
  instruction,
  lineNumber,
  totalDigits,
  isCurrent,
  isPrevious,
}: {
  instruction: CompiledInstruction;
  lineNumber: number;
  totalDigits: number;
  isCurrent: boolean;
  isPrevious: boolean;
}) {
  const formattedLineNumber = formatLineNumber(lineNumber, totalDigits);

  return (
    <div
      key={lineNumber}
      className={classNames(`flex px-3`, {
        "bg-gray-600": isCurrent,
        "bg-gray-700": isPrevious,
      })}
    >
      <span className={`text-right mr-3 select-none`}>
        {formattedLineNumber}
      </span>
      {isCurrent ? (
        <span className="text-green-300 mr-2">↪</span>
      ) : isPrevious ? (
        <span
          className="text-green-700 mr-2"
          style={{ transform: "rotate(90deg)" }}
        >
          ➜
        </span>
      ) : (
        <span className="mr-2">&nbsp;</span>
      )}
      <div className="inline">{instruction.name}</div>
      <div className="inline ml-2">
        {instruction.args.map((arg, index) => (
          <div className="inline" key={index}>
            <InstructionArg arg={arg} />{" "}
          </div>
        ))}
      </div>
    </div>
  );
}

function InstructionArg({ arg }: { arg: any }) {
  const waxClass = WaxClass.forJsObject(arg);
  return waxClass.renderReact(arg);
}
