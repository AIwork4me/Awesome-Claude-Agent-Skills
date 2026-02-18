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
- [ ] **AI Security Audit**: Run `claude-code audit --skill <name>` to ensure no prompt injection vulnerabilities
- [ ] **Resiliency Check**: Verify retry logic and fallback modes are implemented

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

5. **Resiliency (2026 Standard)**
   - Implement `retry_logic` for network-dependent tools
   - Add `fallback_mode` if the primary MCP server is unreachable
   - Include `self_diagnostic_logs` that Claude can read to fix bugs in the skill itself
   - Support graceful degradation when dependencies fail

---

## 🧠 Deep Reasoning Protocol

### Self-Correction (2026 Agent Standard)

Every AIwork4me skill must implement the **Self-Correction Protocol**:

```typescript
interface SelfCorrection {
  // Detect if skill is in an error state
  detectAnomaly(): Promise<AnomalyReport>;

  // Attempt automatic recovery
  autoRecover(anomaly: AnomalyReport): Promise<RecoveryResult>;

  // Log for human review if auto-recovery fails
  escalateToHuman(error: Error): void;
}
```

**Requirements:**
1. **Anomaly Detection**: Monitor execution patterns for unexpected behavior
2. **Auto-Recovery**: Implement at least one fallback strategy
3. **Escalation Path**: Clear logging when human intervention is needed
4. **Learning**: Store recovery patterns for future reference

### Streaming & Progress (Deep Agent Feature)

All long-running skills MUST implement progress reporting to prevent the Agent from "going dark":

```typescript
interface ProgressReporter {
  // Report current progress (0-100)
  reportProgress(percent: number, message: string): Promise<void>;

  // Report intermediate results
  reportIntermediate(data: PartialResult): Promise<void>;

  // Signal that skill is still alive
  heartbeat(): Promise<void>;
}
```

**Implementation Requirements:**
- Skills with execution time >5s must emit progress updates
- Progress updates at least every 2 seconds
- Include actionable status messages (e.g., "Fetching page 3 of 10")
- Support cancellation via AbortSignal

**Example:**
```typescript
async function execute(input: ResearchInput, reporter: ProgressReporter): Promise<Output> {
  await reporter.reportProgress(0, "Starting deep research...");

  for (let i = 0; i < queries.length; i++) {
    await reporter.reportProgress(
      (i / queries.length) * 100,
      `Processing query ${i + 1}/${queries.length}`
    );

    const result = await fetchWithRetry(queries[i]);
    await reporter.reportIntermediate({ partialResults: result });
  }

  await reporter.reportProgress(100, "Research complete");
  return finalResult;
}
```

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
        ├── resilience.ts         # Retry logic & fallback modes
        ├── progress.ts           # Progress reporting implementation
        ├── README.md             # Skill documentation
        └── tests/
            ├── index.test.ts     # Unit tests
            ├── resilience.test.ts # Resiliency tests
            └── security.test.ts   # Security audit tests
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
  },
  "deepAgent": {
    "supportsProgress": true,
    "supportsCancellation": true,
    "supportsSelfCorrection": true,
    "maxExecutionTime": 30000
  },
  "resourceProfile": {
    "intensity": "medium",
    "estimatedTokenUsage": "1k-5k",
    "estimatedDuration": "5-15s",
    "memoryRequirement": "low"
  }
}
```

### Resource Profile Specification

When creating skills, define the `resourceProfile` to enable cost estimation in orchestration platforms (Dify, LangChain, etc.):

| Field | Type | Values | Description |
|-------|------|--------|-------------|
| `intensity` | string | `low`, `medium`, `high`, `critical` | Computational intensity level |
| `estimatedTokenUsage` | string | e.g., `"1k-5k"`, `"10k-50k"` | Expected token consumption range |
| `estimatedDuration` | string | e.g., `"1-5s"`, `"30-60s"` | Expected execution time |
| `memoryRequirement` | string | `low`, `medium`, `high` | Memory footprint |

**Intensity Levels:**
- **low**: Simple transformations, no external calls
- **medium**: API calls, basic processing
- **high**: Multi-step research, web scraping, complex analysis
- **critical**: Deep reasoning, multi-model orchestration, long-running tasks

**Example Profiles:**
```json
// Simple utility skill
"resourceProfile": {
  "intensity": "low",
  "estimatedTokenUsage": "100-500",
  "estimatedDuration": "<1s",
  "memoryRequirement": "low"
}

