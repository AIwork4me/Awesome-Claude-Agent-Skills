<div align="center">

# ⚡ Awesome Claude Agent Skills

### _The Autonomous Skill Factory for AI-Native Development_

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&pause=1000&color=58A6FF&center=true&vCenter=true&width=600&lines=Self-Evolving+MCP+Skills;AI-Maintained+Registry;Skill-Link+Architecture" alt="Typing SVG" />

---

<img src="https://img.shields.io/badge/AIwork4me-Brand-FF6B35?style=for-the-badge&logo=robot&logoColor=white" />
<img src="https://img.shields.io/badge/MCP-2026_Protocol-4A90D9?style=for-the-badge&logo=protocol&logoColor=white" />
<img src="https://img.shields.io/badge/Architecture-Autonomous-22C55E?style=for-the-badge&logo=autonomous&logoColor=white" />
<img src="https://img.shields.io/badge/Standard-Deep_Agent-8B5CF6?style=for-the-badge&logo=shield&logoColor=white" />

</div>

---

## 🧠 About

**Awesome-Claude-Agent-Skills** is a **self-evolving ecosystem** of MCP-compliant skills designed for Claude Code and AI agents. Every skill follows the **AIwork4me** philosophy: *Let AI work for me.*

> ⚡ **Key Innovation**: Skills can chain together via **Skill-Link** - pass outputs directly to the next skill in the pipeline.

### 🛡️ 2026 Deep Agent Standard

All factory-generated skills are **Self-Healing**, **Progress-Aware**, and **Security-First** by default:

| Feature | Description |
|---------|-------------|
| 🔄 **Self-Healing** | Automatic anomaly detection, retry with exponential backoff, fallback strategies |
| 📊 **Progress-Aware** | Real-time progress reporting (0-100%), intermediate results, heartbeat signals |
| 🔒 **Security-First** | Input sanitization, SSRF prevention, prompt injection protection, path traversal blocking |

---

## 🌐 AIwork4me Ecosystem

This repository is part of the **AIwork4me** autonomous development matrix:

```
┌─────────────────────────────────────────────────────────────────┐
│                     AIwork4me Ecosystem                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────┐    ┌─────────────────────┐           │
│  │  Awesome-Claude-    │    │    MCP Servers      │           │
│  │  Agent-Skills       │───▶│    (This Repo)      │           │
│  │  (Skill Factory)    │    │                     │           │
│  └─────────────────────┘    └─────────────────────┘           │
│           │                          │                          │
│           ▼                          ▼                          │
│  ┌─────────────────────┐    ┌─────────────────────┐           │
│  │   OpenClaw Deep     │    │   Dify / LangChain  │           │
│  │   Research Engine   │    │   Orchestration     │           │
│  └─────────────────────┘    └─────────────────────┘           │
│                                                                 │
│  ┌─────────────────────────────────────────────────┐           │
│  │              Claude Code Agent                  │           │
│  │         (Autonomous Skill Execution)            │           │
│  └─────────────────────────────────────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Skill Registry

<!-- SKILL_REGISTRY_START -->
| Skill | Category | Capability | MCP Command | Deep Agent | Status |
|-------|----------|------------|-------------|------------|--------|
| [openclaw-deep-research](./skills/web/openclaw-deep-research) | Web | Multi-step search & scrape with OpenClaw | `mcp__openclaw__deep_research` | ✅ Full | ✅ Production |
<!-- SKILL_REGISTRY_END -->

> *Registry auto-updated by `skill-factory.ts`*

---

## 🏗️ Architecture

```
Awesome-Claude-Agent-Skills/
├── 📁 skills/                 # Modular skill housing
│   ├── web/                   # Web interaction skills
│   ├── code/                  # Code generation & analysis
│   ├── data/                  # Data processing skills
│   └── automation/            # Workflow automation
├── 📁 templates/
│   └── mcp-ts-starter/        # Gold-standard MCP server template
├── 📁 registry/
│   └── discovery.json         # Centralized skill metadata
├── 📁 scripts/
│   └── skill-factory.ts       # Autonomous skill scaffolding (v2.1)
├── 📁 docs/ai-workflow/       # AI agent documentation
├── 📁 .claude/
│   └── AGENT_HANDBOOK.md      # Internal memory for Claude instances
└── 📄 README.md               # This file
```

---

## 🚀 Quick Start

### For Humans (with Claude Code)

```bash
# 1. Clone the repository
git clone https://github.com/AIwork4me/Awesome-Claude-Agent-Skills.git

