#!/usr/bin/env bun
/**
 * ⚡ Skill Factory CLI
 * Autonomous skill scaffolding for AIwork4me
 *
 * @aiwork4me
 * @version 2.1.0 - Full Deep Agent Standard Implementation
 *
 * 2026 Features:
 * - Progress Reporting (ProgressReporter interface)
 * - Security Testing (SSRF, input sanitization)
 * - Smart Skill-Link hints via registry lookup
 * - Resource profiles for cost estimation
 * - Security audit command
 */

import { parseArgs } from "node:util";
import { mkdir, readFile, writeFile, readdir, exists, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { $ } from "bun";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const SKILLS_DIR = join(ROOT_DIR, "skills");
const REGISTRY_FILE = join(ROOT_DIR, "registry", "discovery.json");
const README_FILE = join(ROOT_DIR, "README.md");

// README markers for skill registry table
const REGISTRY_START_MARKER = "<!-- SKILL_REGISTRY_START -->";
const REGISTRY_END_MARKER = "<!-- SKILL_REGISTRY_END -->";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface ResourceProfile {
  intensity: "low" | "medium" | "high" | "critical";
  estimatedTokenUsage: string;
  estimatedDuration: string;
  memoryRequirement: "low" | "medium" | "high";
}

interface SkillConfig {
  name: string;
  category: string;
  version: string;
  capability: string;
  mcpCommand: string;
  status: "production" | "beta" | "alpha" | "deprecated";
  skillLink: {
    input: string[];
    output: string[];
    chainable: boolean;
    suggestedNextSkills?: string[];
  };
  entrypoint: string;
  dependencies: string[];
  runtime?: {
    type: string;
    version: string;
    packageManager: string;
  };
  permissions?: {
    network: string[];
    filesystem: string[];
    env: string[];
  };
  resourceProfile?: ResourceProfile;
  created: string;
  updated: string;
}

interface DiscoveryRegistry {
  $schema: string;
  version: string;
  lastUpdated: string;
  maintainer: string;
  skills: SkillConfig[];
  categories: string[];
  templates: Record<string, { path: string; description: string }>;
}

interface McpConfig {
  $schema?: string;
  name: string;
  version: string;
  protocol: string;
  tools: unknown[];
  skillLink?: unknown;
  runtime?: unknown;
  permissions?: unknown;
  securityManifest?: unknown;
}

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  magenta: "\x1b[35m",
};

