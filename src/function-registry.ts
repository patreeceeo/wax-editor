/**
 * Runtime instruction function registry
 * Ensures instruction function names are preserved during minification
 * by maintaining explicit name-to-function mappings
 */

const instructionRegistry = new Map<string, Function>();

export function registerInstruction(name: string, fn: Function) {
  instructionRegistry.set(name, fn);
}

// Auto-register functions using fn.name
export function autoRegisterInstruction(fn: Function) {
  if (fn.name) {
    instructionRegistry.set(fn.name, fn);
  } else {
    console.warn('Function has no name:', fn);
  }
}

// Export the registry for debugging/inspection
export function getInstructionRegistry(): Map<string, Function> {
  return instructionRegistry;
}

// Runtime lookup function
export function getInstruction(name: string): Function | undefined {
  return instructionRegistry.get(name);
}

// Export all instruction names (forces string literal preservation)
export function getInstructionNames(): string[] {
  return Array.from(instructionRegistry.keys());
}

// Ensure functions are preserved by explicitly referencing them
export function preserveInstructions() {
  return instructionRegistry;
}