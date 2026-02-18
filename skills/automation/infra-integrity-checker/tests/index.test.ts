/**
 * Tests for infra-integrity-checker
 * @aiwork4me
 */

import { describe, test, expect } from "bun:test";
import { execute } from "../index";

describe("infra-integrity-checker", () => {
  test("should process input correctly", async () => {
    const result = await execute({ input: "test" });
    expect(result.data.result).toContain("test");
    expect(result.metadata.skillName).toBe("infra-integrity-checker");
  });

  test("should throw on invalid input", async () => {
    const result = await execute({ input: "" });
    expect(result.diagnostics?.finalState).toBe("failed");
  });

  test("should include metadata in output", async () => {
    const result = await execute({ input: "test" });
    expect(result.metadata.duration).toBeGreaterThanOrEqual(0);
    expect(result.metadata.timestamp).toBeDefined();
  });

  test("should include diagnostics", async () => {
    const result = await execute({ input: "test" });
    expect(result.diagnostics).toBeDefined();
    expect(result.diagnostics?.finalState).toBe("success");
  });
});
