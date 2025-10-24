
// Icon components
const ResetIcon = ({ size = "m" }: { size?: "xl" | "l" | "m" | "s" }) => {
  const sizeClasses = {
    xl: "w-8 h-8",
    l: "w-6 h-6",
    m: "w-5 h-5",
    s: "w-4 h-4"
  };

  return (
    <svg
      className={sizeClasses[size]}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M8 16H3v5" />
    </svg>
  );
};

const PlayIconPath = () => (<path d="M6 2v20l16-10z" />);

const PlayIcon = ({ size = "m" }: { size?: "xl" | "l" | "m" | "s" }) => {
  const sizeClasses = {
    xl: "w-8 h-8",
    l: "w-6 h-6",
    m: "w-5 h-5",
    s: "w-4 h-4"
  };

  return (
    <svg
      className={sizeClasses[size]}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <PlayIconPath />
    </svg>
  );
};

const BackIcon = ({ size = "m" }: { size?: "xl" | "l" | "m" | "s" }) => {
  const sizeClasses = {
    xl: "w-8 h-8",
    l: "w-6 h-6",
    m: "w-5 h-5",
    s: "w-4 h-4"
  };

  return (
    <svg
      className={sizeClasses[size]}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{transform: 'rotate(180deg)'}}
    >
      <PlayIconPath />
    </svg>
  );
};

export { ResetIcon, PlayIcon, BackIcon };
