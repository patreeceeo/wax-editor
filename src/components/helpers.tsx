
export function thunkComponent(arg1PropName: string, Component: React.ComponentType<any>) {
  return (arg1: any) => {
    const props = { [arg1PropName]: arg1 };
    return <Component {...props} />;
  }
}