// Deep research skill
"resourceProfile": {
  "intensity": "high",
  "estimatedTokenUsage": "10k-50k",
  "estimatedDuration": "30-120s",
  "memoryRequirement": "medium"
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
  // 2026: Deep Agent extensions
  diagnostics?: {
    warnings: string[];
    recoveryAttempts: number;
    finalState: 'success' | 'degraded' | 'failed';
  };
}
```

When implementing a skill, ensure:
1. Output conforms to `SkillLinkOutput` interface
2. Include `nextSkillHint` for suggested chaining
3. Document compatible upstream/downstream skills
4. Include `diagnostics` for self-healing pipelines

### Generating `nextSkillHint` (Critical)

**IMPORTANT**: When generating `nextSkillHint`, you MUST use the `registry/discovery.json` to find matching skills. **DO NOT hallucinate skill names.**

```typescript
// ✅ CORRECT: Query the registry
async function generateNextSkillHint(output: ResearchOutput): Promise<string | undefined> {
  const registry = await loadRegistry();

  // Find skills that match the output type and category
  const candidates = registry.skills.filter(skill =>
    skill.skillLink.input.some(input =>
      input.includes(output.metadata.skillName) ||
      input.includes('ResearchOutput')
    )
  );

  if (candidates.length > 0) {
    return candidates[0].name;
  }

  return undefined;
}

// ❌ WRONG: Hardcoding or guessing
return "ai-summarizer"; // May not exist!
```

**Registry Lookup Pattern:**
```bash
# Check discovery.json for available skills
cat registry/discovery.json | jq '.skills[] | {name, category, capability}'
```

**Common Skill-Link Chains (from registry):**
| Upstream | Downstream | Use Case |
|----------|------------|----------|
| `openclaw-deep-research` | `ai-summarizer` | Research → Summary |
| `ai-summarizer` | `github-issue-bot` | Summary → Issue Creation |
| `content-extractor` | `data-formatter` | Extract → Format |

---

## 🔒 Security Audit Protocol

Before any skill is registered, run the AI-driven security audit:

```bash
# Run security audit
claude-code audit --skill <skill-name>

# Audit checks for:
# - Prompt injection vulnerabilities
# - Unsafe eval() or exec() usage
# - Exposed secrets in code
# - Unvalidated external inputs
# - SSRF vulnerabilities
# - Path traversal risks
```

**Security Checklist:**
- [ ] No user input passed directly to eval/exec
- [ ] All external URLs validated against allowlist
- [ ] No hardcoded credentials
- [ ] File paths sanitized
- [ ] Rate limiting implemented for external APIs
- [ ] **Context-Awareness**: Ensure the skill does NOT leak local environment variables (like `PATH`, `HOME`, `USER`, API keys) to the LLM response unless explicitly required by the skill's functionality
- [ ] **Cloud/Edge Safety**: Skills running in hybrid cloud or edge environments must sanitize outputs of any system-specific information (hostnames, internal IPs, container IDs)

---

## ⚡ Quick Commands

| Action | Command |
|--------|---------|
| Create skill | `bun run scripts/skill-factory.ts create --category=X --name=Y` |
| Validate skill | `bun run scripts/skill-factory.ts validate --skill=X` |
| Update registry | `bun run scripts/skill-factory.ts register --skill=X` |
| Security audit | `claude-code audit --skill=X` |
| Run tests | `bun test` |
| Build all | `bun run build` |

---

## 🎨 AIwork4me Brand Guidelines

When creating documentation:

- **Tone**: Professional, geeky, practical
- **Style**: Concise, code-first, example-rich
- **Colors**: Primary `#FF6B35`, Secondary `#4A90D9`, Accent `#22C55E`
- **Keywords**: Autonomous, AI-native, Skill-Link, MCP 2026, Deep Agent, Self-Healing

---

## 📱 Contact & Community

- **WeChat Official Account**: AIwork4me (AI替我干活)
- **GitHub**: https://github.com/AIwork4me
- **Philosophy**: *Let AI work for me*

---

<div align="center">

**Remember**: You are building the future of AI-native development.

*Every skill you create is a step towards autonomous productivity.*

**2026 Deep Agent Standard**: Self-Correcting | Progress-Aware | Security-First

</div>
