import {Vec2} from "./vec2";

export const getMouseRelativeRect = (event: React.MouseEvent, element: Element) => {
  const rect = element.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    width: rect.width,
    height: rect.height
  };
};


export const screenToGraphSpace = (x: number, y: number, svgElement: SVGSVGElement): Vec2 => {
  const pt = svgElement.createSVGPoint();
  pt.x = x;
  pt.y = y;
  return Vec2.from(pt.matrixTransform(svgElement.getScreenCTM()?.inverse()));
};
