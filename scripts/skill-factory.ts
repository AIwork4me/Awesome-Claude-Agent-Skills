#!/usr/bin/env bun
/**
 * ⚡ Skill Factory CLI
 * Autonomous skill scaffolding for AIwork4me
 *
 * @aiwork4me
 * @version 1.0.0
 */

import { parseArgs } from "node:util";
import { mkdir, readFile, writeFile, readdir, exists } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");
const SKILLS_DIR = join(ROOT_DIR, "skills");
const REGISTRY_FILE = join(ROOT_DIR, "registry", "discovery.json");
const README_FILE = join(ROOT_DIR, "README.md");

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

function getCurrentTimestamp(): string {
  return new Date().toISOString();
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
// README UPDATE
// ═══════════════════════════════════════════════════════════════════════════

async function updateReadmeTable(registry: DiscoveryRegistry): Promise<void> {
  const readme = await readFile(README_FILE, "utf-8");

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

  const newTable = `${tableHeader}\n${tableRows}`;

  const updatedReadme = readme.replace(
    /\| Skill \| Category \| Capability \| MCP Command \| Status \|[\s\S]*?(?=\n\n> \*Registry)/,
    `${newTable}\n\n`
  );

  await writeFile(README_FILE, updatedReadme);
  log("✅ README Skill Registry updated", "green");
}

// ═══════════════════════════════════════════════════════════════════════════
// SKILL SCAFFOLDING
// ═══════════════════════════════════════════════════════════════════════════

async function createSkill(options: {
  category: string;
  name: string;
  capability?: string;
}): Promise<void> {
  const { category, name, capability = "AI-powered skill" } = options;
  const skillName = toKebabCase(name);
  const skillDir = join(SKILLS_DIR, category, skillName);

  // Check if skill already exists
  if (await exists(skillDir)) {
    log(`❌ Skill "${skillName}" already exists in category "${category}"`, "red");
    process.exit(1);
  }

  log(`\n🏭 Creating skill: ${skillName}`, "cyan");
  log(`   Category: ${category}`, "blue");
  log(`   Directory: ${skillDir}\n`, "blue");

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

export interface ${toPascalCase(skillName)}Input {
  /** Input parameter description */
  input: string;
}

export interface ${toPascalCase(skillName)}Output extends SkillLinkOutput {
  data: {
    result: string;
  };
}

/**
 * Main skill execution function
 */
export async function execute(
  input: ${toPascalCase(skillName)}Input
): Promise<${toPascalCase(skillName)}Output> {
  const startTime = Date.now();

  // Validate input
  validateInput(input);

  // Process request
  const result = await processRequest(input);

  return {
    data: { result },
    metadata: {
      skillName: "${skillName}",
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      nextSkillHint: undefined,
    },
  };
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

## 📚 API Reference

### \`execute(input)\`

Main skill execution function.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| input | string | ✅ | Input parameter |

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
    await expect(execute({ input: "" })).rejects.toThrow();
  });

  test("should include metadata in output", async () => {
    const result = await execute({ input: "test" });
    expect(result.metadata.duration).toBeGreaterThan(0);
    expect(result.metadata.timestamp).toBeDefined();
  });
});
`;

  // Write all files
  await writeFile(join(skillDir, "index.ts"), indexContent);
  await writeFile(join(skillDir, "types.ts"), typesContent);
  await writeFile(join(skillDir, "utils.ts"), utilsContent);
  await writeFile(join(skillDir, "mcp-config.json"), JSON.stringify(mcpConfig, null, 2));
  await writeFile(join(skillDir, "README.md"), readmeContent);
  await writeFile(join(skillDir, "tests", "index.test.ts"), testContent);

  log("✅ Skill files created", "green");

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
      input: [`input: string`],
      output: [`result: string`, `metadata: SkillMetadata`],
      chainable: true,
    },
    entrypoint: `./skills/${category}/${skillName}/index.ts`,
    dependencies: [],
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

function toPascalCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION
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
  const requiredFiles = ["index.ts", "types.ts", "utils.ts", "mcp-config.json", "README.md"];
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

  // Validate mcp-config.json
  try {
    const mcpConfig = JSON.parse(await readFile(join(skillDir, "mcp-config.json"), "utf-8"));

    // Check required fields
    const requiredFields = ["name", "version", "protocol", "tools", "skillLink"];
    for (const field of requiredFields) {
      if (mcpConfig[field]) {
        log(`  ✅ mcp-config.json has "${field}"`, "green");
      } else {
        log(`  ❌ mcp-config.json missing "${field}"`, "red");
        hasErrors = true;
      }
    }

    // Validate MCP 2026 protocol
    if (mcpConfig.protocol === "mcp-2026") {
      log(`  ✅ MCP protocol version: 2026`, "green");
    } else {
      log(`  ⚠️  MCP protocol version: ${mcpConfig.protocol} (expected: mcp-2026)`, "yellow");
    }
  } catch (e) {
    log(`  ❌ Failed to parse mcp-config.json`, "red");
    hasErrors = true;
  }

  if (hasErrors) {
    log(`\n❌ Validation failed with errors`, "red");
    process.exit(1);
  } else {
    log(`\n✅ Skill "${skill}" is valid!`, "green");
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
      help: { type: "boolean", short: "h" },
    },
    strict: false,
  });

  const command = positionals[0];

  if (values.help || !command) {
    log("\n⚡ AIwork4me Skill Factory CLI\n", "bold");
    log("Usage:");
    log("  bun run skill-factory.ts create --category=X --name=Y [--capability=Z]");
    log("  bun run skill-factory.ts validate --skill=X");
    log("  bun run skill-factory.ts list");
    log("  bun run skill-factory.ts register --skill=X\n");
    log("Options:");
    log("  -c, --category    Skill category (web|code|data|automation)");
    log("  -n, --name        Skill name (kebab-case)");
    log("  -d, --capability  Brief description");
    log("  -s, --skill       Skill name for validate/register");
    log("  -h, --help        Show this help\n");
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
      });
      break;

    case "validate":
      if (!values.skill) {
        log("❌ --skill is required for validate", "red");
        process.exit(1);
      }
      await validateSkill({ skill: values.skill });
      break;

    case "list":
      await listSkills();
      break;

    case "register":
      if (!values.skill) {
        log("❌ --skill is required for register", "red");
        process.exit(1);
      }
      log("⚠️  Register command not yet implemented", "yellow");
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
