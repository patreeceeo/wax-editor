import { useMemo } from 'react'
import { diffLines } from 'diff'
import { ScriptingContext } from '../engine'

interface ContextDiffProps {
  currentContext: ScriptingContext
  previousContext?: ScriptingContext
  className?: string
}

type ChangeResult = ReturnType<typeof diffLines>[number]

function cleanContext(ctx: ScriptingContext) {
  const ctxCopy = {...ctx} as any;
  delete ctxCopy.pc; // Remove pc for cleaner diff
  return ctxCopy;
}

export default function ContextDiff({
  currentContext,
  previousContext,
  className = ''
}: ContextDiffProps) {
  const diffResult = useMemo(() => {
    if (!previousContext) {
      // If no previous context, just show current context
      const currentJson = JSON.stringify(cleanContext(currentContext), null, 2)
      const lines = currentJson.split('\n')
      return lines.map(line => ({ value: line })) as unknown as ChangeResult[]
    }

    const currentJson = JSON.stringify(cleanContext(currentContext), null, 2)
    const previousJson = JSON.stringify(cleanContext(previousContext), null, 2)

    return diffLines(previousJson, currentJson)
  }, [currentContext, previousContext])

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
    <pre className={`context-diff ${className} px-0`}>
      {diffResult.map((part, index) => (
        <div
          key={index}
          className={`${getLineClass(part)} font-mono whitespace-pre-wrap px-3`}
        >
          {part.value.slice(0, -1)} {/* Remove trailing new line */}
        </div>
      ))}
    </pre>
  )
}
