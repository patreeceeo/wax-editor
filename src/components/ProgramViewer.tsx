import { type CompiledProcedure } from '../machine';

interface ProgramViewerProps {
  program: CompiledProcedure;
  pc: number;
  lastPc: number;
}

// Helper function to format line numbers with leading zeros
const formatLineNumber = (lineNumber: number, totalDigits: number) => {
  return String(lineNumber).padStart(totalDigits, '0');
};

export default function ProgramViewer({
  program,
  pc,
  lastPc
}: ProgramViewerProps) {
  // Calculate the number of digits needed for the last line number
  const totalDigits = program.length > 0 ? Math.floor(Math.log10(program.length)) + 1 : 1;

  return (
    <pre className="program-viewer px-0">
      {program.map((instruction, index: number) => {
        const lineNumber = index;
        const formattedLineNumber = formatLineNumber(lineNumber, totalDigits);
        const isCurrent = lineNumber === pc;
        const isPrevious = lineNumber === lastPc;

        return (
          <div key={index} className={`px-3 ${isCurrent ? 'bg-yellow-300 font-bold text-black' : isPrevious ? 'bg-red-400 text-black font-bold' :  ''}`}>
            <span className={`text-right mr-3 ${isPrevious ? 'text-gray-600' : 'text-gray-500'} select-none`}>
              {formattedLineNumber}
            </span>
            <span>
              {instruction.fn.name} {instruction.args.map(arg => JSON.stringify(arg)).join(', ')}
            </span>
          </div>
        );
      })}
    </pre>
  )
}
