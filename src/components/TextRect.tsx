import { getTextDimensions } from "../graph_utils";

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

export const TextRect = ({
  x,
  y,
  text,
  transform,
  rectFill,
  rectStroke,
  textFill,
  padding = 0,
}: TextRectProps) => {
  const { width: rectWidth, height: rectHeight } = getTextDimensions(
    text,
    padding,
  );
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
  );
};
