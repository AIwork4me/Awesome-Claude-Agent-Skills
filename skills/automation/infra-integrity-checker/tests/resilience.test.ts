/**
 * Resilience tests for infra-integrity-checker
 * @aiwork4me
 */

import { describe, test, expect } from "bun:test";
import { withRetry, withFallback } from "../resilience";

describe("Resilience", () => {
  test("withRetry should succeed on first attempt", async () => {
    const result = await withRetry(() => Promise.resolve("success"), { maxRetries: 3 });
    expect(result).toBe("success");
  });

  test("withRetry should retry on failure", async () => {
    let attempts = 0;
    const fn = () => {
      attempts++;
      if (attempts < 3) throw new Error("fail");
      return Promise.resolve("success");
    };

    const result = await withRetry(fn, { maxRetries: 3, delay: 10 });
    expect(result).toBe("success");
    expect(attempts).toBe(3);
  });

  test("withFallback should use fallback on primary failure", async () => {
    const primary = () => Promise.reject(new Error("primary failed"));
    const fallback = () => Promise.resolve("fallback success");

    const result = await withFallback(primary, fallback);
    expect(result).toBe("fallback success");
  });
});
