import { isObjectOrArray, isArray, getObjectId } from "./utils";

/**
 * Shared utilities for data visualization components
 */

export interface ObjectEntry {
  key: string | number;
  value: any;
}

/** Crude method of simplifying the graph by excluding certain object keys by name */
const excludeKeys = new Set<string>([]);
// const excludeKeys = new Set<string>(["_methodSelector", "refCount", "_returnValues", "pc", "_machine", "_memory", "_running", "_nextVariableId", "id"]);

/**
 * Extract entries from objects and arrays in a consistent format
 */
export function getObjectEntries(value: any): ObjectEntry[] {
  if (isArray(value)) {
    const result = [];
    for (let i = 0; i < value.length; i++) {
      const element = value[i];
      if (i in value && isObjectOrArray(element)) {
        result.push({ key: i, value: element });
      }
    }
    return result;
  }
  if (isObjectOrArray(value)) {
    return Object.entries(value)
      .filter(([key]) => !excludeKeys.has(key))
      .map(([key, value]) => ({ key, value }));
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
 * Configuration options for force-directed graph layout
 */
export interface ForceLayoutConfig {
  /** Number of iterations to run the simulation */
  iterations: number;
  /** Strength of repulsive forces between unconnected nodes */
  repulsionStrength: number;
  /** Strength of attractive forces between connected nodes */
  attractionStrength: number;
  /** Optimal distance between connected nodes */
  idealLinkDistance: number;
  /** Minimum distance between any nodes to prevent overlap */
  minNodeDistance: number;
  /** How much velocity is preserved between iterations (damping) */
  damping: number;
  /** Maximum distance a node can move in a single iteration */
  maxDisplacement: number;
}

// Default configuration
const forceLayoutConfig: ForceLayoutConfig = {
  iterations: 500,
  repulsionStrength: 20000,
  attractionStrength: 0.01,
  idealLinkDistance: 200,
  minNodeDistance: 50,
  damping: 1,
  maxDisplacement: 500,
};

/**
 * Layout graph nodes using a force-directed algorithm that simulates
 * repulsive forces between all nodes and attractive forces between connected nodes
 *
 * @param graphData - The graph structure containing nodes and edges
 * @param width - Available width for the layout
 * @param height - Available height for the layout
 * @param config - Optional configuration for customizing the layout behavior
 * @returns Graph data with x,y positions assigned to all nodes
 */
export function forceDirectedLayout(graphData: GraphData): GraphData {
  // Create a copy to avoid modifying the original
  const layoutData = {
    nodes: graphData.nodes.map((node) => ({ ...node })),
    edges: [...graphData.edges],
  };

  // Run the simulation
  for (let i = 0; i < forceLayoutConfig.iterations; i++) {
    // Calculate forces
    const repulsiveForces = calculateRepulsiveForces(
      layoutData.nodes,
      forceLayoutConfig,
    );
    const attractiveForces = calculateAttractiveForces(
      layoutData.nodes,
      layoutData.edges,
      forceLayoutConfig,
    );

    // Combine forces
    const combinedForces = layoutData.nodes.map((_, index) => ({
      x: repulsiveForces[index].x + attractiveForces[index].x,
      y: repulsiveForces[index].y + attractiveForces[index].y,
    }));

    // Apply forces to update positions
    applyForcesToNodes(layoutData.nodes, combinedForces, forceLayoutConfig);
  }

  return { nodes: layoutData.nodes, edges: layoutData.edges };
}

/**
 * Calculate repulsive forces between all pairs of nodes to prevent overlap
 * and distribute nodes evenly across the available space
 *
 * @param nodes - Array of all nodes in the graph
 * @param config - Layout configuration containing repulsion parameters
 * @returns Array of force vectors to be applied to each node
 */
function calculateRepulsiveForces(
  nodes: GraphNode[],
  config: ForceLayoutConfig,
): Array<{ x: number; y: number }> {
  const forces: Array<{ x: number; y: number }> = nodes.map(() => ({
    x: 0,
    y: 0,
  }));

  // Calculate repulsive forces between all pairs of nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];

      const dx = nodeA.x - nodeB.x;
      const dy = nodeA.y - nodeB.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Avoid division by zero and apply minimum distance
      const effectiveDistance = Math.max(distance, config.minNodeDistance);

      if (effectiveDistance > 0) {
        // Coulomb's law: F = k * q1 * q2 / r^2
        const force =
          config.repulsionStrength / (effectiveDistance * effectiveDistance);
        const fx = (dx / effectiveDistance) * force;
        const fy = (dy / effectiveDistance) * force;

        // Apply equal and opposite forces
        forces[i].x += fx;
        forces[i].y += fy;
        forces[j].x -= fx;
        forces[j].y -= fy;
      }
    }
  }

  return forces;
}

