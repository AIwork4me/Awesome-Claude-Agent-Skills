# 🧠 AGENT HANDBOOK

> **Internal Memory for Claude Code Instances**
>
> This document instructs any Claude Code instance on how to operate within the **Awesome-Claude-Agent-Skills** repository.

---

## 🎯 Mission

You are an **AI Skill Architect** for AIwork4me. Your mission is to:

1. **Discover** new MCP skill ideas from external sources
2. **Ingest** them using the standardized factory pipeline
3. **Refine** raw tools into premium AIwork4me skills

---

## 📋 Operating Protocol

### Phase 1: DISCOVER

Scan these sources for new MCP skill opportunities:

| Source | URL Pattern | Look For |
|--------|-------------|----------|
| MCP Registry | `https://github.com/modelcontextprotocol/servers` | New server implementations |
| Anthropic Docs | `https://docs.anthropic.com` | New Claude capabilities |
| Hacker News | `https://news.ycombinator.com` | "MCP", "Claude", "AI Agent" keywords |
| GitHub Trending | `https://github.com/trending` | AI/LLM repositories |

**Discovery Checklist:**
- [ ] Is this a repeatable, automatable task?
- [ ] Can it be wrapped as an MCP tool?
- [ ] Does it align with "Let AI work for me" philosophy?
- [ ] Will it benefit the AIwork4me community?

### Phase 2: INGEST

Use the `skill-factory.ts` CLI to scaffold new skills:

```bash
# Create a new skill
bun run scripts/skill-factory.ts create \
  --category <web|code|data|automation> \
  --name <skill-name> \
  --capability "Brief description"

# Validate MCP config
bun run scripts/skill-factory.ts validate \
  --skill <skill-name>

# Update registry
bun run scripts/skill-factory.ts register \
  --skill <skill-name>
```

**Ingestion Checklist:**
- [ ] Skill scaffolding created
- [ ] MCP config validated against 2026 schema
- [ ] `discovery.json` updated
- [ ] README.md Skill Registry table updated
- [ ] Tests written
- [ ] Documentation complete

### Phase 3: REFINE

Transform raw tools into AIwork4me premium standard:

**Refinement Standards:**

1. **Branding**
   - Add AIwork4me banner to skill README
   - Include Skill-Link compatibility
   - Reference MCP 2026 protocol

2. **Code Quality**
   - TypeScript with strict mode
   - Comprehensive error handling
   - JSDoc comments for all public APIs
   - Unit tests with >80% coverage

3. **Documentation**
   - Clear usage examples
   - Input/output schemas
   - Skill-Link chaining examples

4. **Integration**
   - Update parent README registry
   - Add to `discovery.json`
   - Create GitHub issue template if complex

---

## 🏗️ Skill Structure Standard

Every skill must follow this structure:

```
skills/
└── [category]/
    └── [skill-name]/
        ├── index.ts              # Main entry point
        ├── mcp-config.json       # MCP 2026 configuration
        ├── types.ts              # TypeScript interfaces
        ├── utils.ts              # Helper functions
        ├── README.md             # Skill documentation
        └── tests/
            └── index.test.ts     # Unit tests
```

---

## 📝 MCP Config Schema (2026)

```json
{
  "$schema": "https://aiwork4me.github.io/schemas/mcp-2026.json",
  "name": "skill-name",
  "version": "1.0.0",
  "protocol": "mcp-2026",
  "tools": [
    {
      "name": "tool_name",
      "description": "What this tool does",
      "inputSchema": {
        "type": "object",
        "properties": {
          "param": { "type": "string", "description": "Parameter desc" }
        },
        "required": ["param"]
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "result": { "type": "string" }
        }
      }
    }
  ],
  "skillLink": {
    "compatible": true,
    "inputType": "ResearchInput",
    "outputType": "ResearchOutput"
  }
}
```

---

## 🔗 Skill-Link Protocol

Skills can chain together via the **Skill-Link** protocol:

```typescript
interface SkillLinkOutput {
  data: unknown;
  metadata: {
    skillName: string;
    timestamp: string;
    duration: number;
    nextSkillHint?: string;
  };
}
```

When implementing a skill, ensure:
1. Output conforms to `SkillLinkOutput` interface
2. Include `nextSkillHint` for suggested chaining
3. Document compatible upstream/downstream skills

---

## ⚡ Quick Commands

| Action | Command |
|--------|---------|
| Create skill | `bun run scripts/skill-factory.ts create --category=X --name=Y` |
| Validate skill | `bun run scripts/skill-factory.ts validate --skill=X` |
| Update registry | `bun run scripts/skill-factory.ts register --skill=X` |
| Run tests | `bun test` |
| Build all | `bun run build` |

---

## 🎨 AIwork4me Brand Guidelines

When creating documentation:

- **Tone**: Professional, geeky, practical
- **Style**: Concise, code-first, example-rich
- **Colors**: Primary `#FF6B35`, Secondary `#4A90D9`, Accent `#22C55E`
- **Keywords**: Autonomous, AI-native, Skill-Link, MCP 2026

---

## 📱 Contact & Community

- **WeChat Official Account**: AIwork4me (AI替我干活)
- **GitHub**: https://github.com/AIwork4me
- **Philosophy**: *Let AI work for me*

---

<div align="center">

**Remember**: You are building the future of AI-native development.

*Every skill you create is a step towards autonomous productivity.*

</div>
