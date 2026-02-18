/**
 * Tests for OpenClaw Deep Research skill
 * @aiwork4me
 */

import { describe, test, expect } from "bun:test";
import { execute, validateInput } from "../index";

describe("openclaw-deep-research", () => {
  describe("validateInput", () => {
    test("should accept valid input", () => {
      expect(() => validateInput({ query: "test query" })).not.toThrow();
    });

    test("should reject empty query", () => {
      expect(() => validateInput({ query: "" })).toThrow();
    });

    test("should reject query that is too short", () => {
      expect(() => validateInput({ query: "a" })).toThrow();
    });

    test("should reject query that is too long", () => {
      const longQuery = "a".repeat(501);
      expect(() => validateInput({ query: longQuery })).toThrow();
    });

    test("should reject invalid depth option", () => {
      expect(() =>
        validateInput({ query: "test", options: { depth: 6 } })
      ).toThrow();
    });
  });

  describe("execute", () => {
    test("should return results array", async () => {
      const result = await execute({ query: "MCP protocol" });
      expect(Array.isArray(result.results)).toBe(true);
    });

    test("should include metadata", async () => {
      const result = await execute({ query: "test query" });
      expect(result.metadata).toBeDefined();
      expect(result.metadata.query).toBe("test query");
      expect(result.metadata.timestamp).toBeDefined();
    });

    test("should respect maxResults option", async () => {
      const result = await execute({
        query: "test",
        options: { maxResults: 3 },
      });
      expect(result.results.length).toBeLessThanOrEqual(3);
    });

    test("should include relevance scores", async () => {
      const result = await execute({ query: "MCP protocol 2026" });
      for (const r of result.results) {
        expect(r.relevance).toBeGreaterThanOrEqual(0);
        expect(r.relevance).toBeLessThanOrEqual(1);
      }
    });

    test("should include Skill-Link metadata", async () => {
      const result = await execute({ query: "test" });
      expect(result.chainHistory).toContain("openclaw-deep-research");
    });

    test("should return results with required fields", async () => {
      const result = await execute({ query: "MCP" });
      for (const r of result.results) {
        expect(r.title).toBeDefined();
        expect(r.url).toBeDefined();
        expect(r.snippet).toBeDefined();
        expect(r.domain).toBeDefined();
      }
    });
  });
});
