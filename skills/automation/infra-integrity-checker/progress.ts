/**
 * Progress reporting for infra-integrity-checker
 * @aiwork4me 2026 Deep Agent Standard
 *
 * Implements ProgressReporter interface for long-running operations.
 * Skills with execution time >5s MUST emit progress updates.
 */

export interface ProgressReport {
  percent: number;
  message: string;
  timestamp: string;
}

export interface PartialResult {
  [key: string]: unknown;
}

export interface ProgressReporter {
  /** Report current progress (0-100) */
  reportProgress: (percent: number, message: string) => Promise<void>;

  /** Report intermediate results */
  reportIntermediate: (data: PartialResult) => Promise<void>;

  /** Signal that skill is still alive */
  heartbeat: () => Promise<void>;
}

/**
 * Create a progress reporter instance
 */
export function createProgressReporter(
  onProgress?: (report: ProgressReport) => void
): ProgressReporter {
  const startTime = Date.now();

  return {
    async reportProgress(percent: number, message: string): Promise<void> {
      const report: ProgressReport = {
        percent: Math.min(100, Math.max(0, percent)),
        message,
        timestamp: new Date().toISOString(),
      };

      if (onProgress) {
        onProgress(report);
      }

      // Log to stderr for MCP protocol
      console.error(`[PROGRESS] ${percent.toFixed(1)}% - ${message}`);
    },

    async reportIntermediate(data: PartialResult): Promise<void> {
      console.error(`[PARTIAL] ${JSON.stringify(data)}`);
    },

    async heartbeat(): Promise<void> {
      const elapsed = Date.now() - startTime;
      console.error(`[HEARTBEAT] Elapsed: ${elapsed}ms`);
    },
  };
}

/**
 * Progress helper for batch operations
 */
export async function withProgress<T, R>(
  items: T[],
  processor: (item: T, index: number, reporter: ProgressReporter) => Promise<R>,
  reporter: ProgressReporter
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i++) {
    const percent = ((i / items.length) * 100);

    await reporter.reportProgress(
      percent,
      `Processing item ${i + 1} of ${items.length}`
    );

    const result = await processor(items[i], i, reporter);
    results.push(result);

    // Emit heartbeat every 5 items
    if (i % 5 === 0) {
      await reporter.heartbeat();
    }
  }

  await reporter.reportProgress(100, "Complete");
  return results;
}
