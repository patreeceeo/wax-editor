import React from "react";
import { WaxClass } from "../wax_classes";
import { TextRect } from "./TextRect";
import type { GraphNode } from "../graph_utils";

export function getNodeText(node: GraphNode) {
  const waxClass = WaxClass.forJsObject(node.value);
  return waxClass.stringify(node.value);
}

/**
 * Memoized individual graph node component
 */
export const GraphNodeComponent = React.memo(
  ({
    node,
    isTop = false,
    onMouseDown,
  }: {
    node: GraphNode;
    isTop?: boolean;
    onMouseDown: (nodeId: string, event: React.MouseEvent) => void;
  }) => {
    const waxClass = WaxClass.forJsObject(node.value);
    const text = getNodeText(node);

    return (
      <g onMouseDown={(e) => onMouseDown(node.id, e)} className="cursor-move">
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
    );
  },
);

GraphNodeComponent.displayName = "GraphNodeComponent";