/**
 * Calculate attractive forces between connected nodes to keep
 * related nodes in the same neighborhood and reduce edge lengths
 *
 * @param nodes - Array of all nodes in the graph
 * @param edges - Array of edges defining node connections
 * @param config - Layout configuration containing attraction parameters
 * @returns Array of force vectors to be applied to each node
 */
function calculateAttractiveForces(
  nodes: GraphNode[],
  edges: GraphEdge[],
  config: ForceLayoutConfig,
): Array<{ x: number; y: number }> {
  const forces: Array<{ x: number; y: number }> = nodes.map(() => ({
    x: 0,
    y: 0,
  }));

  // Create a map from node id to node index for faster lookup
  const nodeIndexMap = new Map<string, number>();
  nodes.forEach((node, index) => {
    nodeIndexMap.set(node.id, index);
  });

  // Calculate attractive forces for each edge
  for (const edge of edges) {
    const sourceIndex = nodeIndexMap.get(edge.source);
    const targetIndex = nodeIndexMap.get(edge.target);

    if (sourceIndex !== undefined && targetIndex !== undefined) {
      const sourceNode = nodes[sourceIndex];
      const targetNode = nodes[targetIndex];

      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 0) {
        // Hooke's law: F = k * (x - x0)
        // Force proportional to displacement from ideal distance
        const displacement = distance - config.idealLinkDistance;
        const force = config.attractionStrength * displacement;

        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        // Apply equal and opposite forces
        forces[sourceIndex].x += fx;
        forces[sourceIndex].y += fy;
        forces[targetIndex].x -= fx;
        forces[targetIndex].y -= fy;
      }
    }
  }

  return forces;
}

/**
 * Apply calculated forces to node positions while respecting
 * movement constraints, but allowing nodes to extend beyond boundaries
 *
 * @param nodes - Array of nodes to be positioned
 * @param forces - Combined force vectors for each node
 * @param width - Available width for positioning (ignored for boundary constraints)
 * @param height - Available height for positioning (ignored for boundary constraints)
 * @param config - Layout configuration containing movement constraints
 */
function applyForcesToNodes(
  nodes: GraphNode[],
  forces: Array<{ x: number; y: number }>,
  config: ForceLayoutConfig,
): void {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const force = forces[i];

    // Apply force directly with damping (simple approach for force-directed layout)
    const dx = force.x * config.damping;
    const dy = force.y * config.damping;

    // Limit maximum displacement
    const displacement = Math.sqrt(dx * dx + dy * dy);
    let appliedX = dx;
    let appliedY = dy;

    if (displacement > config.maxDisplacement) {
      const scale = config.maxDisplacement / displacement;
      appliedX *= scale;
      appliedY *= scale;
    }

    // Update position - no boundary constraints applied
    node.x += appliedX;
    node.y += appliedY;
  }
}

/**
 * Assuming the first node is the root, arrange its children around it in a centered circle.
 * For each of those children, arrange their children in a smaller circle around them, and so on.
 *
 * Returns the modified graph data with x,y positions for each node.
 */
export function fireworksLayout(
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
    400,
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

  const angleFromCenter = Math.atan2(node.y - centerY, node.x - centerX);

  children
    .filter((child) => !visited.has(child.id))
    .forEach((child, index) => {
      // Arrange around the parent but oriented away from center
      const angle =
        angleFromCenter + (index / children.length) * Math.PI - Math.PI / 2;
      child.x = node.x + radius * Math.cos(angle);
      child.y = node.y + radius * Math.sin(angle);
      // Recursively layout child's children
      layoutNode(child, graphData, visited, radius, centerX, centerY);
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
