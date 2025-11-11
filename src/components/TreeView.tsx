import {useCallback, useState, type ToggleEvent} from "react";
import {WaxClass} from "../wax_classes";
import {invariant} from "../error";

interface TreeViewProps {
  value: any;
  label?: string | number;
  depth?: number;
  inline?: boolean;
}

function WaxClassView({ value, waxClass }: { value: any, waxClass: WaxClass }) {
  return waxClass.renderReact(value);
}

export function TreeView({ value, label, depth = 0, inline }: TreeViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const waxClass = WaxClass.forJsObject(value);
  const isValueClass = waxClass !== undefined && WaxClass.isValueClass(waxClass);

  const handleToggle = useCallback((e: ToggleEvent<HTMLDetailsElement | HTMLDivElement>) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }, [isExpanded, setIsExpanded]);

  const isObject = typeof value === "object" && value !== null;
  const entries = isObject ? getEntries(value) : [];
  const isEmpty = entries.length === 0;
  const ContainerTagName = isEmpty ? 'div' : 'details';

  return <ContainerTagName onToggle={handleToggle} open={isExpanded} className={"TreeView" + (inline ? " inline-block" : "")}>
    {waxClass === undefined && (
      <>
        <Label value={value} label={label} />
        {isExpanded && (
          <TreeViewEntriesHelper entries={entries as [string | number, any][]} isEmpty={isEmpty} depth={depth} />
        )}
      </>
    )}
    {waxClass !== undefined && (
      <>
        <Label value={value} label={label} isReference={!isValueClass}/><WaxClassView value={value} waxClass={waxClass}/>
      </>
    )}
  </ContainerTagName>;
}

function getEntries(value: any): [string | number, any][] {
  const isArray = Array.isArray(value);
  return isArray ? value.map((value, index) => [index, value]) : Object.entries(value);
}

function Label({ value, label, isReference = true }: { value: any, label?: string | number, isReference?: boolean }) {
  const labelWaxClass = WaxClass.forJsObject(label);
  invariant(labelWaxClass !== undefined, `WaxClass should be defined for label: ${String(label)}`);
  const entries = isReference ? getEntries(value) : [];
  const isArray = Array.isArray(value);
  const SummaryTagName = isReference && entries.length > 0 ? 'summary' : 'span';

  return (
    (label !== undefined || isReference) && (
      <SummaryTagName className="TreeView_summary">
      {label !== undefined && <WaxClassView value={label} waxClass={labelWaxClass} />}
      {isReference && (
        <span className="text-gray-400 ml-1">
          ({entries.length}) {isArray ? `[…]` : `{…}`}
        </span>
      )}
      {!isReference && label !== undefined && (
        <span className="mx-1 text-gray-400">
          ➜
        </span>
      )}
      </SummaryTagName>
    )
  )
}

export function TreeViewEntries({value, depth = 0}: TreeViewProps) {
  const entries = getEntries(value);
  const isEmpty = entries.length === 0;
  return (
    <TreeViewEntriesHelper
      isEmpty={isEmpty}
      entries={entries}
      depth={depth}
    />
  )
}

function TreeViewEntriesHelper({isEmpty, entries, depth}: {isEmpty: boolean, entries: [string | number, any][], depth: number}) {
  return !isEmpty && (
    <div className="ml-8 border-l-2 border-gray-200">
      {entries.map(([key, value]) => (
        <TreeView
          key={key}
          value={value}
          label={key}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}

