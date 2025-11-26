
interface Props {
  value: string,
  /** CSS color string */
  color: string,
}

export function ValueObject({ value, color }: Props) {
  const className = `inline-flex font-bold whitespace-pre`;
  return <span className={className} style={{color}}>{value}</span>;
}

export function thunkValueObject(getProps: (jsValue: any) => Props) {
  return (jsValue: any) => {
    const props = getProps(jsValue);
    return <ValueObject {...props} />;
  }
}
