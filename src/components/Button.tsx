
const sizeClasses = {
  xl: "text-2xl",
  l: "text-xl",
  m: "text-lg",
  s: "text-sm"
} as const;

const paddingClasses = {
  xl: "px-8 py-4",
  l: "px-6 py-3",
  m: "px-4 py-2",
  s: "px-2 py-1"
} as const;

interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  size?: keyof typeof sizeClasses;
  children: React.ReactNode;
}

export default function Button({
  onClick,
  disabled,
  primary,
  size = "m",
  children
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{borderColor: 'currentColor'}}
      className={`
        cursor-pointer
        bg-white
        ${primary ? "text-blue-500" : "text-gray-500"}
        font-bold
        ${paddingClasses[size]}
        rounded
        ${`hover:${primary ? "text-blue-600" : "text-gray-600"}`}
        border-2
        enabled:[box-shadow:0_var(--shadow-height-normal)_0_currentColor]
        enabled:active:[box-shadow:0_var(--shadow-height-active)_0_currentColor]
        enabled:active:translate-y-0.5
        enabled:hover:[box-shadow:0_var(--shadow-height-hover)_0_currentColor]
        enabled:hover:-translate-y-0.5
        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:translate-y-1
        ${sizeClasses[size]}
        border
        ${primary ? "border-blue-200" : "border-gray-200"}
      `}
    >
      {children}
    </button>
  )
}
