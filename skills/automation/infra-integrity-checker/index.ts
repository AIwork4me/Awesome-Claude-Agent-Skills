/**
 * infra-integrity-checker - Systematic self-test skill
 * @aiwork4me
 */

import type { SkillLinkOutput } from "./types";
import { validateInput, processRequest } from "./utils";
import { withRetry } from "./resilience";

export interface InfraIntegrityCheckerInput {
  /** Input parameter description */
  input: string;
  /** Optional configuration */
  options?: {
    timeout?: number;
    retries?: number;
  };
}

export interface InfraIntegrityCheckerOutput extends SkillLinkOutput {
  data: {
    result: string;
  };
  diagnostics?: {
    warnings: string[];
    recoveryAttempts: number;
    finalState: 'success' | 'degraded' | 'failed';
  };
}

/**
 * Main skill execution function
 * Implements 2026 Deep Agent Standard with self-correction
 */
export async function execute(
  input: InfraIntegrityCheckerInput
): Promise<InfraIntegrityCheckerOutput> {
  const startTime = Date.now();
  let recoveryAttempts = 0;
  const warnings: string[] = [];

  try {
    // Validate input
    validateInput(input);

    // Process request with retry logic
    const result = await withRetry(
      () => processRequest(input),
      { maxRetries: input.options?.retries ?? 3 }
    );

    return {
      data: { result },
      metadata: {
        skillName: "infra-integrity-checker",
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        nextSkillHint: undefined,
      },
      diagnostics: {
        warnings,
        recoveryAttempts,
        finalState: 'success',
      },
    };
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : 'Unknown error');
    recoveryAttempts++;

    return {
      data: { result: '' },
      metadata: {
        skillName: "infra-integrity-checker",
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        nextSkillHint: undefined,
      },
      diagnostics: {
        warnings,
        recoveryAttempts,
        finalState: 'failed',
      },
    };
  }
}

// MCP Tool export
export default {
  name: "infra-integrity-checker",
  description: "Systematic self-test skill",
  execute,
};
