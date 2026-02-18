# MCP TypeScript Starter Template

> Gold-standard TypeScript MCP server template for AIwork4me skills

<div align="center">

<img src="https://img.shields.io/badge/AIwork4me-Template-FF6B35?style=for-the-badge" />
<img src="https://img.shields.io/badge/MCP-2026_Protocol-4A90D9?style=for-the-badge" />
<img src="https://img.shields.io/badge/Runtime-Bun-22C55E?style=for-the-badge" />

</div>

---

## 📋 Overview

This template provides everything you need to create a new MCP-compliant skill for the AIwork4me ecosystem.

## 🚀 Quick Start

```bash
# 1. Copy template
cp -r templates/mcp-ts-starter skills/[category]/[your-skill-name]

# 2. Navigate to new skill
cd skills/[category]/[your-skill-name]

# 3. Replace placeholders
# Replace {{SKILL_NAME}} and {{SKILL_DESCRIPTION}} in all files

# 4. Install dependencies
bun install

# 5. Start development
bun run dev
```

## 📁 Template Structure

```
mcp-ts-starter/
├── src/
│   └── index.ts          # Main entry point
├── mcp-config.json       # MCP 2026 configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md             # This file
```

## 🔧 Customization

### 1. Update Placeholders

Search and replace in all files:

| Placeholder | Replace With |
|-------------|--------------|
| `{{SKILL_NAME}}` | Your skill name (kebab-case) |
| `{{SKILL_DESCRIPTION}}` | Brief description |

### 2. Implement Your Logic

Edit `src/index.ts` and implement the `execute()` function:

```typescript
export async function execute(input: SkillInput): Promise<SkillLinkOutput> {
  const startTime = Date.now();

  // Validate input
  validateInput(input);

  // ========================================
  // TODO: Implement your skill logic here
  // ========================================

  const result = {
    // Your result here
  };

  return {
    result,
    metadata: createMetadata(Date.now() - startTime),
  };
}
```

### 3. Update MCP Config

Edit `mcp-config.json` to define your tool's input/output schema.

## 🔗 Skill-Link Compatibility

All skills created from this template are **Skill-Link compatible** by default:

```typescript
interface SkillLinkOutput {
  result: unknown;
  metadata: {
    skillName: string;
    timestamp: string;
    duration: number;
    version: string;
  };
  nextSkillHint?: string;
  chainHistory?: string[];
}
```

## 🧪 Testing

```bash
# Run tests
bun test

# Run with coverage
bun test --coverage
```

## 📚 Resources

- [MCP 2026 Specification](https://modelcontextprotocol.io/docs)
- [AIwork4me Agent Handbook](/.claude/AGENT_HANDBOOK.md)
- [Skill Factory CLI](/scripts/skill-factory.ts)

---

<div align="center">

*Part of [AIwork4me](https://github.com/AIwork4me) ecosystem.*

**Let AI work for me.**

</div>
