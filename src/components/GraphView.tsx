import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { arrayClass, jsObjectClass, WaxClass } from '../wax_classes';
import { isObjectOrArray } from '../utils';
import { getObjectEntries, getObjectId, getTextWidth } from './shared/DataVisualizationUtils';

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

// Cache for graph data transformation to avoid recomputation
const graphDataCache = new Map<string, GraphData>();
const graphDataWeakCache = new WeakMap<object, GraphData>();

/**
 * Transform a JavaScript object into a graph structure (cached)
 */
function objectToGraph(rootValue: any): GraphData {
  // Check cache first - handle both primitives and objects
  let cachedData: GraphData | undefined;

  if (isObjectOrArray(rootValue)) {
    cachedData = graphDataWeakCache.get(rootValue);
  } else {
    const cacheKey = `${typeof rootValue}:${rootValue}`;
    cachedData = graphDataCache.get(cacheKey);
  }

  if (cachedData) {
    return cachedData;
  }

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

    const waxClass = WaxClass.forJsObject(value);

    // Create node
    nodes.push({
      id,
      value,
      waxClass,
      x: 0, // Will be positioned by layout algorithm
      y: 0,
      level
    });

    // Process properties for objects and arrays
    if (waxClass === jsObjectClass || waxClass === arrayClass) {
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

  const graphData = { nodes, edges };

  // Cache based on value type
  if (isObjectOrArray(rootValue)) {
    graphDataWeakCache.set(rootValue, graphData);
  } else {
    const cacheKey = `${typeof rootValue}:${rootValue}`;
    graphDataCache.set(cacheKey, graphData);
  }

  return graphData;
}

/**
 * Simple circular layout algorithm
 */
function hierarchicalLayout(graphData: GraphData, width: number, height: number): GraphData {
  const centerX = width / 2;
  const centerY = height / 2;
  const nodesByLevel = new Map<number, GraphNode[]>();

  // Group nodes by level
  for (const node of graphData.nodes) {
    if (!nodesByLevel.has(node.level)) {
      nodesByLevel.set(node.level, []);
    }
    nodesByLevel.get(node.level)!.push(node);
  }

  const numberOfLevels = nodesByLevel.size;

  // Position nodes
  const positionedNodes = graphData.nodes.map(node => {
    const nodesInLevel = nodesByLevel.get(node.level)!;
    const levelIndex = nodesInLevel.indexOf(node);

    if (node.level === 0) {
      // Root node at center
      return {
        ...node,
        x: centerX,
        y: centerY
      };
    }

    // Simple radius calculation - 100px per level
    const radius = node.level * 100;

    // Even distribution around circle
    const angleStep = (2 * Math.PI) / nodesInLevel.length;
    const angle = node.level * (2 * Math.PI / numberOfLevels) + levelIndex * angleStep;

    return {
      ...node,
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });

  return { ...graphData, nodes: positionedNodes };
}

/**
 * Auto-sizing node component that measures its content
 */
const AutoSizingNode = React.memo(({
  node,
  renderedValue
}: {
  node: GraphNode;
  renderedValue: React.ReactElement | null;
}) => {
  const [contentSize, setContentSize] = useState({ width: 60, height: 30 });
  const contentRef = useRef<HTMLDivElement>(null);
  const foreignObjectRef = useRef<SVGForeignObjectElement>(null);

  // Measure actual content size after render
  useLayoutEffect(() => {
    if (contentRef.current) {
      const { offsetWidth, offsetHeight } = contentRef.current;
      setContentSize({
        width: Math.max(60, offsetWidth), // 16px padding
        height: Math.max(30, offsetHeight) // 8px padding
      });
    }
  }, [renderedValue]);

  const cornerRadius = 6;

  const x = -Math.min(20, contentSize.width) / 2;
  const y = -Math.min(20, contentSize.height) / 2;

  return (
    <g transform={`translate(${node.x}, ${node.y})`}>
      {/* Background rectangle that auto-sizes to content */}
      <rect
        x={x}
        y={y}
        width={contentSize.width}
        height={contentSize.height}
        rx={cornerRadius}
        ry={cornerRadius}
        fill="var(--tw-prose-pre-bg)"
        stroke="oklch(0.623 0.214 259.815)"
        strokeWidth={2}
      />
      {/* Foreign object that contains the HTML content */}
      <foreignObject
        ref={foreignObjectRef}
        x={x}
        y={y}
        width={contentSize.width}
        height={contentSize.height}
        className="pointer-events-none text-center"
      >
        <div
          ref={contentRef}
          className="inline-block"
        >
          {renderedValue}
        </div>
      </foreignObject>
    </g>
  );
});

AutoSizingNode.displayName = 'AutoSizingNode';

/**
 * Memoized individual graph node component
 */
const GraphNodeComponent = React.memo(({ node }: { node: GraphNode }) => {
  if (node.waxClass === jsObjectClass) {
    // For plain ol' JS objects, use a simple circle
    return (
      <g transform={`translate(${node.x}, ${node.y})`}>
        <circle
          r={10}
          fill="oklch(0.551 0.027 264.364)"
          stroke="oklch(0.551 0.027 264.364)"
          strokeWidth={2}
        />
      </g>
    );
  }
  if (node.waxClass === arrayClass) {
    // For plain ol' JS objects, use a simple circle
    return (
      <g transform={`translate(${node.x - 10}, ${node.y - 10})`}>
        <rect
          width={20}
          height={20}
          rx={4}
          ry={4}
          fill="oklch(0.551 0.027 264.364)"
          stroke="oklch(0.551 0.027 264.364)"
          strokeWidth={2}
        />
      </g>
    );
  }
  // Memoize the rendered value from WaxClass
  const renderedValue = useMemo(() => {
    return node.waxClass.renderReact(node.value);
  }, [node.value, node.waxClass]);


  // For primitive values, use auto-sizing node
  return <AutoSizingNode node={node} renderedValue={renderedValue} />;
});

GraphNodeComponent.displayName = 'GraphNodeComponent';

/**
 * Memoized individual graph edge component
 */
const GraphEdgeComponent = React.memo(({ edge, nodeLookupMap }: { edge: GraphEdge; nodeLookupMap: Map<string, GraphNode> }) => {
  const sourceNode = nodeLookupMap.get(edge.source);
  const targetNode = nodeLookupMap.get(edge.target);

  if (!sourceNode || !targetNode) return null;

  // Calculate edge properties
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const angle = Math.atan2(dy, dx);
  const midX = (sourceNode.x + targetNode.x) / 2;
  const midY = (sourceNode.y + targetNode.y) / 2;
  const text = String(edge.label);
  const rectWidth = getTextWidth(text, 12) + 4;
  const recHeight = 4;

  // Adjust angle to ensure text is always readable (not upside-down)
  let adjustedAngle = angle;
  if (Math.abs(angle) > Math.PI / 2) {
    adjustedAngle = angle + Math.PI; // Rotate 180 degrees if angle is > 90 degrees or < -90 degrees
  }

  // Convert adjusted angle to degrees for rotation
  const angleDegrees = (adjustedAngle * 180) / Math.PI;

  return (
    <g>
      <line
        x1={sourceNode.x}
        y1={sourceNode.y}
        x2={targetNode.x}
        y2={targetNode.y}
        stroke="rgb(4, 120, 87)"
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
      />
      {/* Edge label with rotation */}
      <rect
        transform={`rotate(${angleDegrees} ${midX} ${midY})`}
        x={midX - rectWidth / 2}
        y={midY - recHeight / 2}
        fill="var(--tw-prose-pre-bg)"
        width={rectWidth}
        height={recHeight}
      />
      <text
        transform={`rotate(${angleDegrees} ${midX} ${midY})`}
        x={midX}
        y={midY}
        fontSize={12}
        fill="rgb(217, 119, 6)"
        textAnchor="middle"
        dominantBaseline="middle"
        className="pointer-events-none"
      >
        {text}
      </text>
    </g>
  );
});

GraphEdgeComponent.displayName = 'GraphEdgeComponent';

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

  // Transform object to graph structure and create lookup map
  const { graphData, nodeLookupMap } = useMemo(() => {
    const data = objectToGraph(value);
    const layoutData = hierarchicalLayout(data, dimensions.width, dimensions.height);

    // Create node lookup map for O(1) access
    const lookupMap = new Map<string, GraphNode>();
    for (const node of layoutData.nodes) {
      lookupMap.set(node.id, node);
    }

    return { graphData: layoutData, nodeLookupMap: lookupMap };
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
      style={{backgroundColor: 'var(--tw-prose-pre-bg)'}}
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
            refX="15"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="rgb(4, 120, 87)"
            />
          </marker>
        </defs>

        <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
          {/* Render edges first (behind nodes) */}
          {graphData.edges.map(edge => (
            <GraphEdgeComponent key={edge.id} edge={edge} nodeLookupMap={nodeLookupMap} />
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
