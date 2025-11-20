import {useCallback, useState, type ToggleEvent} from "react";
import {jsObjectClass, WaxClass} from "../wax_classes";
import {getObjectEntries} from "./shared/DataVisualizationUtils";

interface TreeViewProps {
  value: any;
  label?: string | number;
  inline?: boolean;
}

function WaxClassView({ value, waxClass }: { value: any, waxClass: WaxClass }) {
  return waxClass.renderReact(value);
}

export function TreeView({ value, label, inline }: TreeViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const waxClass = WaxClass.forJsObject(value);
  const isValueClass = WaxClass.isValueClass(waxClass);

  const handleToggle = useCallback((e: ToggleEvent<HTMLDetailsElement | HTMLDivElement>) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  }, [isExpanded, setIsExpanded]);

  const entries = getObjectEntries(value);
  const isEmpty = entries.length === 0;
  const ContainerTagName = isEmpty ? 'div' : 'details';

  return <ContainerTagName onToggle={handleToggle} open={isExpanded} className={"TreeView" + (inline ? " inline-block" : "")}>
      <Label value={value} label={label} isReference={!isValueClass}/>
    {(waxClass !== jsObjectClass || isExpanded) && (
      <WaxClassView value={value} waxClass={waxClass}/>
    )}
  </ContainerTagName>;
}


function Label({ value, label, isReference = true }: { value: any, label?: string | number, isReference?: boolean }) {
  const labelWaxClass = WaxClass.forJsObject(label);
  const entries = isReference ? getObjectEntries(value) : [];
  const isArray = Array.isArray(value);
  const SummaryTagName = isReference && entries.length > 0 ? 'summary' : 'span';
  const waxClass = WaxClass.forJsObject(value);

  return (
    (label !== undefined || isReference) && (
      <SummaryTagName className="TreeView_summary">
      {label !== undefined && <WaxClassView value={label} waxClass={labelWaxClass} />}
      {isReference && (
        <span className="text-gray-400 ml-1">
          {waxClass.displayName}{isArray && `(${entries.length})`}
        </span>
      )}
      {!isReference && label !== undefined && (
        <span className="mx-1 text-gray-400">➜</span>
      )}
      </SummaryTagName>
    )
  )
}

export function TreeViewEntries({value}: TreeViewProps) {
  const entries = getObjectEntries(value);
  const isEmpty = entries.length === 0;
  return !isEmpty && (
    <div className="ml-8 border-l-2 border-gray-200">
      {entries.map(({key, value}) => (
        <TreeView
          key={key}
          value={value}
          label={key}
        />
      ))}
    </div>
  );
}


