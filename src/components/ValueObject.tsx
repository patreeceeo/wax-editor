
interface Props {
  value: string,
  color: keyof typeof colorMap
}
const colorMap = {
  green: "text-green-600",
  blue: "text-blue-600",
  purple: "text-purple-600",
  gray: "text-gray-600",
  yellow: "text-yellow-600",
  orange: "text-orange-600",
  red: "text-red-600",
  pink: "text-pink-600",
  indigo: "text-indigo-600"
} as const;

export function ValueObject({ value, color }: Props) {
  const className = `inline-flex ${colorMap[color]} font-bold whitespace-pre`;
  return <span className={className}>{value}</span>;
}

export function thunkValueObject(getProps: (jsValue: any) => Props) {
  return (jsValue: any) => {
    const props = getProps(jsValue);
    return <ValueObject {...props} />;
  }
}
