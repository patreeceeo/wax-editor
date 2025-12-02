import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { falseClass, nilClass, numberClass, procedureClass, stringClass, trueClass, WaxClass } from '../wax_classes';
import { friction, getObjectId, isObjectOrArray } from '../utils';
import { getObjectEntries, getTextDimensions, getLineRectangleIntersection } from './shared/DataVisualizationUtils';
import classNames from 'classnames';
import {useAnimation, useElementSize, useEventListener, usePanning } from '../react_hooks';
import {screenToGraphSpace} from '../dom_utils';
import {Vec2} from '../vec2';

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

const DRAG_NODE_RESPONSIVENESS = 0.01; // Higher is more responsive
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
    // Skip nodes that already have positions (were manually moved)
    if (node.x !== 0 || node.y !== 0) {
      return node;
    }

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
const GraphNodeComponent = React.memo(({
  node,
  isTop = false,
  onMouseDown
}: {
  node: GraphNode;
  isTop?: boolean;
  onMouseDown: (nodeId: string, event: React.MouseEvent) => void;
}) => {
  const text = WaxClass.isValueClass(node.waxClass)
    ? node.waxClass.stringify(node.value)
    : `${node.waxClass.displayName} #${getObjectId(node.value)}`

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
        textFill={node.waxClass.displayColor}
      />
    </g>
  )
});

GraphNodeComponent.displayName = 'GraphNodeComponent';

function calculateEdgeTextAngle(dx: number, dy: number): number {
  const angle = Math.atan2(dy, dx);
  // Adjust angle to ensure text is always readable (not upside-down)
  let adjustedAngle = angle;
  if (Math.abs(angle) > Math.PI / 2) {
    adjustedAngle = angle + Math.PI; // Rotate 180 degrees if angle is > 90 degrees or < -90 degrees
  }
  // Convert adjusted angle to degrees for rotation
  return (adjustedAngle * 180) / Math.PI;
}

/**
 * Memoized individual graph edge component
 */
