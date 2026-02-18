/**
 * Resilience utilities for infra-integrity-checker
 * @aiwork4me 2026 Deep Agent Standard
 */

export interface RetryOptions {
  maxRetries: number;
  delay?: number;
  backoff?: 'fixed' | 'exponential';
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxRetries, delay = 1000, backoff = 'exponential' } = options;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const waitTime = backoff === 'exponential'
          ? delay * Math.pow(2, attempt)
          : delay;

        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError;
}

export async function withFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await primary();
  } catch {
    return await fallback();
  }
}
