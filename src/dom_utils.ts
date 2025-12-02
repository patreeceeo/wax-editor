import { Vec2 } from "./vec2";

export const screenToGraphSpace = (
  x: number,
  y: number,
  svgElement: SVGSVGElement,
): Vec2 => {
  const pt = svgElement.createSVGPoint();
  pt.x = x;
  pt.y = y;
  return Vec2.from(pt.matrixTransform(svgElement.getScreenCTM()?.inverse()));
};
