/**
 * Utility functions for infra-integrity-checker
 * @aiwork4me
 */

import type { InfraIntegrityCheckerInput } from "./index";

export function validateInput(input: InfraIntegrityCheckerInput): void {
  if (!input.input || typeof input.input !== "string") {
    throw new Error("Invalid input: 'input' must be a non-empty string");
  }
}

export async function processRequest(
  input: InfraIntegrityCheckerInput
): Promise<string> {
  // TODO: Implement skill logic
  return `Processed: ${input.input}`;
}