# 2. Create a new skill in < 60 seconds
bun run scripts/skill-factory.ts create --category=web --name=my-awesome-skill

# 3. Run security audit (2026 Standard)
bun run scripts/skill-factory.ts audit --skill=my-awesome-skill

# 4. That's it! Claude Code handles the rest.
```

### For AI Agents

Read `.claude/AGENT_HANDBOOK.md` for complete instructions on:
- **Discover**: Scan external sources for new MCP ideas
- **Ingest**: Use `skill-factory.ts` to add new skills
- **Refine**: Wrap raw tools into AIwork4me premium standard

---

## 🤖 AI-First Contribution Guide

This repository is designed for **human-AI pair programming**. Here's how to add a new skill in under 60 seconds:

### Step 1: Describe Your Skill (5s)

Open Claude Code and say:
> "Add a new skill called `github-issue-bot` in category `automation` that creates GitHub issues from natural language"

### Step 2: Claude Does Everything (55s)

Claude Code will:
1. ✅ Run `skill-factory.ts create` to scaffold the skill
2. ✅ Generate MCP-compliant server code with Deep Agent Standard
3. ✅ Create `progress.ts` for progress reporting
4. ✅ Create `resilience.ts` for self-healing logic
5. ✅ Create `security.test.ts` for security audit
6. ✅ Update `discovery.json` registry
7. ✅ Update this README's Skill Registry table

### Step 3: Review & Commit

```bash
git add . && git commit -m "feat: add github-issue-bot skill"
```

---

## 🔗 Skill-Link Architecture

Skills can chain together for complex workflows with **2026 Enhanced Pipeline**:

```typescript
import { SkillLink } from "@aiwork4me/skill-link";

// 2026 Enhanced Pipeline with Auto-Recovery
const pipeline = [
  {
    skill: "openclaw-deep-research",
    input: { query: "MCP protocol 2026 best practices" }
  },
  {
    skill: "ai-summarizer",
    options: { detail: "high", maxLength: 2000 }
  },
  {
    skill: "github-issue-bot",
    options: { labels: ["research", "automation"] }
  }
];

// Execute with Deep Agent features
const result = await SkillLink.execute(pipeline, {
  // Auto-recovery: automatically retry on failure
  autoRecover: true,
  maxRetries: 3,

  // Progress reporting: real-time feedback
  onProgress: (p) => {
    console.log(`[${p.step}/${p.total}] ${p.skill}: ${p.message}`);
  },

  // Diagnostics: track pipeline health
  onDiagnostic: (d) => {
    if (d.warnings.length > 0) {
      console.warn(`Warnings: ${d.warnings.join(", ")}`);
    }
  }
});

// Access self-healing metadata
console.log(result.diagnostics);
// {
//   warnings: [],
//   recoveryAttempts: 0,
//   finalState: 'success',
//   totalDuration: 15234
// }
```

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [AGENT_HANDBOOK.md](./.claude/AGENT_HANDBOOK.md) | Internal memory for Claude instances |
| [AI Workflow Guide](./docs/ai-workflow/) | How AI agents extend this repo |
| [MCP Starter Template](./templates/mcp-ts-starter/) | Gold-standard skill template |

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Bun (2026 fastest JS runtime) |
| **Protocol** | MCP 2026 Specification |
| **Language** | TypeScript 5.x |
| **Architecture** | Autonomous Skill Factory |
| **Standard** | Deep Agent 2026 |

---

## 📱 Stay Connected

<div align="center">

<img src="aiwork4me.jpg" alt="AIwork4me QR Code" width="180"/>

**Scan to get the latest Deep Agent Skills & MCP Servers**

*Building the future, one agent at a time.*

</div>

---

## 📄 License

MIT License © 2026 AIwork4me

---

<div align="center">

**Let AI work for me.**

*© 2026 AIwork4me. Crafted with 🤖 by Claude Code.*

**2026 Deep Agent Standard**: Self-Healing | Progress-Aware | Security-First

</div>
