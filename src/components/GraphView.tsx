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

// Cache for graph data transformation to avoid recomputation
const graphDataCache = new WeakMap<any, GraphData>();

/**
 * Transform a JavaScript object into a graph structure (cached)
 */
function objectToGraph(rootValue: any): GraphData {
  // Check cache first
  if (graphDataCache.has(rootValue)) {
    return graphDataCache.get(rootValue)!;
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

  const graphData = { nodes, edges };
  graphDataCache.set(rootValue, graphData);
  return graphData;
}

// Cache for layout calculations to avoid recomputation
const layoutCache = new Map<string, GraphData>();

/**
 * Simple hierarchical layout algorithm (cached)
 */
function hierarchicalLayout(graphData: GraphData, width: number, height: number): GraphData {
  // Create cache key based on graph structure and dimensions
  const nodeIds = graphData.nodes.map(n => n.id).sort().join(',');
  const edgeIds = graphData.edges.map(e => e.id).sort().join(',');
  const cacheKey = `${nodeIds}|${edgeIds}|${width}x${height}`;

  if (layoutCache.has(cacheKey)) {
    return layoutCache.get(cacheKey)!;
  }

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

  const result = { ...graphData, nodes: positionedNodes };
  layoutCache.set(cacheKey, result);

  // Limit cache size to prevent memory leaks
  if (layoutCache.size > 50) {
    const firstKey = layoutCache.keys().next().value;
    layoutCache.delete(firstKey);
  }

  return result;
}

// Cache for text width measurements to avoid repeated DOM operations
const textWidthCache = new Map<string, number>();

// Cache for WaxClass renderReact results
const renderCache = new Map<string, React.ReactElement>();

/**
 * Fast text width measurement using cached results
 */
function measureTextWidth(text: string): number {
  if (textWidthCache.has(text)) {
    return textWidthCache.get(text)!;
  }

  // Approximate text width calculation (faster than DOM measurement)
  // This is a rough estimate but much faster than DOM manipulation
  const avgCharWidth = 7; // Average character width for monospace-ish rendering
  const measuredWidth = Math.min(Math.max(text.length * avgCharWidth + 20, 60), 200);

  textWidthCache.set(text, measuredWidth);
  return measuredWidth;
}

/**
 * Memoized WaxClass renderReact function
 */
function getMemoizedRenderedValue(value: any, waxClass: WaxClass): React.ReactElement {
  // Create cache key based on value type and actual value
  const valueKey = `${waxClass.displayName}:${typeof value}:${String(value)}`;

  if (renderCache.has(valueKey)) {
    return renderCache.get(valueKey)!;
  }

  const rendered = waxClass.renderReact(value);
  renderCache.set(valueKey, rendered);

  // Limit cache size to prevent memory leaks
  if (renderCache.size > 100) {
    const firstKey = renderCache.keys().next().value;
    renderCache.delete(firstKey);
  }

  return rendered;
}

/**
 * Memoized individual graph node component
 */
const GraphNodeComponent = React.memo(({ node }: { node: GraphNode }) => {
  // Pre-calculate text width without DOM measurement
  const textWidth = useMemo(() => {
    if (!isJsPrimitive(node.value)) return 60;
    return measureTextWidth(String(node.value));
  }, [node.value]);

  // Memoize the rendered value from WaxClass
  const renderedValue = useMemo(() => {
    if (!isJsPrimitive(node.value)) return null;
    return getMemoizedRenderedValue(node.value, node.waxClass);
  }, [node.value, node.waxClass]);

  if (!isJsPrimitive(node.value)) {
    // For non-primitive objects, use a simple circle
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
        fill="var(--tw-prose-pre-bg)"
        stroke="oklch(0.623 0.214 259.815)"
        strokeWidth={2}
      />
      {/* Foreign object for WaxClass content */}
      <foreignObject
        x={-rectWidth / 2}
        y={-rectHeight / 2}
        width={rectWidth}
        height={rectHeight}
        className="pointer-events-none"
      >
        <div className="text-xs text-center overflow-hidden whitespace-nowrap flex items-center justify-center h-full">
          {renderedValue}
        </div>
      </foreignObject>
    </g>
  );
});

GraphNodeComponent.displayName = 'GraphNodeComponent';

/**
 * Memoized individual graph edge component
 */
const GraphEdgeComponent = React.memo(({ edge, nodes }: { edge: GraphEdge; nodes: GraphNode[] }) => {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) return null;

  // Calculate edge properties
  const dx = targetNode.x - sourceNode.x;
  const dy = targetNode.y - sourceNode.y;
  const angle = Math.atan2(dy, dx);
  const midX = (sourceNode.x + targetNode.x) / 2;
  const midY = (sourceNode.y + targetNode.y) / 2;

  // Calculate perpendicular offset for label positioning (above and to the left)
  const perpendicularAngle = angle + Math.PI / 2; // 90 degrees perpendicular
  const offsetDistance = 15; // Distance from the edge line
  const labelX = midX + Math.cos(perpendicularAngle) * offsetDistance;
  const labelY = midY + Math.sin(perpendicularAngle) * offsetDistance;

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
      <text
        x={labelX}
        y={labelY}
        fontSize={12}
        fill="rgb(217, 119, 6)"
        textAnchor="middle"
        dominantBaseline="middle"
        transform={`rotate(${angleDegrees} ${labelX} ${labelY})`}
        className="pointer-events-none"
      >
        {String(edge.label)}
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
