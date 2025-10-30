import { useMemo } from 'react'
import { diffLines } from 'diff'

interface ContextDiffProps {
  currentContext: any
  previousContext?: any
  className?: string
}

type ChangeResult = ReturnType<typeof diffLines>[number]

export function Diff({
  currentCode,
  previousCode,
  className = ''
}: {currentCode: string, previousCode?: string, className?: string}) {
  const diffResult = useMemo(() => {
    if (!previousCode) {
      // If no previous context, just show current context
      const lines = currentCode.split('\n')
      return lines.map(line => ({ value: line })) as unknown as ChangeResult[]
    }

    return diffLines(previousCode, currentCode)
  }, [currentCode, previousCode, diffLines])

  const getLineClass = (part: ChangeResult) => {
    if(part.added) {
        return 'bg-green-300 text-green-900 font-bold'
    }
    if(part.removed) {
        return 'bg-red-300 text-red-900 font-bold'
    }
    return ''
  }

  return (
    <pre className={`whitespace-pre ${className} px-0`}>
      {diffResult.map((part, index) => {
        // Remove trailing newline for better display
        const text = part.value.endsWith('\n') ? part.value.slice(0, -1) : part.value
        return <div
          key={index}
          className={`${getLineClass(part)} px-3`}
        >
          {text}
        </div>
      })}
    </pre>
  )
}

function stringify(obj: any) {
  return JSON.stringify(obj, null, 2)
}

export default function JsonDiff({
  currentContext,
  previousContext,
  className = ''
}: ContextDiffProps) {

  return (
      <Diff
        currentCode={stringify(currentContext)}
        previousCode={previousContext ? stringify(previousContext) : undefined}
        className={className}
      />
  )
}
