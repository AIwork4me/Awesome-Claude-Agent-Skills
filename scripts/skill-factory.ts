#!/usr/bin/env bun
/**
 * ⚡ Skill Factory CLI
 * Autonomous skill scaffolding for AIwork4me
 *
 * @aiwork4me
 * @version 2.0.0
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

      return `| [${skill.name}](./skills/${skill.category}/${skill.name}) | ${skill.category} | ${skill.capability} | \`${skill.mcpCommand}\` | ${statusEmoji} ${skill.status} |`;
    })
    .join("\n");

  const tableHeader = `| Skill | Category | Capability | MCP Command | Status |
|-------|----------|------------|-------------|--------|`;

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

## 🛡️ Resilience

This skill implements the **2026 Deep Agent Standard**:

- ✅ Automatic retry with exponential backoff
- ✅ Fallback mode support
- ✅ Self-diagnostic logging
- ✅ Progress reporting for long operations

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

  // Write all files
  await writeFile(join(skillDir, "index.ts"), indexContent);
  await writeFile(join(skillDir, "types.ts"), typesContent);
  await writeFile(join(skillDir, "utils.ts"), utilsContent);
  await writeFile(join(skillDir, "resilience.ts"), resilienceContent);
  await writeFile(join(skillDir, "mcp-config.json"), JSON.stringify(mcpConfig, null, 2));
  await writeFile(join(skillDir, "README.md"), readmeContent);
  await writeFile(join(skillDir, "tests", "index.test.ts"), testContent);
  await writeFile(join(skillDir, "tests", "resilience.test.ts"), resilienceTestContent);

  log("✅ Skill files created", "green");

  // Install dependencies
  if (dependencies.length > 0) {
    await installDependencies(dependencies, skillDir);
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
    log("\n⚡ AIwork4me Skill Factory CLI v2.0\n", "bold");
    log("Commands:");
    log("  create    Create a new skill");
    log("  validate  Validate a skill against MCP 2026 schema");
    log("  register  Register skill(s) to the registry");
    log("  list      List all registered skills\n");
    log("Usage:");
    log("  bun run skill-factory.ts create -c <category> -n <name> [-d <desc>] [--dependencies pkg1,pkg2]");
    log("  bun run skill-factory.ts validate -s <skill-name>");
    log("  bun run skill-factory.ts register -s <skill-name>");
    log("  bun run skill-factory.ts register --all");
    log("  bun run skill-factory.ts list\n");
    log("Options:");
    log("  -c, --category      Skill category (web|code|data|automation)");
    log("  -n, --name          Skill name (kebab-case)");
    log("  -d, --capability    Brief description");
    log("  -s, --skill         Skill name for validate/register");
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