const GraphEdgeComponent = React.memo(({ edge, nodeLookupMap, isTop = false}: { edge: GraphEdge; nodeLookupMap: Map<string, GraphNode>, isTop?: boolean}) => {
  const sourceNode = nodeLookupMap.get(edge.source);
  const targetNode = nodeLookupMap.get(edge.target);

  if (!sourceNode || !targetNode) return null;

  // Calculate target node dimensions
  const targetText = WaxClass.isValueClass(targetNode.waxClass)
    ? targetNode.waxClass.stringify(targetNode.value)
    : `${targetNode.waxClass.displayName} #${getObjectId(targetNode.value)}`;

  const targetDimensions = getTextDimensions(targetText, 12);

  // Calculate where the line should intersect with target node rectangle
  const intersection = getLineRectangleIntersection(
    sourceNode.x, sourceNode.y,
    targetNode.x, targetNode.y,
    targetNode.x, targetNode.y,
    targetDimensions.width, targetDimensions.height
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
  const { width: rectWidth, height: rectHeight } = getTextDimensions(text, padding);
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
  const [containerRef, dimensions] = useElementSize<HTMLDivElement>(4/3);
  const [scale, setScale] = useState(1);
  const svgRef = useEventListener<SVGSVGElement, "wheel">("wheel", (event) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? 0.9 : 1.1;
      setScale(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, { passive: false });

  /** Panning */
  const panning = usePanning(svgRef)
  const getAutoPanVelocity = useCallback((element: SVGSVGElement, event: React.MouseEvent) => {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const edgeThreshold = Math.min(dimensions.width, dimensions.height) * 0.2;
    const vel = new Vec2(0, 0);

    if (x < edgeThreshold) {
      const distance = edgeThreshold - x;
      vel.x = (distance ** 2) / 200;
    } else if (x > rect.width - edgeThreshold) {
      const distance = x - (rect.width - edgeThreshold);
      vel.x = -(distance ** 2) / 200;
    }

    if (y < edgeThreshold) {
      const distance = edgeThreshold - y;
      vel.y = (distance ** 2) / 200;
    } else if (y > rect.height - edgeThreshold) {
      const distance = y - (rect.height - edgeThreshold);
      vel.y = -(distance ** 2) / 200;
    }

    return vel;
  }, [dimensions]);

  const [topNodeId, setTopNodeId] = useState<string | null>(null);
  const [isDraggingNode, setIsDraggingNode] = useState<string | null>(null);
  const [nodeDragOffset, setNodeDragOffset] = useState({ x: 0, y: 0 });
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], edges: [] });
  const draggedNodeVelocityRef = useRef<{ nodeId: string | null; x: number; y: number }>({ nodeId: null, x: 0, y: 0 });

  // Create node lookup map from graph data
  const nodeLookupMap = useMemo(() => {
    const lookupMap = new Map<string, GraphNode>();
    for (const node of graphData.nodes) {
      lookupMap.set(node.id, node);
    }
    return lookupMap;
  }, [graphData]);

  const dragNodeAnimation = useAnimation((deltaTime) => {
    const { nodeId, x: vx, y: vy } = draggedNodeVelocityRef.current;
    if (nodeId && (vx !== 0 || vy !== 0)) {
      setGraphData(prevData => ({
        ...prevData,
        nodes: prevData.nodes.map(node =>
          node.id === nodeId
            ? { ...node, x: node.x + vx * deltaTime, y: node.y + vy * deltaTime }
            : node
        )
      }));
      draggedNodeVelocityRef.current.x = friction(draggedNodeVelocityRef.current.x, 0.01, deltaTime);
      draggedNodeVelocityRef.current.y = friction(draggedNodeVelocityRef.current.y, 0.01, deltaTime);
    }
  });

  // Update graph data when value changes
  useEffect(() => {
    const data = objectToGraph(value);
    const layoutData = hierarchicalLayout(data, dimensions.width, dimensions.height);
    setGraphData(layoutData);
  }, [value, dimensions]);

  // Select nodes that are visible given the current zoom and pan state
  const visibleNodes = useMemo(() => {
    return graphData.nodes.filter(node => {
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
    const visibleNodeIds = new Set(visibleNodes.map(node => node.id));
    return graphData.edges.filter(edge =>
      visibleNodeIds.has(edge.source) || visibleNodeIds.has(edge.target)
    );
  }, [graphData, visibleNodes]);

  // Filter nodes and edges into regular and top layers
  const { regularNodes, topNodes, regularEdges, topEdges } = useMemo(() => {
    if (!topNodeId) {
      return {
        regularNodes: visibleNodes,
        topNodes: [],
        regularEdges: visibleEdges,
        topEdges: []
      };
    }

    // Get the selected node
    const selectedNode = visibleNodes.find(node => node.id === topNodeId);
    if (!selectedNode) {
      return {
        regularNodes: visibleNodes,
        topNodes: [],
        regularEdges: visibleEdges,
        topEdges: []
      };
    }

    // Find all directly connected node IDs
    const connectedNodeIds = new Set<string>([topNodeId]);
    const topEdgeIds = new Set<string>();

    visibleEdges.forEach(edge => {
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

    const topNodes = visibleNodes.filter(node => connectedNodeIds.has(node.id));
    const regularNodes = visibleNodes.filter(node => !connectedNodeIds.has(node.id));
    const topEdges = visibleEdges.filter(edge => topEdgeIds.has(edge.id));
    const regularEdges = visibleEdges.filter(edge => !topEdgeIds.has(edge.id));

    return { regularNodes, topNodes, regularEdges, topEdges };
  }, [visibleNodes, topNodeId]);

  // Handle mouse move for both pan and node drag
  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDraggingNode) {
      if(!svgRef.current) return;

      // Calculate auto-pan velocity
      const panVelocity = getAutoPanVelocity(svgRef.current, event);
      panning.updateTranslation((vec2) => vec2.add(panVelocity));

      // Convert to graph space and calculate node velocity
      const graphPos = screenToGraphSpace(event.clientX, event.clientY, svgRef.current).subtract(panning.translation).divide(scale);
      const targetX = graphPos.x + nodeDragOffset.x;
      const targetY = graphPos.y + nodeDragOffset.y;

      // Get current node position for responsive velocity calculation
      const currentNode = nodeLookupMap.get(isDraggingNode);
      if (currentNode) {
        draggedNodeVelocityRef.current = {
          nodeId: isDraggingNode,
          x: (targetX - currentNode.x) * DRAG_NODE_RESPONSIVENESS,
          y: (targetY - currentNode.y) * DRAG_NODE_RESPONSIVENESS
        };
        dragNodeAnimation.requestFrame();
      }
    }
  };

  // Stop dragging helper
  const stopDragging = useCallback(() => {
    setIsDraggingNode(null);
    draggedNodeVelocityRef.current = { nodeId: null, x: 0, y: 0 };
    dragNodeAnimation.cancelFrameRequest();
  }, []);

  const handleMouseUp = stopDragging;
  const handleMouseLeave = stopDragging;

  // Handle node drag start
  const handleNodeMouseDown = (nodeId: string, event: React.MouseEvent) => {
    const node = nodeLookupMap.get(nodeId);
    if (!node) return;

    if(!svgRef.current) return;

    const graphPos = screenToGraphSpace(event.clientX, event.clientY, svgRef.current).subtract(panning.translation).divide(scale);
    setIsDraggingNode(nodeId);
    setNodeDragOffset({
      x: node.x - graphPos.x,
      y: node.y - graphPos.y
    });
    setTopNodeId(nodeId);
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
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={classNames("select-none", {
          'cursor-grabbing': panning.active,
          'cursor-grab': !panning.active
        })}
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
            refX="7"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="context-stroke"
            />
          </marker>
        </defs>

        <g transform={`translate(${panning.translation.x}, ${panning.translation.y}) scale(${scale})`}>
          {/* Regular edges (bottom layer) */}
          {regularEdges.map(edge => (
            <GraphEdgeComponent key={edge.id} edge={edge} nodeLookupMap={nodeLookupMap} />
          ))}

          {/* Regular nodes */}
          {regularNodes.map(node => (
            <GraphNodeComponent
              key={node.id}
              node={node}
              onMouseDown={handleNodeMouseDown}
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
              isTop
              onMouseDown={handleNodeMouseDown}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
