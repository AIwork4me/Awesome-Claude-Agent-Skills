# AI Workflow Documentation

> How AI agents extend this repository

---

## 🤖 Overview

This repository is designed to be **AI-maintained**. Claude Code instances can autonomously:

1. **Discover** new skill opportunities
2. **Ingest** them using the skill factory
3. **Refine** raw implementations into premium skills

---

## 📋 Workflow Steps

### Step 1: Discovery

AI agents should scan these sources for new skill ideas:

| Source | URL | Look For |
|--------|-----|----------|
| MCP Registry | github.com/modelcontextprotocol/servers | New MCP servers |
| Anthropic Docs | docs.anthropic.com | New Claude features |
| GitHub Trending | github.com/trending | AI/LLM tools |

### Step 2: Ingestion

Use the skill-factory CLI:

```bash
bun run scripts/skill-factory.ts create \
  --category <web|code|data|automation> \
  --name <skill-name> \
  --capability "Brief description"
```

### Step 3: Refinement

Apply AIwork4me brand standards:

- Professional, geeky, practical tone
- Skill-Link compatibility
- MCP 2026 protocol compliance
- Comprehensive documentation

---

## 🔗 Skill-Link Protocol

Skills can chain together:

```typescript
const pipeline = [
  { skill: "openclaw-deep-research", input: { query: "MCP 2026" } },
  { skill: "ai-summarizer", input: "link:previous" },
];
```

---

## 📚 References

- [AGENT_HANDBOOK.md](/.claude/AGENT_HANDBOOK.md) - Complete AI instructions
- [skill-factory.ts](/scripts/skill-factory.ts) - CLI tool
- [MCP Starter Template](/templates/mcp-ts-starter/) - Gold-standard template

---

<div align="center">

*AIwork4me - Let AI work for me*

</div>
