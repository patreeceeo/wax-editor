import React from "react";
import { WaxClass } from "../wax_classes";
import { getObjectId } from "../utils";
import {
  calculateEdgeTextAngle,
  getLineRectangleIntersection,
  getTextDimensions,
  type GraphEdge,
  type GraphNode,
} from "../graph_utils";
import { TextRect } from "./TextRect";

/**
 * Memoized individual graph edge component
 */
export const GraphEdgeComponent = React.memo(
  ({
    edge,
    nodeLookupMap,
    isTop = false,
  }: {
    edge: GraphEdge;
    nodeLookupMap: Map<string, GraphNode>;
    isTop?: boolean;
  }) => {
    const sourceNode = nodeLookupMap.get(edge.source);
    const targetNode = nodeLookupMap.get(edge.target);

    if (!sourceNode || !targetNode) return null;

    // Calculate target node dimensions
    const waxClass = WaxClass.forJsObject(targetNode.value);
    const targetText = WaxClass.isValueClass(waxClass)
      ? waxClass.stringify(targetNode.value)
      : `${waxClass.displayName} #${getObjectId(targetNode.value)}`;

    const targetDimensions = getTextDimensions(targetText, 12);

    // Calculate where the line should intersect with target node rectangle
    const intersection = getLineRectangleIntersection(
      sourceNode.x,
      sourceNode.y,
      targetNode.x,
      targetNode.y,
      targetNode.x,
      targetNode.y,
      targetDimensions.width,
      targetDimensions.height,
    );

    // Calculate edge properties using intersection point
    const dx = intersection.x - sourceNode.x;
    const dy = intersection.y - sourceNode.y;
    const midX = (sourceNode.x + intersection.x) / 2;
    const midY = (sourceNode.y + intersection.y) / 2;

    const edgeLength = Math.sqrt(dx * dx + dy * dy);

    return (
      <g>
        <line
          x1={sourceNode.x}
          y1={sourceNode.y}
          x2={intersection.x}
          y2={intersection.y}
          stroke={isTop ? "white" : "rgb(4, 120, 87)"}
          strokeWidth={2}
          markerEnd="url(#arrowhead)"
        />
        {/* Edge label with rotation */}
        {edgeLength > 60 && (
          <TextRect
            x={midX}
            y={midY}
            text={String(edge.label)}
            transform={`rotate(${calculateEdgeTextAngle(dx, dy)} ${midX} ${midY})`}
            rectFill="var(--tw-prose-pre-bg)"
            rectStroke="none"
            textFill="rgb(217, 119, 6)"
          />
        )}
      </g>
    );
  },
);

GraphEdgeComponent.displayName = "GraphEdgeComponent";
