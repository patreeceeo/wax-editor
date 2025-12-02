import { createContext, useContext, type ReactNode } from "react";
import type { Machine } from "../machine";

export interface MachineContextType {
  machine: Machine;
  previousMachine?: Machine;
}

const MachineContext = createContext<MachineContextType | null>(null);

interface MachineProviderProps {
  children: ReactNode;
  machine: Machine;
  previousMachine?: Machine;
}

export function MachineProvider({
  children,
  machine,
  previousMachine,
}: MachineProviderProps) {
  const contextValue: MachineContextType = {
    machine,
    previousMachine,
  };

  return (
    <MachineContext.Provider value={contextValue}>
      {children}
    </MachineContext.Provider>
  );
}

export function useMachine(): MachineContextType {
  const context = useContext(MachineContext);
  if (context === null) {
    throw new Error("useMachine must be used within a MachineProvider");
  }
  return context;
}
