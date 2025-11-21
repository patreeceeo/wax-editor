import React, { useMemo, useRef, useState, useEffect } from 'react';
import { WaxClass } from '../wax_classes';
import { isJsPrimitive, isObjectOrArray } from '../utils';
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
  const levelHeight = Math.max(80, height / 6); // Max 6 levels, minimum 80px per level
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
    const levelWidth = Math.max(100, width / (nodesInLevel.length + 1)); // Minimum 100px per node

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
  const nodeRef = React.useRef<HTMLDivElement>(null);
  const [textWidth, setTextWidth] = useState(60);

  // Measure text width and update node size
  useEffect(() => {
    if (nodeRef.current && isJsPrimitive(node.value)) {
      const textElement = nodeRef.current;
      const tempSpan = document.createElement('span');
      tempSpan.style.fontSize = getComputedStyle(textElement).fontSize;
      tempSpan.style.fontFamily = getComputedStyle(textElement).fontFamily;
      tempSpan.textContent = textElement.textContent;
      document.body.appendChild(tempSpan);

      setTextWidth(tempSpan.offsetWidth * 1.2);

      document.body.removeChild(tempSpan);
    }
  }, [node.value]);

  if (!isJsPrimitive(node.value)) {
    // For non-primitive objects, use a simple circle
    return (
      <g transform={`translate(${node.x}, ${node.y})`}>
        <circle
          r={20}
          fill="white"
          stroke="#94a3b8"
          strokeWidth={2}
          className="cursor-pointer"
        />
      </g>
    );
  }

  // For primitive values, use a rectangle with rounded corners
  const rectWidth = textWidth;
  const rectHeight = 30;
  const cornerRadius = 8;

  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      {/* Background rectangle with rounded corners for node */}
      <rect
        x={-rectWidth / 2}
        y={-rectHeight / 2}
        width={rectWidth}
        height={rectHeight}
        rx={cornerRadius}
        ry={cornerRadius}
        fill="white"
        stroke="#94a3b8"
        strokeWidth={2}
        className="cursor-pointer"
      />
      {/* Foreign object for WaxClass content */}
      <foreignObject
        x={-rectWidth / 2}
        y={-rectHeight / 2}
        width={rectWidth}
        height={rectHeight}
        className="pointer-events-none"
      >
        <div
          ref={nodeRef}
          className="text-xs text-center overflow-hidden whitespace-nowrap flex items-center justify-center h-full"
        >
          {node.waxClass.renderReact(node.value)}
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
export function GraphView({ value }: GraphViewProps) {
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Update dimensions when container size changes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({ width: clientWidth, height: clientHeight });
      }
    };

    // Initial measurement
    updateDimensions();

    // Set up resize observer if available
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateDimensions);
      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // Transform object to graph structure
  const graphData = useMemo(() => {
    const data = objectToGraph(value);
    return hierarchicalLayout(data, dimensions.width, dimensions.height);
  }, [value, dimensions]);

  // Add non-passive wheel event listener for zoom
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const handleWheelNonPassive = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.max(0.1, Math.min(5, prev * delta)));
    };

    svgElement.addEventListener('wheel', handleWheelNonPassive, { passive: false });

    return () => {
      svgElement.removeEventListener('wheel', handleWheelNonPassive);
    };
  }, []);

  // Handle pan start
  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
    setDragOffset({ x: translateX, y: translateY });
  };

  // Handle pan move
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;

    setTranslateX(dragOffset.x + deltaX);
    setTranslateY(dragOffset.y + deltaY);
  };

  // Handle pan end
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle mouse leave to stop dragging
  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full border border-gray-300 rounded-lg overflow-hidden relative"
    >
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={isDragging ? "cursor-grabbing" : "cursor-grab"}
        style={{
          width: '100%',
          height: '100%',
          display: 'block'
        }}
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