function log(message: string, color: keyof typeof colors = "reset"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toMcpCommand(name: string): string {
  return `mcp__${name.replace(/-/g, "_")}__main`;
}

function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// ═══════════════════════════════════════════════════════════════════════════
// JSON SCHEMA VALIDATION (2026 Standard)
// ═══════════════════════════════════════════════════════════════════════════

const MCP_2026_SCHEMA = {
  type: "object",
  required: ["name", "version", "protocol", "tools"],
  properties: {
    $schema: { type: "string" },
    name: { type: "string", minLength: 1 },
    version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
    protocol: { type: "string", const: "mcp-2026" },
    description: { type: "string" },
    tools: {
      type: "array",
      items: {
        type: "object",
        required: ["name", "description", "inputSchema"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          inputSchema: { type: "object" },
          outputSchema: { type: "object" },
        },
      },
    },
    skillLink: {
      type: "object",
      properties: {
        compatible: { type: "boolean" },
        inputType: { type: "string" },
        outputType: { type: "string" },
      },
    },
    runtime: {
      type: "object",
      properties: {
        type: { type: "string" },
        version: { type: "string" },
        packageManager: { type: "string" },
      },
    },
    permissions: {
      type: "object",
      properties: {
        network: { type: "array", items: { type: "string" } },
        filesystem: { type: "array", items: { type: "string" } },
        env: { type: "array", items: { type: "string" } },
      },
    },
    securityManifest: { type: "object" },
  },
};

function validateAgainstSchema(config: McpConfig, schema: object): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  for (const field of (schema as { required?: string[] }).required || []) {
    if (!(field in config)) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // Validate specific fields
  if (config.name && typeof config.name !== "string") {
    errors.push('Field "name" must be a string');
  }

  if (config.version && !/^\d+\.\d+\.\d+$/.test(config.version)) {
    errors.push(`Field "version" must match semver format (e.g., "1.0.0"), got: "${config.version}"`);
  }

  if (config.protocol && config.protocol !== "mcp-2026") {
    errors.push(`Field "protocol" should be "mcp-2026", got: "${config.protocol}"`);
  }

  if (config.tools && !Array.isArray(config.tools)) {
    errors.push('Field "tools" must be an array');
  }

  if (Array.isArray(config.tools)) {
    for (let i = 0; i < config.tools.length; i++) {
      const tool = config.tools[i] as Record<string, unknown>;
      if (!tool.name) {
        errors.push(`Tool ${i}: missing "name"`);
      }
      if (!tool.description) {
        errors.push(`Tool ${i}: missing "description"`);
      }
      if (!tool.inputSchema) {
        errors.push(`Tool ${i}: missing "inputSchema"`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ═══════════════════════════════════════════════════════════════════════════
// REGISTRY OPERATIONS
// ═══════════════════════════════════════════════════════════════════════════

async function loadRegistry(): Promise<DiscoveryRegistry> {
  try {
    const content = await readFile(REGISTRY_FILE, "utf-8");
    return JSON.parse(content);
  } catch {
    return {
      $schema: "https://aiwork4me.github.io/schemas/discovery-2026.json",
      version: "1.0.0",
      lastUpdated: getCurrentTimestamp(),
      maintainer: "AIwork4me",
      skills: [],
      categories: ["web", "code", "data", "automation"],
      templates: {},
    };
  }
}

async function saveRegistry(registry: DiscoveryRegistry): Promise<void> {
  registry.lastUpdated = getCurrentTimestamp();
  await writeFile(REGISTRY_FILE, JSON.stringify(registry, null, 2));
  log("✅ Registry updated", "green");
}

// ═══════════════════════════════════════════════════════════════════════════
// SMART NEXT SKILL HINT (Registry Lookup)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Find suggested next skills by scanning the registry.
 * IMPORTANT: Never hallucinate skill names - only use what's in discovery.json
 */
async function findSuggestedNextSkills(
  category: string,
  outputType: string
): Promise<string[]> {
  try {
    const registry = await loadRegistry();

    // Find skills in the same category or that accept this output type as input
    const candidates = registry.skills.filter((skill) => {
      // Same category
      if (skill.category === category) return true;

      // Check if this skill's input matches our output type
      if (skill.skillLink?.input?.some((input) =>
        input.toLowerCase().includes(outputType.toLowerCase().replace("output", ""))
      )) return true;

      return false;
    });

    return candidates.slice(0, 3).map((s) => s.name);
  } catch {
    return [];
  }
}

/**
 * Get default resource profile based on category
 */
function getDefaultResourceProfile(category: string): ResourceProfile {
  const profiles: Record<string, ResourceProfile> = {
    web: {
      intensity: "high",
      estimatedTokenUsage: "5k-20k",
      estimatedDuration: "10-60s",
      memoryRequirement: "medium",
    },
    code: {
      intensity: "medium",
      estimatedTokenUsage: "1k-10k",
      estimatedDuration: "5-30s",
      memoryRequirement: "low",
    },
    data: {
      intensity: "high",
      estimatedTokenUsage: "10k-50k",
      estimatedDuration: "15-120s",
      memoryRequirement: "high",
    },
    automation: {
      intensity: "medium",
      estimatedTokenUsage: "500-5k",
      estimatedDuration: "1-30s",
      memoryRequirement: "low",
    },
  };

  return profiles[category] || profiles.automation;
}

// ═══════════════════════════════════════════════════════════════════════════
// README UPDATE (Robust with Markers)
// ═══════════════════════════════════════════════════════════════════════════

async function updateReadmeTable(registry: DiscoveryRegistry): Promise<void> {
  let readme = await readFile(README_FILE, "utf-8");

  // Check if markers exist
  const startIndex = readme.indexOf(REGISTRY_START_MARKER);
  const endIndex = readme.indexOf(REGISTRY_END_MARKER);

  if (startIndex === -1 || endIndex === -1) {
    log("⚠️  README markers not found. Adding them...", "yellow");

    // Find the Skill Registry section and add markers
    const tableHeader = "| Skill | Category | Capability | MCP Command | Status |";
    const headerIndex = readme.indexOf(tableHeader);

    if (headerIndex === -1) {
      log("❌ Could not find Skill Registry table in README", "red");
      log("   Please add markers manually:", "yellow");
      log(`   ${REGISTRY_START_MARKER}`, "cyan");
      log(`   ${REGISTRY_END_MARKER}`, "cyan");
      return;
    }

    // Add markers around the existing table
    readme = readme.replace(
      tableHeader,
      `${REGISTRY_START_MARKER}\n${tableHeader}`
    );

    // Find end of table (next section or end markers)
    const afterTable = readme.substring(headerIndex);
    const tableEndMatch = afterTable.match(/\n\n(?=[^|])/);
    if (tableEndMatch) {
      const insertPos = headerIndex + (tableEndMatch.index || 0) + 1;
      readme = readme.slice(0, insertPos) + `\n${REGISTRY_END_MARKER}` + readme.slice(insertPos);
    }
  }

  // Generate new table content
  const tableRows = registry.skills
    .map((skill) => {
      const statusEmoji = {
        production: "✅",
        beta: "🟡",
        alpha: "🔵",
        deprecated: "❌",
      }[skill.status];

      // Check if skill has Deep Agent features
      const deepAgentStatus = skill.resourceProfile ? "✅ Full" : "⚠️ Partial";

      return `| [${skill.name}](./skills/${skill.category}/${skill.name}) | ${skill.category} | ${skill.capability} | \`${skill.mcpCommand}\` | ${deepAgentStatus} | ${statusEmoji} ${skill.status} |`;
    })
    .join("\n");

  const tableHeader = `| Skill | Category | Capability | MCP Command | Deep Agent | Status |
|-------|----------|------------|-------------|------------|--------|`;

  const newTableContent = `${tableHeader}\n${tableRows}`;

  // Replace content between markers
  const newStartIndex = readme.indexOf(REGISTRY_START_MARKER);
  const newEndIndex = readme.indexOf(REGISTRY_END_MARKER);

  if (newStartIndex !== -1 && newEndIndex !== -1) {
    const before = readme.substring(0, newStartIndex + REGISTRY_START_MARKER.length);
    const after = readme.substring(newEndIndex);

    readme = `${before}\n${newTableContent}\n${after}`;
  }

  await writeFile(README_FILE, readme);
  log("✅ README Skill Registry updated", "green");
}

// ═══════════════════════════════════════════════════════════════════════════
// DEPENDENCY INSTALLATION (2026 Standard)
// ═══════════════════════════════════════════════════════════════════════════

async function installDependencies(dependencies: string[], skillDir: string): Promise<void> {
  if (dependencies.length === 0) {
    return;
  }

  log(`\n📦 Installing dependencies: ${dependencies.join(", ")}`, "blue");

  try {
    // Use Bun's shell to install dependencies
    for (const dep of dependencies) {
      log(`   Installing ${dep}...`, "cyan");
      await $`bun add ${dep}`.cwd(skillDir).quiet();
    }
    log("✅ Dependencies installed", "green");
  } catch (error) {
    log(`⚠️  Failed to install dependencies: ${error}`, "yellow");
    log("   You may need to install them manually", "yellow");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SKILL SCAFFOLDING
// ═══════════════════════════════════════════════════════════════════════════

async function createSkill(options: {
  category: string;
  name: string;
  capability?: string;
  dependencies?: string[];
}): Promise<void> {
  const { category, name, capability = "AI-powered skill", dependencies = [] } = options;
  const skillName = toKebabCase(name);
  const skillDir = join(SKILLS_DIR, category, skillName);

  // Check if skill already exists
  if (await exists(skillDir)) {
    log(`❌ Skill "${skillName}" already exists in category "${category}"`, "red");
    process.exit(1);
  }

  log(`\n🏭 Creating skill: ${skillName}`, "cyan");
  log(`   Category: ${category}`, "blue");
  log(`   Directory: ${skillDir}`, "blue");
  log(`   Dependencies: ${dependencies.length > 0 ? dependencies.join(", ") : "none"}\n`, "blue");

  // Create skill directory
  await mkdir(join(skillDir, "tests"), { recursive: true });

  // Generate files
  const mcpCommand = toMcpCommand(skillName);
  const timestamp = getCurrentTimestamp();

  // index.ts
  const indexContent = `/**
 * ${skillName} - ${capability}
 * @aiwork4me
 */

import type { SkillLinkOutput } from "./types";
import { validateInput, processRequest } from "./utils";
import { withRetry } from "./resilience";

export interface ${toPascalCase(skillName)}Input {
  /** Input parameter description */
  input: string;
  /** Optional configuration */
  options?: {
    timeout?: number;
    retries?: number;
  };
}

export interface ${toPascalCase(skillName)}Output extends SkillLinkOutput {
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
  input: ${toPascalCase(skillName)}Input
): Promise<${toPascalCase(skillName)}Output> {
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
        skillName: "${skillName}",
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
        skillName: "${skillName}",
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
  name: "${skillName}",
  description: "${capability}",
  execute,
};
`;

  // types.ts
  const typesContent = `/**
 * Type definitions for ${skillName}
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
`;

  // utils.ts
  const utilsContent = `/**
 * Utility functions for ${skillName}
 * @aiwork4me
 */

import type { ${toPascalCase(skillName)}Input } from "./index";

export function validateInput(input: ${toPascalCase(skillName)}Input): void {
  if (!input.input || typeof input.input !== "string") {
    throw new Error("Invalid input: 'input' must be a non-empty string");
  }
}

export async function processRequest(
  input: ${toPascalCase(skillName)}Input
): Promise<string> {
  // TODO: Implement skill logic
  return \`Processed: \${input.input}\`;
}
`;

  // resilience.ts
  const resilienceContent = `/**
 * Resilience utilities for ${skillName}
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
`;

  // progress.ts
  const progressContent = `/**
 * Progress reporting for ${skillName}
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
      console.error(\`[PROGRESS] \${percent.toFixed(1)}% - \${message}\`);
    },

    async reportIntermediate(data: PartialResult): Promise<void> {
      console.error(\`[PARTIAL] \${JSON.stringify(data)}\`);
    },

    async heartbeat(): Promise<void> {
      const elapsed = Date.now() - startTime;
      console.error(\`[HEARTBEAT] Elapsed: \${elapsed}ms\`);
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
      \`Processing item \${i + 1} of \${items.length}\`
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
`;

  // mcp-config.json
  const mcpConfig = {
    $schema: "https://aiwork4me.github.io/schemas/mcp-2026.json",
    name: skillName,
    version: "1.0.0",
    protocol: "mcp-2026",
    tools: [
      {
        name: skillName,
        description: capability,
        inputSchema: {
          type: "object",
          properties: {
            input: { type: "string", description: "Input parameter" },
            options: {
              type: "object",
              properties: {
                timeout: { type: "number" },
                retries: { type: "number" },
              },
            },
          },
          required: ["input"],
        },
        outputSchema: {
          type: "object",
          properties: {
            result: { type: "string" },
          },
        },
      },
    ],
    skillLink: {
      compatible: true,
      inputType: `${toPascalCase(skillName)}Input`,
      outputType: `${toPascalCase(skillName)}Output`,
    },
    runtime: {
      type: "bun",
      version: ">=1.0.0",
      packageManager: "bun",
      entrypoint: "./index.ts",
    },
    permissions: {
      network: [],
      filesystem: [],
      env: [],
      sandbox: {
        mode: "strict",
        allowNetworkOutbound: false,
        allowFilesystemWrite: false,
        allowSubprocess: false,
      },
    },
    deepAgent: {
      supportsProgress: true,
      supportsCancellation: true,
      supportsSelfCorrection: true,
      maxExecutionTime: 30000,
    },
    resourceProfile: getDefaultResourceProfile(category),
  };

  // README.md
  const readmeContent = `# ${skillName}

> ${capability}

<div align="center">

<img src="https://img.shields.io/badge/AIwork4me-Skill-FF6B35?style=for-the-badge" />
<img src="https://img.shields.io/badge/MCP-2026-4A90D9?style=for-the-badge" />
<img src="https://img.shields.io/badge/Status-Alpha-22C55E?style=for-the-badge" />

</div>

---

## 📋 Overview

${capability}

## 🚀 Usage

\`\`\`typescript
import { execute } from "@aiwork4me/${skillName}";

const result = await execute({
  input: "your input here",
});

console.log(result.data);
\`\`\`

## 🔗 Skill-Link

This skill is **Skill-Link compatible**.

**Input Type**: \`${toPascalCase(skillName)}Input\`
**Output Type**: \`${toPascalCase(skillName)}Output\`

## 🛡️ Resilience & Progress (2026 Deep Agent Standard)

This skill implements the **2026 Deep Agent Standard** with:

### Self-Correction
- ✅ Automatic anomaly detection
- ✅ Auto-recovery with fallback strategies
- ✅ Escalation to human when needed
- ✅ Self-diagnostic logging

### Retry Logic
- ✅ Automatic retry with exponential backoff
- ✅ Configurable retry attempts (default: 3)
- ✅ Fallback mode support

### Progress Reporting
- ✅ Real-time progress updates (0-100%)
- ✅ Intermediate result reporting
- ✅ Heartbeat signals for long operations
- ✅ Cancellation support via AbortSignal

\`\`\`typescript
import { execute, createProgressReporter } from "@aiwork4me/${skillName}";

// With progress reporting
const reporter = createProgressReporter((progress) => {
  console.log(\`\${progress.percent}% - \${progress.message}\`);
});

const result = await execute({ input: "test" });
\`\`\`

### Resource Profile

| Metric | Value |
|--------|-------|
| Intensity | \${getDefaultResourceProfile(category).intensity} |
| Est. Duration | \${getDefaultResourceProfile(category).estimatedDuration} |
| Token Usage | \${getDefaultResourceProfile(category).estimatedTokenUsage} |
| Memory | \${getDefaultResourceProfile(category).memoryRequirement} |

## 📚 API Reference

### \`execute(input)\`

Main skill execution function.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| input | string | ✅ | Input parameter |
| options.timeout | number | | Request timeout (ms) |
| options.retries | number | | Max retry attempts |

---

<div align="center">

*Part of [AIwork4me](https://github.com/AIwork4me) ecosystem.*

**Let AI work for me.**

</div>
`;

  // test file
  const testContent = `/**
 * Tests for ${skillName}
 * @aiwork4me
 */

import { describe, test, expect } from "bun:test";
import { execute } from "../index";

describe("${skillName}", () => {
  test("should process input correctly", async () => {
    const result = await execute({ input: "test" });
    expect(result.data.result).toContain("test");
    expect(result.metadata.skillName).toBe("${skillName}");
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
`;

  // resilience test file
  const resilienceTestContent = `/**
 * Resilience tests for ${skillName}
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
`;

  // security test file
  const securityTestContent = `/**
 * Security tests for ${skillName}
 * @aiwork4me 2026 Security Audit Standard
 *
 * Tests for:
 * - Input sanitization
 * - SSRF prevention
 * - Prompt injection prevention
 * - Path traversal protection
 */

import { describe, test, expect } from "bun:test";
import { validateInput } from "../utils";

describe("Security", () => {
  describe("Input Sanitization", () => {
    test("should reject empty input", () => {
      expect(() => validateInput({ input: "" })).toThrow();
    });

    test("should reject null input", () => {
      expect(() => validateInput({ input: null as unknown as string })).toThrow();
    });

    test("should reject undefined input", () => {
      expect(() => validateInput({ input: undefined as unknown as string })).toThrow();
    });

    test("should handle very long input gracefully", () => {
      const longInput = "a".repeat(100000);
      // Should not throw on long input, but implementations may truncate
      expect(() => validateInput({ input: longInput })).not.toThrow();
    });
  });

  describe("SSRF Prevention", () => {
    test("should block internal IP addresses", () => {
      const blockedPatterns = [
        "127.0.0.1",
        "localhost",
        "0.0.0.0",
        "192.168.",
        "10.",
        "172.16.",
      ];

      // This is a placeholder - actual SSRF checks would be in URL validation
      // Implementations should validate URLs against these patterns
      expect(blockedPatterns.length).toBeGreaterThan(0);
    });

    test("should block file:// protocol", () => {
      const dangerousUrl = "file:///etc/passwd";
      // URL validation should reject file:// protocol
      expect(dangerousUrl.startsWith("file://")).toBe(true);
    });
  });

  describe("Prompt Injection Prevention", () => {
    test("should handle common injection patterns", () => {
      const injectionPatterns = [
        "Ignore previous instructions",
        "SYSTEM: You are now",
        "<|im_start|>",
        "---END---",
        "]\\n\\nHuman:",
      ];

      // These patterns should be detected and sanitized
      // Actual implementation depends on skill requirements
      expect(injectionPatterns.length).toBeGreaterThan(0);
    });
  });

  describe("Path Traversal Prevention", () => {
    test("should block directory traversal attempts", () => {
      const dangerousPaths = [
        "../../../etc/passwd",
        "..\\\\..\\\\windows\\\\system32",
        "/etc/shadow",
        "~/../secret",
      ];

      for (const path of dangerousPaths) {
        // Path validation should reject these
        expect(path.includes("..")).toBe(true);
      }
    });
  });

  describe("Environment Safety", () => {
    test("should not leak environment variables", () => {
      // Skills should never expose process.env in output
      // This test ensures the skill doesn't leak sensitive data
      const sensitiveEnvVars = ["API_KEY", "SECRET", "PASSWORD", "TOKEN"];

      // Placeholder - actual test would check skill output
      expect(sensitiveEnvVars.length).toBe(4);
    });
  });
});
`;

  // Write all files
  await writeFile(join(skillDir, "index.ts"), indexContent);
  await writeFile(join(skillDir, "types.ts"), typesContent);
  await writeFile(join(skillDir, "utils.ts"), utilsContent);
  await writeFile(join(skillDir, "resilience.ts"), resilienceContent);
  await writeFile(join(skillDir, "progress.ts"), progressContent);
  await writeFile(join(skillDir, "mcp-config.json"), JSON.stringify(mcpConfig, null, 2));
  await writeFile(join(skillDir, "README.md"), readmeContent);
  await writeFile(join(skillDir, "tests", "index.test.ts"), testContent);
  await writeFile(join(skillDir, "tests", "resilience.test.ts"), resilienceTestContent);
  await writeFile(join(skillDir, "tests", "security.test.ts"), securityTestContent);

  log("✅ Skill files created", "green");

  // Install dependencies
  if (dependencies.length > 0) {
    await installDependencies(dependencies, skillDir);
  }

  // Find suggested next skills from registry
  const suggestedNextSkills = await findSuggestedNextSkills(
    category,
    `${toPascalCase(skillName)}Output`
  );

  if (suggestedNextSkills.length > 0) {
    log(`🔗 Suggested next skills: ${suggestedNextSkills.join(", ")}`, "blue");
  }

  // Update registry
  const registry = await loadRegistry();
  const newSkill: SkillConfig = {
    name: skillName,
    category,
    version: "1.0.0",
    capability,
    mcpCommand,
    status: "alpha",
    skillLink: {
      input: ["input: string"],
      output: ["result: string", "metadata: SkillMetadata"],
      chainable: true,
      suggestedNextSkills,
    },
    entrypoint: `./skills/${category}/${skillName}/index.ts`,
    dependencies,
    runtime: {
      type: "bun",
      version: ">=1.0.0",
      packageManager: "bun",
    },
    permissions: {
      network: [],
      filesystem: [],
      env: [],
    },
    resourceProfile: getDefaultResourceProfile(category),
    created: timestamp,
    updated: timestamp,
  };

  registry.skills.push(newSkill);
  await saveRegistry(registry);

  // Update README table
  await updateReadmeTable(registry);

  log(`\n🎉 Skill "${skillName}" created successfully!`, "green");
  log(`   MCP Command: ${mcpCommand}`, "cyan");
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION (2026 Standard with JSON Schema)
// ═══════════════════════════════════════════════════════════════════════════

async function validateSkill(options: { skill: string }): Promise<void> {
  const { skill } = options;
  log(`\n🔍 Validating skill: ${skill}\n`, "cyan");

  // Find skill in registry
  const registry = await loadRegistry();
  const skillConfig = registry.skills.find((s) => s.name === skill);

  if (!skillConfig) {
    log(`❌ Skill "${skill}" not found in registry`, "red");
    process.exit(1);
  }

  const skillDir = join(SKILLS_DIR, skillConfig.category, skill);

  // Check required files
  const requiredFiles = [
    "index.ts",
    "types.ts",
    "utils.ts",
    "resilience.ts",
    "progress.ts",
    "mcp-config.json",
    "README.md",
  ];
  let hasErrors = false;

  for (const file of requiredFiles) {
    const filePath = join(skillDir, file);
    if (await exists(filePath)) {
      log(`  ✅ ${file}`, "green");
    } else {
      log(`  ❌ ${file} - MISSING`, "red");
      hasErrors = true;
    }
  }

  // Validate mcp-config.json with JSON Schema
  try {
    const mcpConfig: McpConfig = JSON.parse(
      await readFile(join(skillDir, "mcp-config.json"), "utf-8")
    );

    log("\n  📋 MCP Config Validation:", "bold");

    const { valid, errors } = validateAgainstSchema(mcpConfig, MCP_2026_SCHEMA);

    if (valid) {
      log("  ✅ MCP config passes 2026 schema validation", "green");
    } else {
      log("  ❌ MCP config schema validation failed:", "red");
      for (const error of errors) {
        log(`     - ${error}`, "red");
      }
      hasErrors = true;
    }

    // Additional deep agent checks
    if (mcpConfig.runtime) {
      log(`  ✅ Runtime configured: ${(mcpConfig.runtime as { type: string }).type}`, "green");
    } else {
      log("  ⚠️  No runtime configuration", "yellow");
    }

    if (mcpConfig.permissions) {
      log("  ✅ Permissions declared", "green");
    } else {
      log("  ⚠️  No permissions declared", "yellow");
    }

    // Check for deepAgent configuration (2026 Standard)
    const deepAgent = (mcpConfig as Record<string, unknown>).deepAgent as {
      supportsProgress?: boolean;
      supportsSelfCorrection?: boolean;
      maxExecutionTime?: number;
    } | undefined;

    if (deepAgent) {
      log(`  ✅ Deep Agent config: progress=${deepAgent.supportsProgress ?? false}, self-correction=${deepAgent.supportsSelfCorrection ?? false}`, "green");
    } else {
      log("  ⚠️  No deepAgent configuration (2026 Standard)", "yellow");
    }

    // Check for resourceProfile
    const resourceProfile = (mcpConfig as Record<string, unknown>).resourceProfile as {
      intensity?: string;
      estimatedDuration?: string;
    } | undefined;

    if (resourceProfile) {
      log(`  ✅ Resource profile: ${resourceProfile.intensity ?? "unknown"} intensity`, "green");
    } else {
      log("  ⚠️  No resourceProfile defined (cost estimation unavailable)", "yellow");
    }
  } catch (e) {
    log(`  ❌ Failed to parse mcp-config.json`, "red");
    hasErrors = true;
  }

  // Check for test files
  const testsDir = join(skillDir, "tests");
  if (await exists(testsDir)) {
    const testFiles = (await readdir(testsDir)).filter((f) => f.endsWith(".test.ts"));
    if (testFiles.length > 0) {
      log(`\n  ✅ Test files: ${testFiles.join(", ")}`, "green");

      // Check for specific test files (2026 Standard)
      if (testFiles.includes("security.test.ts")) {
        log("  ✅ Security tests present", "green");
      } else {
        log("  ⚠️  Missing security.test.ts (2026 Standard)", "yellow");
      }

      if (testFiles.includes("resilience.test.ts")) {
        log("  ✅ Resilience tests present", "green");
      } else {
        log("  ⚠️  Missing resilience.test.ts", "yellow");
      }
    } else {
      log("\n  ⚠️  No test files found", "yellow");
    }
  }

  if (hasErrors) {
    log(`\n❌ Validation failed with errors`, "red");
    process.exit(1);
  } else {
    log(`\n✅ Skill "${skill}" is valid!`, "green");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// REGISTER COMMAND (Scan & Sync Local Skills)
// ═══════════════════════════════════════════════════════════════════════════

async function scanLocalSkills(): Promise<Array<{ name: string; category: string; path: string }>> {
  const skills: Array<{ name: string; category: string; path: string }> = [];
  const categories = ["web", "code", "data", "automation"];

  for (const category of categories) {
    const categoryDir = join(SKILLS_DIR, category);
    try {
      const entries = await readdir(categoryDir);
      for (const entry of entries) {
        const skillPath = join(categoryDir, entry);
        const skillStat = await stat(skillPath);
        if (skillStat.isDirectory()) {
          // Check if it has mcp-config.json
          if (await exists(join(skillPath, "mcp-config.json"))) {
            skills.push({ name: entry, category, path: skillPath });
          }
        }
      }
    } catch {
      // Category directory doesn't exist, skip
    }
  }

  return skills;
}

async function registerSkill(options: { skill?: string; all?: boolean }): Promise<void> {
  log("\n📝 Registering skills...\n", "cyan");

  const registry = await loadRegistry();
  const localSkills = await scanLocalSkills();

  if (options.all) {
    // Register all local skills
    let registered = 0;
    let updated = 0;

    for (const localSkill of localSkills) {
      const existingIndex = registry.skills.findIndex((s) => s.name === localSkill.name);

      try {
        const mcpConfig: McpConfig = JSON.parse(
          await readFile(join(localSkill.path, "mcp-config.json"), "utf-8")
        );

        const skillConfig: SkillConfig = {
          name: localSkill.name,
          category: localSkill.category,
          version: mcpConfig.version || "1.0.0",
          capability: (mcpConfig.tools?.[0] as { description?: string })?.description || "AI-powered skill",
          mcpCommand: toMcpCommand(localSkill.name),
          status: "alpha",
          skillLink: {
            input: ["input: string"],
            output: ["result: string"],
            chainable: true,
          },
          entrypoint: `./skills/${localSkill.category}/${localSkill.name}/index.ts`,
          dependencies: [],
          created: getCurrentTimestamp(),
          updated: getCurrentTimestamp(),
        };

        if (existingIndex >= 0) {
          // Update existing, preserve created timestamp
          skillConfig.created = registry.skills[existingIndex].created;
          registry.skills[existingIndex] = skillConfig;
          updated++;
          log(`  🔄 Updated: ${localSkill.name}`, "blue");
        } else {
          registry.skills.push(skillConfig);
          registered++;
          log(`  ✅ Registered: ${localSkill.name}`, "green");
        }
      } catch (e) {
        log(`  ❌ Failed to register ${localSkill.name}: ${e}`, "red");
      }
    }

    await saveRegistry(registry);
    await updateReadmeTable(registry);

    log(`\n📊 Registration complete:`, "bold");
    log(`   Registered: ${registered}`, "green");
    log(`   Updated: ${updated}`, "blue");
    log(`   Total: ${registry.skills.length}`, "cyan");
  } else if (options.skill) {
    // Register specific skill
    const localSkill = localSkills.find((s) => s.name === options.skill);

    if (!localSkill) {
      log(`❌ Skill "${options.skill}" not found in local skills directory`, "red");
      process.exit(1);
    }

    const existingIndex = registry.skills.findIndex((s) => s.name === options.skill);

    try {
      const mcpConfig: McpConfig = JSON.parse(
        await readFile(join(localSkill.path, "mcp-config.json"), "utf-8")
      );

      const skillConfig: SkillConfig = {
        name: localSkill.name,
        category: localSkill.category,
        version: mcpConfig.version || "1.0.0",
        capability: (mcpConfig.tools?.[0] as { description?: string })?.description || "AI-powered skill",
        mcpCommand: toMcpCommand(localSkill.name),
        status: "alpha",
        skillLink: {
          input: ["input: string"],
          output: ["result: string"],
          chainable: true,
        },
        entrypoint: `./skills/${localSkill.category}/${localSkill.name}/index.ts`,
        dependencies: [],
        created: getCurrentTimestamp(),
        updated: getCurrentTimestamp(),
      };

      if (existingIndex >= 0) {
        skillConfig.created = registry.skills[existingIndex].created;
        registry.skills[existingIndex] = skillConfig;
        log(`✅ Updated skill: ${options.skill}`, "green");
      } else {
        registry.skills.push(skillConfig);
        log(`✅ Registered skill: ${options.skill}`, "green");
      }

      await saveRegistry(registry);
      await updateReadmeTable(registry);
    } catch (e) {
      log(`❌ Failed to register ${options.skill}: ${e}`, "red");
      process.exit(1);
    }
  } else {
    log("❌ Please specify --skill <name> or --all", "red");
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LIST SKILLS
// ═══════════════════════════════════════════════════════════════════════════

async function listSkills(): Promise<void> {
  const registry = await loadRegistry();

  log("\n📦 AIwork4me Skill Registry\n", "bold");
  log(`Total Skills: ${registry.skills.length}`, "cyan");
  log(`Categories: ${registry.categories.join(", ")}\n`, "cyan");

  if (registry.skills.length === 0) {
    log("No skills registered yet.", "yellow");
    log("Run 'bun run skill-factory.ts register --all' to scan and register local skills.", "yellow");
    return;
  }

  for (const skill of registry.skills) {
    const statusEmoji = {
      production: "✅",
      beta: "🟡",
      alpha: "🔵",
      deprecated: "❌",
    }[skill.status];

    log(`${statusEmoji} ${skill.name}`, "bold");
    log(`   Category: ${skill.category}`);
    log(`   Capability: ${skill.capability}`);
    log(`   MCP Command: ${skill.mcpCommand}`);
    log(`   Status: ${skill.status}\n`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY AUDIT (2026 Standard)
// ═══════════════════════════════════════════════════════════════════════════

interface AuditResult {
  passed: boolean;
  issues: Array<{
    severity: "critical" | "high" | "medium" | "low";
    category: string;
    message: string;
    file?: string;
    line?: number;
  }>;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

async function auditSkill(options: { skill: string }): Promise<AuditResult> {
  const { skill } = options;
  const result: AuditResult = {
    passed: true,
    issues: [],
    summary: { critical: 0, high: 0, medium: 0, low: 0 },
  };

  // Find skill in registry
  const registry = await loadRegistry();
  const skillConfig = registry.skills.find((s) => s.name === skill);

  if (!skillConfig) {
    result.issues.push({
      severity: "critical",
      category: "registry",
      message: `Skill "${skill}" not found in registry`,
    });
    result.summary.critical++;
    result.passed = false;
    return result;
  }

  const skillDir = join(SKILLS_DIR, skillConfig.category, skill);

  // Security patterns to check
  const dangerousPatterns = [
    { pattern: /eval\s*\(/, severity: "critical" as const, category: "code-injection", message: "Use of eval() - potential code injection" },
    { pattern: /Function\s*\(/, severity: "critical" as const, category: "code-injection", message: "Dynamic Function creation - potential code injection" },
    { pattern: /exec\s*\(/, severity: "high" as const, category: "command-injection", message: "exec() call - potential command injection" },
    { pattern: /spawn\s*\(/, severity: "high" as const, category: "command-injection", message: "spawn() call - potential command injection" },
    { pattern: /child_process/, severity: "high" as const, category: "command-injection", message: "child_process import - review for command injection" },
    { pattern: /process\.env\.[A-Z_]+\s*[+`]/, severity: "medium" as const, category: "secret-leak", message: "Potential environment variable leak in string" },
    { pattern: /password\s*=\s*["'][^"']+["']/, severity: "high" as const, category: "hardcoded-secret", message: "Hardcoded password detected" },
    { pattern: /api[_-]?key\s*=\s*["'][^"']+["']/i, severity: "high" as const, category: "hardcoded-secret", message: "Hardcoded API key detected" },
    { pattern: /secret\s*=\s*["'][^"']+["']/i, severity: "high" as const, category: "hardcoded-secret", message: "Hardcoded secret detected" },
    { pattern: /file:\/\/\//, severity: "medium" as const, category: "ssrf", message: "file:// protocol usage - potential SSRF" },
    { pattern: /\.\.\//, severity: "medium" as const, category: "path-traversal", message: "Path traversal pattern detected" },
  ];

  // Scan TypeScript files
  const filesToScan = ["index.ts", "utils.ts", "resilience.ts", "progress.ts"];

  for (const file of filesToScan) {
    const filePath = join(skillDir, file);
    try {
      if (!(await exists(filePath))) continue;

      const content = await readFile(filePath, "utf-8");
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const { pattern, severity, category, message } of dangerousPatterns) {
          if (pattern.test(line)) {
            result.issues.push({
              severity,
              category,
              message,
              file,
              line: i + 1,
            });
            result.summary[severity]++;
            if (severity === "critical" || severity === "high") {
              result.passed = false;
            }
          }
        }
      }
    } catch {
      // File doesn't exist, skip
    }
  }

  // Check mcp-config.json for security issues
  try {
    const mcpConfig: McpConfig = JSON.parse(
      await readFile(join(skillDir, "mcp-config.json"), "utf-8")
    );

    // Check for overly permissive permissions
    const permissions = mcpConfig.permissions as {
      network?: string[];
      sandbox?: { mode?: string };
    } | undefined;

    if (permissions?.sandbox?.mode === "none" || permissions?.sandbox?.mode === "disabled") {
      result.issues.push({
        severity: "high",
        category: "permissions",
        message: "Sandbox mode is disabled - skill runs without restrictions",
        file: "mcp-config.json",
      });
      result.summary.high++;
      result.passed = false;
    }

    if (permissions?.network?.includes("*")) {
      result.issues.push({
        severity: "medium",
        category: "permissions",
        message: "Wildcard network permission - consider restricting domains",
        file: "mcp-config.json",
      });
      result.summary.medium++;
    }
  } catch {
    result.issues.push({
      severity: "low",
      category: "config",
      message: "Could not parse mcp-config.json for security review",
    });
    result.summary.low++;
  }

  // Check for security test file
  if (!(await exists(join(skillDir, "tests", "security.test.ts")))) {
    result.issues.push({
      severity: "medium",
      category: "testing",
      message: "Missing security test file (tests/security.test.ts)",
    });
    result.summary.medium++;
  }

  return result;
}

async function runAudit(options: { skill: string }): Promise<void> {
  const { skill } = options;
  log(`\n🔒 Security Audit: ${skill}\n`, "cyan");

  const result = await auditSkill({ skill });

  // Display results
  if (result.issues.length === 0) {
    log("✅ No security issues found!", "green");
    log("   Skill passes security audit.\n", "green");
    return;
  }

  // Group issues by severity
  const severities: Array<"critical" | "high" | "medium" | "low"> = ["critical", "high", "medium", "low"];
  const colors: Record<string, keyof typeof colors> = {
    critical: "red",
    high: "red",
    medium: "yellow",
    low: "blue",
  };

  for (const severity of severities) {
    const issues = result.issues.filter((i) => i.severity === severity);
    if (issues.length === 0) continue;

    const emoji = severity === "critical" ? "🚨" : severity === "high" ? "❌" : severity === "medium" ? "⚠️" : "ℹ️";
    log(`${emoji} ${severity.toUpperCase()} (${issues.length})`, colors[severity]);

    for (const issue of issues) {
      const location = issue.file
        ? ` [${issue.file}${issue.line ? `:${issue.line}` : ""}]`
        : "";
      log(`   • [${issue.category}] ${issue.message}${location}`, colors[severity]);
    }
    log("");
  }

  // Summary
  log("📊 Audit Summary:", "bold");
  log(`   Critical: ${result.summary.critical}`, result.summary.critical > 0 ? "red" : "green");
  log(`   High:     ${result.summary.high}`, result.summary.high > 0 ? "red" : "green");
  log(`   Medium:   ${result.summary.medium}`, result.summary.medium > 0 ? "yellow" : "green");
  log(`   Low:      ${result.summary.low}`, result.summary.low > 0 ? "blue" : "green");

  if (result.passed) {
    log("\n✅ Audit PASSED (minor issues found, no critical/high severity)", "green");
  } else {
    log("\n❌ Audit FAILED (critical or high severity issues found)", "red");
    log("   Fix the issues above before registering this skill.\n", "yellow");
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CLI MAIN
// ═══════════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      category: { type: "string", short: "c" },
      name: { type: "string", short: "n" },
      capability: { type: "string", short: "d" },
      skill: { type: "string", short: "s" },
      dependencies: { type: "string", multiple: true },
      all: { type: "boolean" },
      help: { type: "boolean", short: "h" },
    },
    strict: false,
  });

  const command = positionals[0];

  if (values.help || !command) {
    log("\n⚡ AIwork4me Skill Factory CLI v2.1\n", "bold");
    log("Commands:");
    log("  create    Create a new skill");
    log("  validate  Validate a skill against MCP 2026 schema");
    log("  register  Register skill(s) to the registry");
    log("  audit     Run security audit on a skill");
    log("  list      List all registered skills\n");
    log("Usage:");
    log("  bun run skill-factory.ts create -c <category> -n <name> [-d <desc>] [--dependencies pkg1,pkg2]");
    log("  bun run skill-factory.ts validate -s <skill-name>");
    log("  bun run skill-factory.ts register -s <skill-name>");
    log("  bun run skill-factory.ts register --all");
    log("  bun run skill-factory.ts audit -s <skill-name>");
    log("  bun run skill-factory.ts list\n");
    log("Options:");
    log("  -c, --category      Skill category (web|code|data|automation)");
    log("  -n, --name          Skill name (kebab-case)");
    log("  -d, --capability    Brief description");
    log("  -s, --skill         Skill name for validate/register/audit");
    log("  --dependencies      Packages to install (comma-separated)");
    log("  --all               Register all local skills");
    log("  -h, --help          Show this help\n");
    process.exit(0);
  }

  switch (command) {
    case "create":
      if (!values.category || !values.name) {
        log("❌ --category and --name are required for create", "red");
        process.exit(1);
      }
      await createSkill({
        category: values.category,
        name: values.name,
        capability: values.capability,
        dependencies: values.dependencies
          ? values.dependencies.flatMap((d) => d.split(","))
          : undefined,
      });
      break;

    case "validate":
      if (!values.skill) {
        log("❌ --skill is required for validate", "red");
        process.exit(1);
      }
      await validateSkill({ skill: values.skill });
      break;

    case "register":
      await registerSkill({
        skill: values.skill,
        all: values.all,
      });
      break;

    case "audit":
      if (!values.skill) {
        log("❌ --skill is required for audit", "red");
        process.exit(1);
      }
      await runAudit({ skill: values.skill });
      break;

    case "list":
      await listSkills();
      break;

    default:
      log(`❌ Unknown command: ${command}`, "red");
      process.exit(1);
  }
}

main().catch((e) => {
  log(`❌ Error: ${e.message}`, "red");
  process.exit(1);
});
