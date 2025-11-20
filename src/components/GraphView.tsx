import React, { useMemo, useRef, useState } from 'react';
import { WaxClass } from '../wax_classes';
import { isObjectOrArray } from '../utils';
import { getObjectEntries, getObjectId } from './shared/DataVisualizationUtils';

export interface GraphNode {
  id: string;
  value: any;
  waxClass: WaxClass;
  x: number;
  y: number;
  level: number; // Hierarchical level for layout
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string | number; // Property name or array index
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface GraphViewProps {
  value: any;
  width?: number;
  height?: number;
}

/**
 * Transform a JavaScript object into a graph structure
 */
function objectToGraph(rootValue: any): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const visited = new Set<string>();
  const queue: Array<{ value: any; id: string; level: number }> = [];

  // Start with root object
  const rootId = getObjectId(rootValue);
  queue.push({ value: rootValue, id: rootId, level: 0 });
  visited.add(rootId);

  while (queue.length > 0) {
    const { value, id, level } = queue.shift()!;

    // Create node
    nodes.push({
      id,
      value,
      waxClass: WaxClass.forJsObject(value),
      x: 0, // Will be positioned by layout algorithm
      y: 0,
      level
    });

    // Process properties for objects and arrays
    if (isObjectOrArray(value)) {
      const entries = getObjectEntries(value);

      for (const { key, value: propertyValue } of entries) {
        const targetId = getObjectId(propertyValue);

        // Create edge
        edges.push({
          id: `${id}-${targetId}-${key}`,
          source: id,
          target: targetId,
          label: key
        });

        // Add property value to queue if not visited
        if (!visited.has(targetId)) {
          visited.add(targetId);
          queue.push({
            value: propertyValue,
            id: targetId,
            level: level + 1
          });
        }
      }
    }
  }

  return { nodes, edges };
}

/**
 * Simple hierarchical layout algorithm
 */
function hierarchicalLayout(graphData: GraphData, width: number, height: number): GraphData {
  const levelHeight = height / 6; // Max 6 levels
  const nodesByLevel = new Map<number, GraphNode[]>();

  // Group nodes by level
  for (const node of graphData.nodes) {
    if (!nodesByLevel.has(node.level)) {
      nodesByLevel.set(node.level, []);
    }
    nodesByLevel.get(node.level)!.push(node);
  }

  // Position nodes
  const positionedNodes = graphData.nodes.map(node => {
    const nodesInLevel = nodesByLevel.get(node.level)!;
    const levelIndex = nodesInLevel.indexOf(node);
    const levelWidth = width / (nodesInLevel.length + 1);

    return {
      ...node,
      x: levelWidth * (levelIndex + 1),
      y: 50 + node.level * levelHeight
    };
  });

  return { ...graphData, nodes: positionedNodes };
}

/**
 * Individual graph node component
 */
function GraphNodeComponent({ node }: { node: GraphNode }) {
  const NodeContent = node.waxClass.renderReact(node.value);

  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      {/* Background circle for node */}
      <circle
        r={20}
        fill="white"
        stroke="#94a3b8"
        strokeWidth={2}
        className="cursor-pointer"
      />
      {/* Foreign object for WaxClass content */}
      <foreignObject
        x={-30}
        y={-10}
        width={60}
        height={20}
        className="pointer-events-none"
      >
        <div className="text-xs text-center overflow-hidden whitespace-nowrap">
          {NodeContent}
        </div>
      </foreignObject>
    </g>
  );
}

/**
 * Individual graph edge component
 */
function GraphEdgeComponent({ edge, nodes }: { edge: GraphEdge; nodes: GraphNode[] }) {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) return null;

  return (
    <g>
      <line
        x1={sourceNode.x}
        y1={sourceNode.y}
        x2={targetNode.x}
        y2={targetNode.y}
        stroke="#cbd5e1"
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
      />
      {/* Edge label */}
      <text
        x={(sourceNode.x + targetNode.x) / 2}
        y={(sourceNode.y + targetNode.y) / 2}
        fontSize={12}
        fill="#64748b"
        textAnchor="middle"
        className="pointer-events-none"
      >
        {String(edge.label)}
      </text>
    </g>
  );
}

/**
 * Main GraphView component
 */
export function GraphView({ value, width = 800, height = 600 }: GraphViewProps) {
  const [scale, setScale] = useState(1);
  const [translateX] = useState(0);
  const [translateY] = useState(0);
  const svgRef = useRef<SVGSVGElement>(null);

  // Transform object to graph structure
  const graphData = useMemo(() => {
    const data = objectToGraph(value);
    return hierarchicalLayout(data, width, height);
  }, [value, width, height]);

  // Handle pan/zoom
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.1, Math.min(5, prev * delta)));
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        onWheel={handleWheel}
        className="cursor-move"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="20"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#cbd5e1"
            />
          </marker>
        </defs>

        <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
          {/* Render edges first (behind nodes) */}
          {graphData.edges.map(edge => (
            <GraphEdgeComponent key={edge.id} edge={edge} nodes={graphData.nodes} />
          ))}

          {/* Render nodes */}
          {graphData.nodes.map(node => (
            <GraphNodeComponent key={node.id} node={node} />
          ))}
        </g>
      </svg>
    </div>
  );
}