import { useState } from "react";

interface VariableInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function VariableInput({
  value = "",
  onChange,
  placeholder = "Variable Name",
  className = "",
}: VariableInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState("");

  const validateInput = (text: string) => {
    if (text === "") {
      setError("");
      return true;
    }

    if (!/^[a-zA-Z]/.test(text)) {
      setError("Must start with a letter");
      return false;
    }

    setError("");
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    if (validateInput(newValue)) {
      setInputValue(newValue);
      onChange?.(newValue);
    }
  };

  return (
    <div className={`variable-input ${className}`}>
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
