/**
 * Type definitions for infra-integrity-checker
 * @aiwork4me
 */

export interface SkillLinkOutput {
  data: unknown;
  metadata: {
    skillName: string;
    timestamp: string;
    duration: number;
    nextSkillHint?: string;
  };
}

export interface SkillOptions {
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export interface ProgressReport {
  percent: number;
  message: string;
  partialResult?: unknown;
}
