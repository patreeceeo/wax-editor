import React from "react";
import {WaxClass} from "../wax_classes";
import {getObjectId} from "../utils";
import { TextRect } from "./TextRect";
import type {GraphNode} from "../graph_utils";


/**
 * Memoized individual graph node component
 */
export const GraphNodeComponent = React.memo(({
  node,
  isTop = false,
  onMouseDown
}: {
  node: GraphNode;
  isTop?: boolean;
  onMouseDown: (nodeId: string, event: React.MouseEvent) => void;
}) => {
  const waxClass = WaxClass.forJsObject(node.value);
  const text = WaxClass.isValueClass(waxClass)
    ? waxClass.stringify(node.value)
    : `${waxClass.displayName} #${getObjectId(node.value)}`

  return (
    <g
      onMouseDown={(e) => onMouseDown(node.id, e)}
      className='cursor-move'
    >
      <TextRect
        x={node.x}
        y={node.y}
        padding={8}
        text={text}
        rectFill="var(--tw-prose-pre-bg)"
        rectStroke={isTop ? "white" : "rgb(4, 120, 87)"}
        textFill={waxClass.displayColor}
      />
    </g>
  )
});

GraphNodeComponent.displayName = 'GraphNodeComponent';
