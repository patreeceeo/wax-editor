import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  falseClass,
  nilClass,
  numberClass,
  procedureClass,
  stringClass,
  trueClass,
  WaxClass,
} from "../wax_classes";
import classNames from "classnames";
import {
  useElementSize,
  useEventListener,
  usePanning,
  useSvgChildDragging,
} from "../react_hooks";
import { Vec2 } from "../vec2";
import { GraphNodeComponent } from "./GraphNode";
import { GraphEdgeComponent } from "./GraphEdge";
import {
  forceDirectedLayout,
  fireworksLayout,
  objectToGraph,
  randomLayout,
  type GraphData,
  type GraphNode,
} from "../graph_utils";

interface GraphViewProps {
  value: any;
}

const LEAF_CLASSES = [
  stringClass,
  numberClass,
  trueClass,
  falseClass,
  nilClass,
  procedureClass,
];

/**
 * Main GraphView component
 */
export function GraphView({ value }: GraphViewProps) {
  const [containerRef, dimensions] = useElementSize<HTMLDivElement>(4 / 3);
  const [scale, setScale] = useState(1);
  const svgRef = useEventListener<SVGSVGElement, "wheel">(
    "wheel",
    (event) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      setScale((prev) => Math.max(0.1, Math.min(5, prev * delta)));
    },
    { passive: false },
  );

  /** Panning */
  const panning = usePanning(svgRef);
  const getAutoPanVelocity = useCallback(
    (element: SVGSVGElement, event: React.MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const edgeThreshold = Math.min(dimensions.width, dimensions.height) * 0.2;
      const vel = new Vec2(0, 0);

      if (x < edgeThreshold) {
        const distance = edgeThreshold - x;
        vel.x = distance ** 2 / 200;
      } else if (x > rect.width - edgeThreshold) {
        const distance = x - (rect.width - edgeThreshold);
        vel.x = -(distance ** 2) / 200;
      }

      if (y < edgeThreshold) {
        const distance = edgeThreshold - y;
        vel.y = distance ** 2 / 200;
      } else if (y > rect.height - edgeThreshold) {
        const distance = y - (rect.height - edgeThreshold);
        vel.y = -(distance ** 2) / 200;
      }

      return vel;
    },
    [dimensions],
  );

  /** Nodes and edges */
  const [graphData, setGraphData] = useState<GraphData>({
    nodes: [],
    edges: [],
  });
  const onNodePositionUpdate = useCallback(
    (nodeId: string, { x, y }: Vec2) => {
      setGraphData({
        ...graphData,
        nodes: graphData.nodes.map((node) =>
          node.id === nodeId ? { ...node, x, y } : node,
        ),
      });
    },
    [setGraphData, graphData],
  );

  const dragging = useSvgChildDragging({
    svgRef,
    getAutoPanVelocity,
    panning,
    scale,
    onPositionUpdate: onNodePositionUpdate,
  });

  const [topNodeId, setTopNodeId] = useState<string | null>(null);

  const handleNodeMouseDown = useCallback(
    (nodeId: string, event: React.MouseEvent) => {
      dragging.handleChildMouseDown(nodeId, event);
      setTopNodeId(nodeId);
    },
    [dragging, setTopNodeId],
  );

  const nodeLookupMap = useMemo(() => {
    const lookupMap = new Map<string, GraphNode>();
    for (const node of graphData.nodes) {
      lookupMap.set(node.id, node);
    }
    return lookupMap;
  }, [graphData]);

  // Update graph data when value changes
  useEffect(() => {
    const data = objectToGraph(value, (value) => {
      const waxClass = WaxClass.forJsObject(value);
      return LEAF_CLASSES.includes(waxClass);
    });
    const data2 = fireworksLayout(data, dimensions.width, dimensions.height);
    const data3 = forceDirectedLayout(data2);
    setGraphData(data3);
  }, [value, dimensions]);

  // Select nodes that are visible given the current zoom and pan state
  const visibleNodes = useMemo(() => {
    return graphData.nodes.filter((node) => {
      const screenX = node.x * scale + panning.translation.x;
      const screenY = node.y * scale + panning.translation.y;
      return (
        screenX >= -100 &&
        screenX <= dimensions.width + 100 &&
        screenY >= -100 &&
        screenY <= dimensions.height + 100
      );
    });
  }, [graphData, scale, panning, dimensions]);

  // Select edges that connect visible nodes
  const visibleEdges = useMemo(() => {
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
    return graphData.edges.filter(
      (edge) =>
        visibleNodeIds.has(edge.source) || visibleNodeIds.has(edge.target),
    );
  }, [graphData, visibleNodes]);

  // Filter nodes and edges into regular and top layers
  const { regularNodes, topNodes, regularEdges, topEdges } = useMemo(() => {
    if (!topNodeId) {
      return {
        regularNodes: visibleNodes,
        topNodes: [],
        regularEdges: visibleEdges,
        topEdges: [],
      };
    }

    // Get the selected node
    const selectedNode = visibleNodes.find((node) => node.id === topNodeId);
    if (!selectedNode) {
      return {
        regularNodes: visibleNodes,
        topNodes: [],
        regularEdges: visibleEdges,
        topEdges: [],
      };
    }

    // Find all directly connected node IDs
    const connectedNodeIds = new Set<string>([topNodeId]);
    const topEdgeIds = new Set<string>();

    visibleEdges.forEach((edge) => {
      if (edge.source === topNodeId || edge.target === topNodeId) {
        topEdgeIds.add(edge.id);
        // Add the other connected node
        if (edge.source === topNodeId) {
          connectedNodeIds.add(edge.target);
        } else {
          connectedNodeIds.add(edge.source);
        }
      }
    });

    const topNodes = visibleNodes.filter((node) =>
      connectedNodeIds.has(node.id),
    );
    const regularNodes = visibleNodes.filter(
      (node) => !connectedNodeIds.has(node.id),
    );
    const topEdges = visibleEdges.filter((edge) => topEdgeIds.has(edge.id));
    const regularEdges = visibleEdges.filter(
      (edge) => !topEdgeIds.has(edge.id),
    );

    return { regularNodes, topNodes, regularEdges, topEdges };
  }, [visibleNodes, topNodeId]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full border border-gray-300 rounded-lg overflow-hidden relative"
      style={{ backgroundColor: "var(--tw-prose-pre-bg)" }}
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={dragging.handleSvgMouseMove}
        onMouseUp={dragging.handleSvgMouseUp}
        onMouseLeave={dragging.handleSvgMouseLeave}
        className={classNames("select-none", {
          "cursor-grabbing": panning.active,
          "cursor-grab": !panning.active,
        })}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="7"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="context-stroke" />
          </marker>
        </defs>

        <g
          transform={`translate(${panning.translation.x}, ${panning.translation.y}) scale(${scale})`}
        >
          {/* Regular edges (bottom layer) */}
          {regularEdges.map((edge) => (
            <GraphEdgeComponent
              key={edge.id}
              edge={edge}
              nodeLookupMap={nodeLookupMap}
            />
          ))}

          {/* Regular nodes */}
          {regularNodes.map((node) => (
            <GraphNodeComponent
              key={node.id}
              node={node}
              onMouseDown={handleNodeMouseDown}
            />
          ))}

          {/* Top node edges (middle layer) */}
          {topEdges.map((edge) => (
            <GraphEdgeComponent
              key={edge.id}
              edge={edge}
              nodeLookupMap={nodeLookupMap}
              isTop
            />
          ))}

          {/* Top nodes (top layer) */}
          {topNodes.map((node) => (
            <GraphNodeComponent
              key={node.id}
              node={node}
              isTop
              onMouseDown={handleNodeMouseDown}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
