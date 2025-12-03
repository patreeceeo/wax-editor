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
    const result = [];
    for (let i = 0; i < value.length; i++) {
      if (i in value) {
        result.push({ key: i, value: value[i] });
      }
    }
    return result;
  }
  if (isObjectOrArray(value)) {
    return Object.entries(value).map(([key, value]) => ({ key, value }));
  }
  return [];
}

export function getRenderingContextForFont(
  font: string,
): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  context.font = font;
  return context;
}

const _letterWidths: Record<string, number> = {};
let _letterWidthsInitialized = false;
function initLetterWidths() {
  const font = getComputedStyle(document.body).font || "16px sans-serif";
  const context = getRenderingContextForFont(font);
  const letters =
    "_-.!?<>(){}[] abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
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

/**
 * Transform a JavaScript object into a graph structure (cached)
 */
export function objectToGraph(
  rootValue: any,
  isLeaf: (value: any) => boolean,
): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const visited = new Set<string>();
  const queue: Array<{ value: any; id: string }> = [];

  // Start with root object
  const rootId = getObjectId(rootValue);
  queue.push({ value: rootValue, id: rootId });
  visited.add(rootId);

  while (queue.length > 0) {
    const { value, id } = queue.shift()!;

    // Create node
    nodes.push({
      id,
      value,
      x: 0, // Will be positioned by layout algorithm
      y: 0,
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
          label: key,
        });

        // Add property value to queue if not visited
        if (!visited.has(targetId)) {
          visited.add(targetId);
          queue.push({
            value: propertyValue,
            id: targetId,
          });
        }
      }
    }
  }

  const graphData = { nodes, edges };

  return graphData;
}

/**
 * Assuming the first node is the root, arrange its children around it in a centered circle.
 * For each of those children, arrange their children in a smaller circle around them, and so on.
 *
 * Returns the modified graph data with x,y positions for each node.
 */
export function hierarchicalLayout(
  graphData: GraphData,
  width: number,
  height: number,
): GraphData {
  const startNode = graphData.nodes[0];
  startNode.x = width / 2;
  startNode.y = height / 2;
  layoutNode(
    graphData.nodes[0],
    graphData,
    new Set<string>(),
    300,
    startNode.x,
    startNode.y,
  );
  return graphData;
}

function layoutNode(
  node: GraphNode,
  graphData: GraphData,
  visited: Set<string>,
  radius: number,
  centerX: number,
  centerY: number,
) {
  visited.add(node.id);
  // Find children
  const children = graphData.edges
    .filter((edge) => edge.source === node.id)
    .map((edge) => graphData.nodes.find((n) => n.id === edge.target)!);

  // Radius decreases at each level, but less so with more children
  const newRadius = (radius * Math.log(children.length + 2)) / 2;
  const angleFromCenter = Math.atan2(node.y - centerY, node.x - centerX);

  children
    .filter((child) => !visited.has(child.id))
    .forEach((child, index) => {
      // Arrange around the parent but oriented away from center
      const angle =
        angleFromCenter + (index / children.length) * Math.PI - Math.PI / 2;
      child.x = node.x + newRadius * Math.cos(angle);
      child.y = node.y + newRadius * Math.sin(angle);
      // Recursively layout child's children
      layoutNode(child, graphData, visited, newRadius, centerX, centerY);
    });
}

/**
 * Calculate intersection point of a line with a rectangle
 * Returns the point where the line from (x1, y1) to (x2, y2) intersects the rectangle bounds
 */
export function getLineRectangleIntersection(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  rectX: number,
  rectY: number,
  rectWidth: number,
  rectHeight: number,
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
