import { CompiledProcedure, type CompiledInstruction } from '../compiled_procedure';
import { useMachine } from './MachineContext';

interface ProgramViewerProps {
  program: CompiledProcedure;
  lastPc: number;
}

// Helper function to format line numbers with leading zeros
const formatLineNumber = (lineNumber: number, totalDigits: number) => {
  return String(lineNumber).padStart(totalDigits, '0');
};

export default function ProgramViewer({
  program,
  lastPc
}: ProgramViewerProps) {
  return (
    <pre className="program-viewer px-0">
      <Procedure procedure={program} lastPc={lastPc} />
    </pre>
  )
}

function Procedure({
  procedure,
  lastPc
}: { procedure: CompiledProcedure; lastPc: number}) {
  const totalDigits = procedure.length > 0 ? Math.floor(Math.log10(procedure.length)) + 1 : 1;
  const { machine } = useMachine();
  const pc = machine.currentProcedureContext()?.pc ?? 0;
  const isCurrent = machine.currentProcedure() === procedure;

  return <>
    {procedure.map((instruction, index) => (
      <Instruction
        key={index}
        instruction={instruction}
        lineNumber={index}
        totalDigits={totalDigits}
        isCurrent={isCurrent && index === pc}
        isPrevious={index === lastPc}
      />
    ))}
  </>
}

function Instruction({instruction, lineNumber, totalDigits, isCurrent, isPrevious}: { instruction: CompiledInstruction; lineNumber: number, totalDigits: number, isCurrent: boolean, isPrevious: boolean}) {
  const formattedLineNumber = formatLineNumber(lineNumber, totalDigits);

  return (
    <div key={lineNumber} className={`px-3 ${isCurrent ? 'bg-yellow-300 font-bold text-black' : isPrevious ? 'bg-red-400 text-black font-bold' :  ''}`}>
      <span className={`text-right mr-3 ${isPrevious ? 'text-gray-600' : 'text-gray-500'} select-none`}>
        {formattedLineNumber}
      </span>
      <span>
        {instruction.fn.name} {instruction.args.map((arg, index) => <span key={index}><InstructionArg arg={arg} /> </span>)}
      </span>
    </div>
  );
}


function InstructionArg({ arg }: { arg: any }) {
  if (typeof arg === 'string') {
    return <span className="text-green-600">"{arg}"</span>;
  } else if (typeof arg === 'number') {
    return <span className="text-blue-600">{arg}</span>;
  } else if (typeof arg === 'boolean') {
    return <span className="text-purple-600">{String(arg)}</span>;
  } else if (arg === null) {
    return <span className="text-gray-600">null</span>;
  } else if (arg === undefined) {
    return <span className="text-gray-600">undefined</span>;
  } else if (Array.isArray(arg)) {
    return (
      <span>
        [
        {arg.map((item, index) => {
          return (
            <span key={index}>
              <InstructionArg arg={item} />
              {index < arg.length - 1 ? ', ' : ''}
            </span>
          )
        })}
        ]
      </span>
    );
  } else if (typeof arg === 'object') {
    if(CompiledProcedure.isInstance(arg)) {
      return <Procedure procedure={arg} lastPc={-1} />;
    }
    return (
      <span>
        {'{'}
        {Object.entries(arg).map(([key, value], index, array) => (
          <span key={key}>
            <span className="text-red-600">{key}</span>: <InstructionArg arg={value} />
            {index < array.length - 1 ? ', ' : ''}
          </span>
        ))}
        {'}'}
      </span>
    );
  } else {
    return <span>{String(arg)}</span>;
  }
}
