import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { falseClass, nilClass, numberClass, procedureClass, stringClass, trueClass, WaxClass } from '../wax_classes';
import { getObjectId, isObjectOrArray } from '../utils';
import { getObjectEntries, getTextWidth } from './shared/DataVisualizationUtils';

export interface GraphNode {
  id: string;
  value: any;
  waxClass: WaxClass<any>;
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

const LEAF_CLASSES = [stringClass, numberClass, trueClass, falseClass, nilClass, procedureClass];

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

    // If not a leaf node, enqueue its properties
    if (!LEAF_CLASSES.includes(waxClass)) {
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
 * Memoized individual graph node component
 */
const GraphNodeComponent = React.memo(({ node, onClick, isTop = false }: { node: GraphNode; onClick?: () => void; isTop?: boolean }) => {
  const text = WaxClass.isValueClass(node.waxClass)
    ? node.waxClass.stringify(node.value)
    : `${node.waxClass.displayName} #${getObjectId(node.value)}`

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <TextRect
        x={node.x}
        y={node.y}
        padding={8}
        text={text}
        rectFill="var(--tw-prose-pre-bg)"
        rectStroke={isTop ? "white" : "rgb(4, 120, 87)"}
        textFill={node.waxClass.displayColor}
      />
    </g>
  )
});

GraphNodeComponent.displayName = 'GraphNodeComponent';

/**
 * Memoized individual graph edge component
 */
const GraphEdgeComponent = React.memo(({ edge, nodeLookupMap, isTop = false}: { edge: GraphEdge; nodeLookupMap: Map<string, GraphNode>, isTop?: boolean}) => {
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
        stroke={isTop ? "white" : "rgb(4, 120, 87)"}
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
      />
      {/* Edge label with rotation */}
      <TextRect
        x={midX}
        y={midY}
        text={text}
        transform={`rotate(${angleDegrees} ${midX} ${midY})`}
        rectFill="var(--tw-prose-pre-bg)"
        rectStroke="none"
        textFill="rgb(217, 119, 6)"
      />
    </g>
  );
});

GraphEdgeComponent.displayName = 'GraphEdgeComponent';


interface TextRectProps {
  x: number;
  y: number;
  text: string;
  transform?: string;
  rectFill: string;
  rectStroke: string;
  textFill: string;
  padding?: number;
}
const TextRect = ({ x, y, text, transform, rectFill, rectStroke, textFill, padding = 0 }: TextRectProps) => {
  const rectWidth = getTextWidth(text, 12) + padding * 2;
  const rectHeight = 16 + padding * 2;
  return (
    <>
      <rect
        transform={transform}
        x={x - rectWidth / 2}
        y={y - rectHeight / 2}
        width={rectWidth}
        height={rectHeight}
        fill={rectFill}
        stroke={rectStroke}
        strokeWidth={2}
        rx={6}
        ry={6}
      />
      <text
        transform={transform}
        x={x}
        y={y}
        fontSize={12}
        fill={textFill}
        textAnchor="middle"
        dominantBaseline="middle"
        className="pointer-events-none"
      >
        {text}
      </text>
    </>
  )
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
  const [topNodeId, setTopNodeId] = useState<string | null>(null);
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

  // Filter nodes and edges into regular and top layers
  const { regularNodes, topNodes, regularEdges, topEdges } = useMemo(() => {
    if (!topNodeId) {
      return {
        regularNodes: graphData.nodes,
        topNodes: [],
        regularEdges: graphData.edges,
        topEdges: []
      };
    }

    // Get the selected node
    const selectedNode = graphData.nodes.find(node => node.id === topNodeId);
    if (!selectedNode) {
      return {
        regularNodes: graphData.nodes,
        topNodes: [],
        regularEdges: graphData.edges,
        topEdges: []
      };
    }

    // Find all directly connected node IDs
    const connectedNodeIds = new Set<string>([topNodeId]);
    const topEdgeIds = new Set<string>();

    graphData.edges.forEach(edge => {
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

    const topNodes = graphData.nodes.filter(node => connectedNodeIds.has(node.id));
    const regularNodes = graphData.nodes.filter(node => !connectedNodeIds.has(node.id));
    const topEdges = graphData.edges.filter(edge => topEdgeIds.has(edge.id));
    const regularEdges = graphData.edges.filter(edge => !topEdgeIds.has(edge.id));

    return { regularNodes, topNodes, regularEdges, topEdges };
  }, [graphData, topNodeId]);

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
              fill="context-stroke"
            />
          </marker>
        </defs>

        <g transform={`translate(${translateX}, ${translateY}) scale(${scale})`}>
          {/* Regular edges (bottom layer) */}
          {regularEdges.map(edge => (
            <GraphEdgeComponent key={edge.id} edge={edge} nodeLookupMap={nodeLookupMap} />
          ))}

          {/* Regular nodes */}
          {regularNodes.map(node => (
            <GraphNodeComponent
              key={node.id}
              node={node}
              onClick={() => setTopNodeId(node.id)}
            />
          ))}

          {/* Top node edges (middle layer) */}
          {topEdges.map(edge => (
            <GraphEdgeComponent key={edge.id} edge={edge} nodeLookupMap={nodeLookupMap} isTop />
          ))}

          {/* Top nodes (top layer) */}
          {topNodes.map(node => (
            <GraphNodeComponent
              key={node.id}
              node={node}
              onClick={() => setTopNodeId(node.id === topNodeId ? null : node.id)}
              isTop
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
