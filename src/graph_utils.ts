import { isObjectOrArray, isArray, getObjectId } from "./utils";

/**
 * Shared utilities for data visualization components
 */

export interface ObjectEntry {
  key: string | number;
  value: any;
}

/**
 * Extract entries from objects and arrays in a consistent format
 */
export function getObjectEntries(value: any): ObjectEntry[] {
  if (isArray(value)) {
    return value.map((value, index) => ({ key: index, value }));
  }
  if (isObjectOrArray(value)) {
    return Object.entries(value).map(([key, value]) => ({ key, value }));
  }
  return [];
}

export function getRenderingContextForFont(font: string): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  context.font = font;
  return context;
}

const _letterWidths: Record<string, number> = {}
let _letterWidthsInitialized = false;
function initLetterWidths() {
  const font = getComputedStyle(document.body).font || '16px sans-serif';
  const context = getRenderingContextForFont(font);
  const letters = '_-.!?<>(){}[] abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  for (const letter of letters) {
    const metrics = context.measureText(letter);
    _letterWidths[letter] = metrics.width;
  }
  _letterWidthsInitialized = true;
}

export function getTextWidth(text: string, size: number): number {
  if (!_letterWidthsInitialized) {
    initLetterWidths();
  }
  let width = 0;
  for (const char of text) {
    width += _letterWidths[char] || 8; // Default width for unknown chars
  }
  return width * (size / 16);
}

export interface GraphNode {
  id: string;
  value: any;
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

// Cache for graph data transformation to avoid recomputation
const graphDataCache = new Map<string, GraphData>();
const graphDataWeakCache = new WeakMap<object, GraphData>();

/**
 * Transform a JavaScript object into a graph structure (cached)
 */
export function objectToGraph(rootValue: any, isLeaf: (value: any) => boolean): GraphData {
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

    // Create node
    nodes.push({
      id,
      value,
      x: 0, // Will be positioned by layout algorithm
      y: 0,
      level
    });

    // If not a leaf node, enqueue its properties
    if (!isLeaf(value)) {
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
export function hierarchicalLayout(graphData: GraphData, width: number, height: number): GraphData {
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
 * Calculate intersection point of a line with a rectangle
 * Returns the point where the line from (x1, y1) to (x2, y2) intersects the rectangle bounds
 */
export function getLineRectangleIntersection(
  x1: number, y1: number,
  x2: number, y2: number,
  rectX: number, rectY: number,
  rectWidth: number, rectHeight: number
): { x: number; y: number } {
  // Calculate rectangle boundaries
  const rectLeft = rectX - rectWidth / 2;
  const rectRight = rectX + rectWidth / 2;
  const rectTop = rectY - rectHeight / 2;
  const rectBottom = rectY + rectHeight / 2;

  // Direction vector
  const dx = x2 - x1;
  const dy = y2 - y1;

  // Check intersections with each edge of the rectangle
  const intersections: { x: number; y: number; t: number }[] = [];

  // Left edge (x = rectLeft)
  if (dx !== 0) {
    const t = (rectLeft - x1) / dx;
    if (t >= 0 && t <= 1) {
      const y = y1 + t * dy;
      if (y >= rectTop && y <= rectBottom) {
        intersections.push({ x: rectLeft, y, t });
      }
    }
  }

  // Right edge (x = rectRight)
  if (dx !== 0) {
    const t = (rectRight - x1) / dx;
    if (t >= 0 && t <= 1) {
      const y = y1 + t * dy;
      if (y >= rectTop && y <= rectBottom) {
        intersections.push({ x: rectRight, y, t });
      }
    }
  }

  // Top edge (y = rectTop)
  if (dy !== 0) {
    const t = (rectTop - y1) / dy;
    if (t >= 0 && t <= 1) {
      const x = x1 + t * dx;
      if (x >= rectLeft && x <= rectRight) {
        intersections.push({ x, y: rectTop, t });
      }
    }
  }

  // Bottom edge (y = rectBottom)
  if (dy !== 0) {
    const t = (rectBottom - y1) / dy;
    if (t >= 0 && t <= 1) {
      const x = x1 + t * dx;
      if (x >= rectLeft && x <= rectRight) {
        intersections.push({ x, y: rectBottom, t });
      }
    }
  }

  // Return the intersection with the smallest t (closest to the start point)
  if (intersections.length === 0) {
    // Fallback: return the target point if no intersection found
    return { x: x2, y: y2 };
  }

  intersections.sort((a, b) => a.t - b.t);
  return { x: intersections[0].x, y: intersections[0].y };
}

export function getTextDimensions(text: string, padding: number = 0) {
  const width = getTextWidth(text, 12) + padding * 2;
  const height = 16 + padding * 2;
  return { width, height };
}

export function calculateEdgeTextAngle(dx: number, dy: number): number {
  const angle = Math.atan2(dy, dx);
  // Adjust angle to ensure text is always readable (not upside-down)
  let adjustedAngle = angle;
  if (Math.abs(angle) > Math.PI / 2) {
    adjustedAngle = angle + Math.PI; // Rotate 180 degrees if angle is > 90 degrees or < -90 degrees
  }
  // Convert adjusted angle to degrees for rotation
  return (adjustedAngle * 180) / Math.PI;
}
